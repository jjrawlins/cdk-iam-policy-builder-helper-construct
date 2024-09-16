import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Actions, ManagedPolicies } from '../src';


describe('Smoke Test Actions Helper Properties', () => {
  test('Smoke Test Some Basic Action Policies', () => {
    console.log(Actions.ec2.AllocateHosts);
    expect(Actions.ec2.DescribeInstances).toBe('ec2:DescribeInstances');
    expect(Actions.ec2.CopyImage).toBe('ec2:CopyImage');
  });

  test('Create an IAM Role using Actions and Managed Policies', () => {
    const app = new App();
    const fakeEnv = {
      account: '123456789012',
      region: 'eu-central-1',
    };
    const stack = new Stack(app, 'MyStack', {
      stackName: 'MyStackActions',
      env: fakeEnv,
    });
    new Role(stack, 'MyRole', {
      roleName: 'MyRole',
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(stack, 'ElastiCacheFullAccess', ManagedPolicies.AmazonElastiCacheFullAccess.Arn),
        ManagedPolicy.fromManagedPolicyArn(stack, 'FSxConsoleFullAccess', ManagedPolicies.AmazonFSxConsoleFullAccess.Arn),
      ],
      inlinePolicies: {
        ec2DescribeInstances: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                Actions.ec2.DescribeInstances,
                Actions.ec2.CopyImage,
                Actions.ec2.RunInstances,
                Actions.ec2.RunInstances,
                Actions.ec2.CreateTags,
                Actions.ec2.CreateCustomerGateway,
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                Actions.s3.GetObject,
                Actions.s3.PutObject,
                Actions.s3.DeleteObject,
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});


