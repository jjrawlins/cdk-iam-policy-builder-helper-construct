import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IAMClient, paginateListPolicies, PolicyScopeType } from '@aws-sdk/client-iam';

const region = process.env.region || 'us-east-2';

interface CustomPolicy {
  PolicyName: string;
  Arn: string;
}

const writeToFileAsTsObject = (data: any, filename: string) => {
  try {
    // Convert object to string
    const dataAsString = JSON.stringify(data, null, 2);

    // Format data as TypeScript export
    const tsData = `export const ManagedPolicies = ${dataAsString};\n`;

    // Write data to file
    fs.writeFileSync(filename, tsData, 'utf8');
  } catch (error) {
    console.log(`Error writing to file: ${filename}`);
    console.error(error);
  }
};

async function run() {
  const client = new IAMClient({ region: region });

  const params = { Scope: 'AWS' as PolicyScopeType };
  const paginator = paginateListPolicies({ client }, params);

  const policies: { [PolicyName: string]: CustomPolicy } = {};

  for await (const page of paginator) {
    if (page.Policies) {
      for (let policy of page.Policies) {
        if (policy.Arn && policy.PolicyName) {
          policies[policy.PolicyName] = {
            PolicyName: policy.PolicyName,
            Arn: policy.Arn,
          };
        }
      }
    }
  }

  writeToFileAsTsObject(policies, path.join(__dirname, '..', 'constructs', 'ManagedPolicies.ts'));
}

run().catch(console.error);
