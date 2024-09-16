# cdk-iam-policy-builder-helper-construct

The AWS CDK allows you to define your cloud infrastructure using familiar programming languages, and this project
leverages that! Here are some examples of how to use our Actions and Managed Policies helper properties through
TypeScript, Python, and Golang.  Since this construct is jsii compliant, hopefully, this can be leveraged eventually in all the jsii compliant languages.

### Example

The following is the TypeScript version:

```go
import { App, Stack, Effect } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal, PolicyDocument, PolicyStatement, } from 'aws-cdk-lib/aws-iam';
import { Actions, ManagedPolicies } from '../src';

const app = new App();
const stack = new Stack(app, 'MyStack');

// Create an IAM role using helper classes
new Role(stack, 'MyRole', {
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
                        Actions.ec2.CreateTags,
                        Actions.ec2.CreateCustomerGateway,
                    ],
                    resources: ['*'],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [Actions.s3.GetObject, Actions.s3.PutObject, Actions.s3.DeleteObject],
                    resources: ['*'],
                }),
            ],
        }),
    },
});
```
