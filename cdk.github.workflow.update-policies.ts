import { GroupRunnerOptions } from 'projen';
import { AwsCdkConstructLibrary, AwsCdkTypeScriptApp } from 'projen/lib/awscdk';
import { GithubWorkflow } from 'projen/lib/github';
import {
  ContainerOptions,
  Job,
  JobCallingReusableWorkflow,
  JobDefaults,
  JobPermissions,
  JobStep,
  JobStepOutput,
  JobStrategy,
  Tools,
  Triggers,
} from 'projen/lib/github/workflows-model';

export interface BranchWorkflowOptions {
  workflowName?: string;
  triggers?: Triggers;
  jobs?: Job[];
}

export class GithubWorkflowDefinition extends GithubWorkflow {
  constructor(project: AwsCdkTypeScriptApp | AwsCdkConstructLibrary, options: BranchWorkflowOptions) {
    super(project.github!, options.workflowName ?? 'CustomGithubWorkflow');
    if (options.triggers) this.on(options.triggers);
    const jobs = options.jobs ?? [];
    let i = 0;
    for (const job of jobs) {
      this.addJobs({
        [job.name ?? 'default' + i]: job,
      });
      i++;
    }
  }
}

export class JobDefinition implements Job {
  readonly concurrency: unknown;
  readonly container: ContainerOptions | undefined;
  readonly continueOnError: boolean | undefined;
  readonly defaults: JobDefaults | undefined;
  readonly env: Record<string, string> | undefined;
  readonly environment: unknown | undefined;
  readonly if: string | undefined;
  readonly name: string;
  readonly needs: string[] | undefined;
  readonly outputs: Record<string, JobStepOutput> | undefined;
  readonly permissions: JobPermissions;
  readonly runsOn: string[];
  readonly runsOnGroup: GroupRunnerOptions | undefined;
  readonly secrets: string | Record<string, string> | undefined;
  readonly services: Record<string, ContainerOptions> | undefined;
  readonly steps: JobStep[];
  readonly strategy: JobStrategy | undefined;
  readonly timeoutMinutes: number;
  readonly tools: Tools | undefined;
  readonly with: Record<string, string | boolean> | undefined;

  constructor(props: Job) {
    this.concurrency = props.concurrency;
    this.container = props.container;
    this.continueOnError = props.continueOnError;
    this.defaults = props.defaults;
    this.env = props.env;
    this.environment = props.environment;
    this.if = props.if;
    this.name = props.name ?? 'default';
    this.needs = props.needs;
    this.outputs = props.outputs;
    this.permissions = props.permissions;
    this.runsOn = props.runsOn ?? ['ubuntu-latest'];
    this.runsOnGroup = props.runsOnGroup;
    this.services = props.services;
    this.steps = props.steps;
    this.strategy = props.strategy;
    this.timeoutMinutes = props.timeoutMinutes ?? 60;
    this.tools = props.tools;
  }
}

export class JobReusableWorkflow implements JobCallingReusableWorkflow {
  readonly concurrency: unknown;
  readonly if: string | undefined;
  readonly needs: string[] | undefined;
  readonly permissions: JobPermissions;
  readonly secrets: string | Record<string, string> | undefined;
  readonly strategy: JobStrategy | undefined;
  readonly name: string | undefined;
  readonly uses: string;
  readonly with: Record<string, string | boolean> | undefined;

  constructor(props: JobCallingReusableWorkflow) {
    this.concurrency = props.concurrency;
    this.if = props.if;
    this.needs = props.needs;
    this.permissions = props.permissions;
    this.secrets = props.secrets;
    this.strategy = props.strategy;
    this.name = props.name;
    this.uses = props.uses;
    this.with = props.with;
  }
}
