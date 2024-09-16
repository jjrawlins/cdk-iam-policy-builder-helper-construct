import * as fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import { parse } from 'jsonc-parser';

async function fetchData() {
  try {
    const headers = {
      'Connection': 'keep-alive',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Accept': '*/*',
      'Referer': 'https://awspolicygen.s3.amazonaws.com/policygen.html',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const response = await axios.get('https://awspolicygen.s3.amazonaws.com/js/policies.js', {
      headers: headers,
    });
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response);

    const index = response.data.indexOf('=');
    if (index === -1) {
      console.error('Unexpected data format. \'=\' not found');
      return;
    }

    const data = response.data.slice(index + 1);

    let jsonData: { [key: string]: any };
    try {
      jsonData = parse(data);
    } catch (error) {
      console.error('Error parsing JSONC data:', error);
      return;
    }

    console.log(jsonData.serviceMap);

    const methods: string[] = [];

    for (let service in jsonData.serviceMap) {
      let prefix = jsonData.serviceMap[service].StringPrefix;
      jsonData.serviceMap[service].Actions.forEach((action: string) => {
        methods.push(`${prefix}:${action}`);
        console.log(`${prefix}:${action}`);
      });
    }

    // Sorting and removing duplicates
    const uniqueMethods = [...methods].sort((a, b) => a.localeCompare(b));

    // Writing to file
    fs.writeFileSync('methods_list.txt', uniqueMethods.join('\n'));
  } catch (error) {
    console.error('Error during fetchData:', error);
  }
}

void fetchData().then().catch();
