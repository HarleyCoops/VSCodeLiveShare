// Test script for terminal monitoring feature
const vscode = require('vscode');

async function testTerminalMonitoring() {
  console.log('Starting terminal monitoring test...');
  
  // First, start a Gemini session
  console.log('Starting Gemini Live Share session...');
  await vscode.commands.executeCommand('gemini.startSession');
  
  // Wait for the session to establish
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Create a new terminal
  console.log('Creating a test terminal...');
  const terminal = vscode.window.createTerminal('Gemini Test Terminal');
  terminal.show();
  
  // Wait a moment for the terminal to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start terminal monitoring
  console.log('Starting terminal monitoring...');
  await vscode.commands.executeCommand('gemini.startTerminalMonitoring');
  
  // Wait a moment for monitoring to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send some test commands to the terminal
  console.log('Sending test commands to terminal...');
  terminal.sendText('echo "Hello, Gemini Terminal Monitoring!"');
  terminal.sendText('ls -la');
  terminal.sendText('node -v');
  terminal.sendText('npm -v');
  
  // Wait for commands to execute
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Test completed. Check the VS Code UI for Gemini responses.');
  console.log('To stop terminal monitoring, run the command: gemini.stopTerminalMonitoring');
}

// Execute the test
testTerminalMonitoring().catch(err => {
  console.error('Terminal monitoring test failed:', err);
});

