// Script to run the manual test in VS Code Extension Development Host
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

// Get command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'basic'; // Default to basic test if no argument provided

// Path to the VS Code executable
const vscodePath = process.platform === 'win32' ? 'code.cmd' : 'code';

// Path to the extension directory
const extensionPath = __dirname;

// Determine which test script to run
let testScriptPath;
switch (testType.toLowerCase()) {
  case 'terminal':
    testScriptPath = path.join(extensionPath, 'terminal-test.js');
    console.log('Running terminal monitoring test...');
    break;
  case 'basic':
  default:
    testScriptPath = path.join(extensionPath, 'manual-test.js');
    console.log('Running basic extension test...');
    break;
}

// Ensure the test script exists
if (!fs.existsSync(testScriptPath)) {
  console.error(`Error: Test script not found at ${testScriptPath}`);
  process.exit(1);
}

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

console.log('\nTest Instructions:');
console.log('1. Wait for VS Code to open with the test file');
console.log('2. The test script will automatically run and execute the necessary commands');
console.log('3. Check the VS Code UI for notifications and responses');

if (testType.toLowerCase() === 'terminal') {
  console.log('\nTerminal Monitoring Test:');
  console.log('- A test terminal will be created and commands will be executed automatically');
  console.log('- Gemini will analyze the terminal output and provide insights');
  console.log('- To stop terminal monitoring, open the Command Palette (Ctrl+Shift+P) and run "Stop Gemini Terminal Monitoring"');
}
