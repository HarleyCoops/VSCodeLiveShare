// Script to run the manual test in VS Code Extension Development Host
const cp = require('child_process');
const path = require('path');

// Path to the VS Code executable
const vscodePath = process.platform === 'win32' ? 'code.cmd' : 'code';

// Path to the extension directory
const extensionPath = __dirname;

// Path to the manual test script
const testScriptPath = path.join(extensionPath, 'manual-test.js');

// Command to run VS Code with the extension and execute the test script
const command = `${vscodePath} --extensionDevelopmentPath="${extensionPath}" --new-window --disable-extensions --user-data-dir="${path.join(extensionPath, '.vscode-test-user-data')}" --folder-uri="file:///${extensionPath}" --enable-proposed-api="${extensionPath}" --file-uri="file:///${testScriptPath}"`;

console.log(`Running command: ${command}`);

// Execute the command
const childProcess = cp.exec(command);

childProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

childProcess.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
