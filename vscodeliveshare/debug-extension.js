// Debug script to check extension activation
const fs = require('fs');
const path = require('path');

// Check package.json
console.log('Checking package.json...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('Extension name:', packageJson.name);
console.log('Display name:', packageJson.displayName);
console.log('Main file:', packageJson.main);
console.log('Activation events:', packageJson.activationEvents);

console.log('\nRegistered commands:');
if (packageJson.contributes && packageJson.contributes.commands) {
  packageJson.contributes.commands.forEach(cmd => {
    console.log(`- ${cmd.command}: "${cmd.title}"`);
  });
} else {
  console.log('No commands found in package.json');
}

// Check if extension.js exists
const extensionJsPath = path.join(__dirname, packageJson.main || 'extension.js');
console.log(`\nChecking if ${extensionJsPath} exists...`);
if (fs.existsSync(extensionJsPath)) {
  console.log('Extension main file exists.');
  
  // Check extension.js content
  const extensionJs = fs.readFileSync(extensionJsPath, 'utf8');
  
  // Check for command registration
  const commandRegex = /registerCommand\(['"]([^'"]+)['"]/g;
  const commands = [];
  let match;
  while ((match = commandRegex.exec(extensionJs)) !== null) {
    commands.push(match[1]);
  }
  
  console.log('\nCommands registered in extension.js:');
  commands.forEach(cmd => console.log(`- ${cmd}`));
  
  // Check for activation function
  console.log('\nChecking for activate function...');
  if (extensionJs.includes('function activate')) {
    console.log('activate function found.');
  } else {
    console.log('WARNING: activate function not found!');
  }
} else {
  console.log('ERROR: Extension main file does not exist!');
}

console.log('\nDebug information:');
console.log('- Node version:', process.version);
console.log('- Platform:', process.platform);
console.log('- Architecture:', process.arch);
console.log('- Current directory:', __dirname);

console.log('\nTroubleshooting steps:');
console.log('1. Make sure VS Code is launched with --extensionDevelopmentPath pointing to the extension directory');
console.log('2. Check the VS Code Developer Tools (Help > Toggle Developer Tools) for any error messages');
console.log('3. Try running the extension with the --verbose flag: code --verbose --extensionDevelopmentPath=...');
