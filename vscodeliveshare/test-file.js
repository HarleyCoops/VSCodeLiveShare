// This is a test file for the Gemini Live Share extension

// Function with a deliberate error (missing closing parenthesis
function calculateSum(a, b) {
  return a + b;  // Fixed version would have closing parenthesis here

// Example of a function that could be explained
function processData(data) {
  if (!data || !Array.isArray(data)) {
    return null;
  }
  
  const result = data
    .filter(item => item && typeof item === 'number')
    .map(num => num * 2)
    .reduce((sum, num) => sum + num, 0);
    
  return result;
}

// Start typing here to test inline completions...
