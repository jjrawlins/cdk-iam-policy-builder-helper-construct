import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ManagedPolicies } from '../src';

describe('Smoke Test ManagedPolicies Helper Properties', () => {
  test('Smoke Test Managed Policies', () => {
    console.log(ManagedPolicies.AmazonElastiCacheFullAccess.PolicyName);
    expect(ManagedPolicies.AmazonElastiCacheFullAccess.PolicyName).toBe('AmazonElastiCacheFullAccess');
    expect(ManagedPolicies.AmazonElastiCacheFullAccess.Arn).toBe('arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess');
    expect(ManagedPolicies.AmazonFSxConsoleFullAccess.PolicyName).toBe('AmazonFSxConsoleFullAccess');
    expect(ManagedPolicies.AmazonFSxConsoleFullAccess.Arn).toBe('arn:aws:iam::aws:policy/AmazonFSxConsoleFullAccess');
  });

  test('Create an IAM Role using Actions and Managed Policies', () => {
    const app = new App();
    const fakeEnv = {
      account: '123456789012',
      region: 'eu-central-1',
    };
    const stack = new Stack(app, 'MyStack', {
      stackName: 'MyStackManagedPolicies',
      env: fakeEnv,
    });
    new Role(stack, 'MyRole', {
      roleName: 'MyRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(stack, 'LambdaBasicExecutionRolePolicy', ManagedPolicies.AWSLambdaBasicExecutionRole.Arn),
        ManagedPolicy.fromManagedPolicyName(stack, 'LambdaVpcPolicy', ManagedPolicies.AWSLambdaVPCAccessExecutionRole.PolicyName),
      ],
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
