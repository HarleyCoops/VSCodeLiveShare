// This is a script to test the Gemini Live Share extension
// Run this script with: node test-extension.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the extension directory
const extensionPath = __dirname;

// Path to the test file
const testFilePath = path.join(extensionPath, 'test-file.js');

console.log('Starting VS Code with the extension in development mode...');
console.log(`Extension path: ${extensionPath}`);
console.log(`Test file path: ${testFilePath}`);

// Launch VS Code with the extension in development mode
const vscode = spawn('code', [
  '--extensionDevelopmentPath=' + extensionPath,
  '--new-window',
  testFilePath
], {
  stdio: 'inherit',
  shell: true
});

console.log('\nTest Instructions:');
console.log('1. Wait for VS Code to open with the test file');
console.log('2. Press Ctrl+Shift+P to open the Command Palette');
console.log('3. Type "VSCodeLiveShare: Test Command" and press Enter');
console.log('   - You should see a notification saying "Test command executed successfully!"');
console.log('4. Press Ctrl+Shift+P again');
console.log('5. Type "Start Gemini Live Share" and press Enter');
console.log('   - You should see a notification saying "Gemini Live Share session started."');
console.log('6. Try typing in the editor to see if inline completions appear');
console.log('7. Select some code and right-click to see if "Gemini: Fix this code" and "Gemini: Explain this code" options appear');
console.log('\nNote: The extension uses the Gemini API key from the .env file in the project root.');
