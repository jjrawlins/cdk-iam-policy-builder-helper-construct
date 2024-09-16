import { awscdk, github } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { NpmAccess } from 'projen/lib/javascript';
import { GithubWorkflowDefinition, JobDefinition } from './cdk.github.workflow.update-policies';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Jayson Rawlins',
  authorAddress: 'jayson.rawlins@layerborn.io',
  description: 'A CDK construct that helps build IAM policies using the AWS IAM Policy Builder dump. Normally it is better to use cdk-iam-floyd, However, I found that cdk-iam-floyd currently is not jsii compliant so I wasn\'t able to use it in my jsii compliant projects in languages that are not typescript or python.',
  keywords: [
    'aws',
    'cdk',
    'iam-policy',
    'iam-actions',
  ],
  cdkVersion: '2.80.0',
  constructsVersion: '10.3.0',
  projenDevDependency: false,
  defaultReleaseBranch: 'main',
  minNodeVersion: '18.0.0',
  jsiiVersion: '~5.0.0',
  name: '@layerborn/cdk-iam-policy-builder-helper',
  npmAccess: NpmAccess.PUBLIC,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/layerborn/cdk-iam-policy-builder-helper-construct.git',
  githubOptions: {
    mergify: false,
    pullRequestLint: false,
    projenCredentials: GithubCredentials.fromApp({
      permissions: {
        pullRequests: github.workflows.AppPermission.WRITE,
        contents: github.workflows.AppPermission.WRITE,
        workflows: github.workflows.AppPermission.WRITE,
      },
    }),
  },
  depsUpgrade: false,
  publishToPypi: {
    distName: 'layerborn.cdk-iam-policy-builder-helper',
    module: 'layerborn.cdk_iam_policy_builder_helper',
  },
  publishToGo: {
    moduleName: 'github.com/layerborn/cdk-iam-policy-builder-helper-construct',
  },
  bundledDeps: [
    '@aws-sdk/client-iam',
    'axios',
    'jsonc-parser',
  ],
  deps: [
    'projen',
  ],
  devDeps: [
    '@types/axios',
    '@aws-sdk/types',
    '@types/node',
  ],
  gitignore: [
    'methods_list.txt',
    '~*.yml',
  ],
  tsconfigDev: {
    compilerOptions: {
      lib: ['es2019'],
      resolveJsonModule: true,
    },
    include: [
      'cdk.github.workflow.*.ts',
    ],
  },
  eslint: true,

});

project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.build.permissions.id-token', 'write');

project.addTask('download-policies', {
  exec: `ts-node ./src/bin/download-actions-json.ts
ts-node ./src/bin/download-managed-policies-json.ts
ts-node ./src/bin/create-actions-json.ts`,
  description: 'Download the latest IAM policies from AWS',
});

const downloadLatestPolicy = new JobDefinition({
  name: 'download-latest-policies',
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: github.workflows.JobPermission.WRITE,
    idToken: github.workflows.JobPermission.WRITE,
  },
  outputs: {
    patch_created: {
      stepId: 'create_patch',
      outputName: 'patch_created',
    },
  },
  steps: [
    {
      name: 'Checkout',
      uses: 'actions/checkout@v3',
      with: {
        ref: 'main',
      },
    },
    {
      name: 'Set AWS Credentials',
      uses: 'aws-actions/configure-aws-credentials@v3',
      with: {
        'role-to-assume': 'arn:aws:iam::${{ secrets.AWS_PROJEN_BUILD_ACCOUNT_ID }}:role/GitHubActions',
        'role-duration-seconds': 3600,
        'aws-region': '${{ secrets.AWS_PROJEN_BUILD_REGION }}',
        'role-skip-session-tagging': true,
        'role-session-name': 'GitHubActions',
      },
    },
    {
      name: 'Setup Node.js 18',
      uses: 'actions/setup-node@v3',
    },
    {
      name: 'Install Yarn',
      run: 'npm install -g yarn',
    },
    {
      name: 'Install dependencies',
      run: 'yarn install --check-files',
    },
    {
      name: 'download-policies',
      run: `ts-node ./src/bin/download-actions-json.ts
ts-node ./src/bin/download-managed-policies-json.ts
ts-node ./src/bin/create-actions-json.ts
npx eslint --fix ./src/constructs/Actions.ts
npx eslint --fix ./src/constructs/ManagedPolicies.ts`,
    },
    {
      name: 'Find mutations',
      id: 'create_patch',
      run: `git add .
git diff --staged --patch --exit-code > .repo.patch || echo "patch_created=true" >> $GITHUB_OUTPUT`,
    },
    {
      name: 'Upload patch',
      uses: 'actions/upload-artifact@v2',
      with: {
        name: '.repo.patch',
        path: '.repo.patch',
      },
    },
  ],
});


const createPullRequest = new JobDefinition({
  name: 'create-pull-request',
  runsOn: ['ubuntu-latest'],
  needs: ['download-latest-policies'],
  permissions: {
    contents: github.workflows.JobPermission.READ,
  },
  if: '${{ needs.download-latest-policies.outputs.patch_created }}',
  steps: [
    {
      name: 'Generate Token',
      id: 'generate_token',
      uses: 'tibdex/github-app-token@021a2405c7f990db57f5eae5397423dcc554159c',
      with: {
        app_id: '${{ secrets.PROJEN_APP_ID }}',
        private_key: '${{ secrets.PROJEN_APP_PRIVATE_KEY }}',
        permissions: '${{ needs.download-latest-policies.outputs.patch_created }}',
      },
    },
    {
      name: 'Checkout',
      uses: 'actions/checkout@v3',
      with: {
        ref: 'main',
      },
    },
    {
      name: 'Download patch',
      uses: 'actions/download-artifact@v3',
      with: {
        name: '.repo.patch',
        path: '${{ runner.temp }}',
      },
    },
    {
      name: 'Apply patch',
      run: '[ -s ${{ runner.temp }}/.repo.patch ] && git apply ${{ runner.temp }}/.repo.patch || echo "Empty patch. Skipping."',
    },
    {
      name: 'Set git identity',
      run: `git config user.name "github-actions"
git config user.email "github-actions@github.com"`,
    },
    {
      name: 'Create Pull Request',
      id: 'create-pr',
      uses: 'peter-evans/create-pull-request@v4',
      with: {
        'token': '${{ steps.generate_token.outputs.token }}',
        'commit-message': 'chore(deps): upgrade dependencies\n\nUpgrades project dependencies. See details in [workflow run].\n\n[Workflow Run]: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\n\n------\n\n*Automatically created by projen via the "upgrade-main" workflow*',
        'branch': 'github-actions/upgrade-main',
        'title': 'chore(deps): upgrade dependencies',
        'body': 'Upgrades project dependencies. See details in [workflow run].\n\n[Workflow Run]: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\n\n------\n\n*Automatically created by projen via the "upgrade-main" workflow*',
        'author': 'github-actions <github-actions@github.com>',
        'committer': 'github-actions <github-actions@github.com>',
        'signoff': true,
      },
    },
  ],
});
new GithubWorkflowDefinition(project, {
  workflowName: 'download-latest-policies',
  jobs: [
    downloadLatestPolicy,
    createPullRequest,
  ],
  triggers: {
    schedule: [{
      cron: '0 0 * * FRI',
    }],
  },
});
project.postCompileTask.exec('rm tsconfig.json');
project.eslint!.allowDevDeps('cdk.github.workflows.ts');
project.synth();
