// Manual test script for Gemini Live Share extension
const vscode = require('vscode');

async function testExtension() {
  console.log('Starting manual test of Gemini Live Share extension...');
  
  // Test the basic test command
  console.log('Testing vscodeliveshare.test command...');
  await vscode.commands.executeCommand('vscodeliveshare.test');
  
  // Test starting a Gemini session
  console.log('Testing gemini.startSession command...');
  await vscode.commands.executeCommand('gemini.startSession');
  
  // Wait a bit for the session to establish
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('Test completed. Check the VS Code UI for any notifications or inline completions.');
}

// Execute the test
testExtension().catch(err => {
  console.error('Test failed:', err);
});
