import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
// eslint-disable-next-line import/no-extraneous-dependencies

// Define the output object
let output: { [key: string]: { [key: string]: string } } = {};

// Generate the platform-specific path to your text file
let filePath = path.join(__dirname, '..', '..', 'methods_list.txt');

const readInterface = readline.createInterface({
  input: fs.createReadStream(filePath),
  output: process.stdout,
});

readInterface.on('line', (line) => {
  let parts = line.trim().split(':');

  if (parts.length != 2) {
    return; // Invalid format, ignore line
  }

  let namespace = parts[0];
  let method = parts[1];

  if (!(namespace in output)) {
    // Create new namespace object if it doesn't exist
    output[namespace] = {};
  }

  output[namespace][method] = namespace + ':' + method;
});

readInterface.on('close', () => {
  writeToFileAsTsObject(output, path.join(__dirname, '..', 'constructs', 'Actions.ts'));
});


const writeToFileAsTsObject = (data: any, filename: string) => {
  try {
    // Convert object to string
    const dataAsString = JSON.stringify(data, null, 2);

    // Format data as TypeScript export
    const tsData = `export const Actions = ${dataAsString};\n`;

    // Write data to file
    fs.writeFileSync(filename, tsData, 'utf8');
  } catch (error) {
    console.log(`Error writing to file: ${filename}`);
    console.error(error);
  }
};


