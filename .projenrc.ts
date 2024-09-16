import { awscdk } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';

const cdkVersion = '2.80.0';
const constructsVersion = '10.3.0';
const minNodeVersion = '18.0.0';
const jsiiVersion = '~5.0.0';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Jayson Rawlins',
  authorAddress: 'JaysonJ.Rawlins@gmail.com',
  description: 'A CDK construct that helps build IAM policies using the AWS IAM Policy Builder dump. Normally it is better to use cdk-iam-floyd, However, I found that cdk-iam-floyd currently is not jsii compliant so I wasn\'t able to use it in my jsii compliant projects in languages that are not typescript or python.',
  keywords: [
    'aws',
    'cdk',
    'iam-policy',
    'iam-actions',
  ],
  cdkVersion: cdkVersion,
  constructsVersion: constructsVersion,
  projenDevDependency: false,
  defaultReleaseBranch: 'main',
  minNodeVersion: minNodeVersion,
  jsiiVersion: jsiiVersion,
  name: '@jjrawlins/cdk-iam-policy-builder-helper',
  npmAccess: NpmAccess.PUBLIC,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/jjrawlins/cdk-iam-policy-builder-helper-construct.git',
  githubOptions: {
    mergify: false,
    pullRequestLint: false,
  },
  depsUpgrade: false,
  publishToPypi: {
    distName: 'jjrawlins.cdk-iam-policy-builder-helper',
    module: 'jjrawlins.cdk_iam_policy_builder_helper',
  },
  publishToGo: {
    moduleName: 'github.com/jjrawlins/cdk-iam-policy-builder-helper-construct',
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
  eslint: true,
});

// Add 'download-policies' task to the 'prebuild' phase of the build process
project.preCompileTask.exec(`ts-node ./src/bin/download-actions-json.ts &&
ts-node ./src/bin/download-managed-policies-json.ts &&
ts-node ./src/bin/create-actions-json.ts`);

project.github!.actions.set('actions/checkout', 'actions/checkout@v4');
project.github!.actions.set('actions/setup-node', 'actions/setup-node@v4');
project.github!.actions.set('actions/upload-artifact', 'actions/upload-artifact@v4');
project.github!.actions.set('actions/download-artifact', 'actions/download-artifact@v4');

const releaseWorkflow = project.github!.tryFindWorkflow('release');
if (releaseWorkflow) {
  releaseWorkflow.file!.addOverride('jobs.release.steps.8.with.include-hidden-files', true);
}

project.synth();