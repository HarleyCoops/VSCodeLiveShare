// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const WebSocket = require('ws');
const { config } = require('dotenv');
const path = require('path');

let activeWebSocket = null; // Variable to hold the active WebSocket connection
let debounceTimer = null; // For debouncing text changes
let liveBuffer = ''; // Buffer to hold incoming text deltas for inline completion
let lastCompletionPosition = null; // Track where the completion was requested
let reconnectTimer = null; // Timer for reconnection attempts
let heartbeatInterval = null; // Interval for sending heartbeats
const MAX_RECONNECT_ATTEMPTS = 5; // Maximum number of reconnection attempts
let reconnectAttempts = 0; // Current number of reconnection attempts

// Load environment variables from .env file
config({ path: path.join(__dirname, '.env') });
console.log("Loaded GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

// Construct the Live API URL using the API key from environment variables
const LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/' +
  'google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent' +
  `?key=${process.env.GEMINI_API_KEY || 'AIza...'}`; // Use placeholder if key not set

// Add global uncaught exception handler for debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Create a direct test command that will definitely show up
  const testCommand = vscode.commands.registerCommand('vscodeliveshare.test', () => {
    vscode.window.showInformationMessage('Test command executed successfully!');
  });
  context.subscriptions.push(testCommand);
  
  // Show a more visible activation message - make it persistent
  vscode.window.showInformationMessage('ACTIVATION TEST: Gemini Live Share extension is now active!', 'OK');
  console.log('Congratulations, your extension "gemini-live-share" is now active!');

  // Register the commands to start a session
  context.subscriptions.push(
    vscode.commands.registerCommand('gemini.startSession', () => startSession(context))
  );
  
  // Register an alternative command with the extension's name as prefix
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodeliveshare.startGeminiSession', () => startSession(context))
  );

  // --- Event Listeners for Streaming Context ---

  // 1. On Selection Change
  context.subscriptions.push(
	vscode.window.onDidChangeTextEditorSelection((event) => {
	  // Trigger immediately if the selection changes in the active editor
	  if (event.textEditor === vscode.window.activeTextEditor) {
		console.log('Selection changed, sending snapshot.');
		sendEditorSnapshot(context); // Consider debouncing this too if it becomes too noisy
	  }
	})
  );

  // 2. On Document Save
  context.subscriptions.push(
	vscode.workspace.onDidSaveTextDocument((document) => {
	  // Trigger if the saved document is the one in the active editor
	  if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document === document) {
		console.log('Document saved, sending snapshot.');
		sendEditorSnapshot(context);
	  }
	})
  );

  // 3. On Document Change (Debounced)
  context.subscriptions.push(
	vscode.workspace.onDidChangeTextDocument((event) => {
	  // Trigger if the changed document is the one in the active editor
	  if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document === event.document) {
		if (debounceTimer) {
		  clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
		  console.log('Document changed (debounced), sending snapshot.');
		  sendEditorSnapshot(context);
		  debounceTimer = null;
		}, 300); // 300ms debounce delay
	  }
	})
  );

  // --- Code Action Provider ---
  const codeActionProvider = {
	provideCodeActions: (document, range, context, token) => {
	  // Only provide code actions if text is selected
	  if (range.isEmpty) {
		return [];
	  }

	  const selectedText = document.getText(range);
	  if (!selectedText) {
		return [];
	  }

	  // Create code actions for the selected text
	  const actions = [
		// Fix action
		new vscode.CodeAction('Gemini: Fix this code', vscode.CodeActionKind.QuickFix),
		// Explain action
		new vscode.CodeAction('Gemini: Explain this code', vscode.CodeActionKind.QuickFix)
	  ];

	  // Set command for each action
	  actions[0].command = {
		command: 'gemini.fixCode',
		title: 'Fix Code',
		arguments: [document, range, selectedText]
	  };

	  actions[1].command = {
		command: 'gemini.explainCode',
		title: 'Explain Code',
		arguments: [document, range, selectedText]
	  };

	  return actions;
	}
  };

  // Register the code action provider
  context.subscriptions.push(
	vscode.languages.registerCodeActionsProvider(
	  { scheme: 'file', language: '*' }, // Apply to all file types
	  codeActionProvider
	)
  );

  // Register the fix and explain commands
  context.subscriptions.push(
	vscode.commands.registerCommand('gemini.fixCode', (document, range, selectedText) => {
	  sendGeminiCommand('fix', document, range, selectedText, context);
	})
  );

  context.subscriptions.push(
	vscode.commands.registerCommand('gemini.explainCode', (document, range, selectedText) => {
	  sendGeminiCommand('explain', document, range, selectedText, context);
	})
  );

  // --- Inline Completion Provider ---
  const inlineProvider = {
	provideInlineCompletionItems: (document, position, context, token) => {
	  // Basic check: Only provide completions if the buffer has content
	  // and the request position is at the end of where the last completion started.
	  // More sophisticated logic might be needed (e.g., check context.triggerKind)
	  if (liveBuffer && lastCompletionPosition && position.isEqual(lastCompletionPosition.with(undefined, lastCompletionPosition.character + liveBuffer.length))) {
		console.log(`Providing inline completion: "${liveBuffer}" at ${position.line}:${position.character}`);
		return {
		  items: [{
			insertText: liveBuffer,
			// Range is optional, VS Code uses the current word/line context if undefined
			// range: new vscode.Range(lastCompletionPosition, position) // Example if range needed
		  }]
		};
	  } else {
		// If position changed or buffer is empty, clear buffer and position
		if (liveBuffer) {
			console.log("Clearing live buffer due to position change or empty buffer.");
			liveBuffer = '';
		}
		lastCompletionPosition = position; // Store current position for next potential completion
		console.log(`No completion provided. Stored position: ${position.line}:${position.character}`);
		return { items: [] };
	  }
	}
  };
  context.subscriptions.push(
	vscode.languages.registerInlineCompletionItemProvider({ scheme: 'file' }, inlineProvider) // Apply to all file types for now
  );
}

// Function to start the WebSocket session
async function startSession(context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'AIza...') {
	vscode.window.showErrorMessage('Gemini API Key not found or is placeholder. Please set it in the .env file.');
	return;
  }

  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  try {
	console.log('About to connect to Gemini Live WebSocket...');
	const ws = new WebSocket(wsUrl);

	ws.on('open', () => {
	  console.log('WebSocket connection opened! Sending setup message...');
	  vscode.window.showInformationMessage('Gemini Live Share session started.');
	  ws.send(
		JSON.stringify({
		  setup: {
			model: "gemini-2.0-flash-live-001",
			config: {
			  response_modalities: ["TEXT"]
			}
		  }
		})
	  );
	  activeWebSocket = ws;
	  reconnectAttempts = 0; // Reset reconnect attempts on successful connection
	  
	  // Set up heartbeat to keep connection alive
	  if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	  }
	  heartbeatInterval = setInterval(() => {
		if (ws.readyState === WebSocket.OPEN) {
		  console.log('Sending heartbeat ping...');
		  // Send a minimal ping message to keep the connection alive
		  ws.ping();
		}
	  }, 30000); // Send heartbeat every 30 seconds
	  
	  // Flush any queued messages if you implement queuing
	});

	ws.on('message', (buf) => {
	  console.log('Received message from Gemini:', buf.toString());
	  handleGemini(JSON.parse(buf.toString()));
	});
	
	// Handle ping messages from the server
	ws.on('ping', (data) => {
	  console.log('Received ping from server, sending pong...');
	  if (ws.readyState === WebSocket.OPEN) {
		ws.pong(data);
	  }
	});

	ws.on('error', (error) => {
	  console.error('Gemini WebSocket error:', error);
	  if (error && typeof error === 'object') {
		if ('code' in error) {
		  console.error('Error code:', error.code);
		}
		if ('message' in error) {
		  console.error('Error message:', error.message);
		}
		if ('stack' in error) {
		  console.error('Error stack:', error.stack);
		}
	  }
	  vscode.window.showErrorMessage(`Gemini WebSocket error: ${error.message}`);
	  if (activeWebSocket === ws) {
		activeWebSocket = null;
	  }
	});

	ws.on('close', (code, reason) => {
	  console.warn('Gemini WebSocket closed:', { code, reason: reason && reason.toString('utf8') });
	  if (code !== undefined) {
		console.warn('Close code:', code);
	  }
	  if (reason) {
		console.warn('Close reason:', reason.toString('utf8'));
	  }
	  
	  // Clear heartbeat interval
	  if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	  }
	  
	  if (activeWebSocket === ws) {
		activeWebSocket = null;
		
		// Attempt to reconnect if not a normal closure (code 1000)
		// and we haven't exceeded max reconnect attempts
		if (code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
		  reconnectAttempts++;
		  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with max 30s
		  
		  vscode.window.showInformationMessage(
			`Gemini Live Share session closed unexpectedly. Reconnecting in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
		  );
		  
		  // Clear any existing reconnect timer
		  if (reconnectTimer) {
			clearTimeout(reconnectTimer);
		  }
		  
		  // Set up reconnect timer
		  reconnectTimer = setTimeout(() => {
			console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
			startSession(context);
			reconnectTimer = null;
		  }, delay);
		} else {
		  vscode.window.showInformationMessage('Gemini Live Share session closed.');
		}
	  }
	});

  } catch (error) {
	console.error('Failed to create WebSocket:', error);
	vscode.window.showErrorMessage(`Failed to start Gemini session: ${error.message}`);
	activeWebSocket = null;
  }
}

// Function to send a user turn
function sendUserTurn(message, context) {
  if (checkConnection(context)) {
    console.log('WebSocket is open. Sending user turn...');
    activeWebSocket.send(JSON.stringify(message));
    return true;
  } else {
    console.error('WebSocket not open! State:', activeWebSocket ? activeWebSocket.readyState : 'NO SOCKET');
    return false;
  }
}

// Function to create a snippet of code around the cursor position
function codeSnippet(text, pos) {
  // send max ±150 lines around cursor for latency
  // trim with diff markers for privacy (TODO: Implement actual diff markers/PII stripping)
  const lines = text.split('\n');
  const startLine = Math.max(0, pos.line - 150);
  const endLine = Math.min(lines.length, pos.line + 151); // +151 because slice is exclusive of end
  return lines.slice(startLine, endLine).join('\n');
}

// Function to create a system prompt (basic version for now)
function systemPrompt(fileUri) {
  // TODO: Implement filename hashing for privacy if needed
  return `You are an expert coding assistant integrated into a VS Code extension.
You are seeing a snapshot of the file '${fileUri}'.
Provide concise and relevant code suggestions or explanations based on the user's current cursor position and the surrounding code.
Do not leak context between different files shown to you.`;
}


// Function to check WebSocket connection and reconnect if needed
function checkConnection(context) {
  if (!activeWebSocket || activeWebSocket.readyState !== WebSocket.OPEN) {
    console.log('WebSocket not open, attempting to reconnect...');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      startSession(context);
    } else {
      console.error(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached.`);
      vscode.window.showErrorMessage(
        `Failed to maintain connection to Gemini Live API after ${MAX_RECONNECT_ATTEMPTS} attempts. Please try starting a new session.`
      );
    }
    return false;
  }
  return true;
}

// Function to send the current editor state to the active WebSocket
function sendEditorSnapshot(context) {
  if (!checkConnection(context)) {
    console.error('WebSocket not open! State:', activeWebSocket ? activeWebSocket.readyState : 'NO SOCKET');
    return;
  }
  // Clear the buffer whenever we send a new snapshot, as the context has changed
  liveBuffer = '';
  lastCompletionPosition = vscode.window.activeTextEditor?.selection.active; // Reset position too
  console.log("Cleared live buffer and reset position on new snapshot send.");


  const editor = vscode.window.activeTextEditor;
  if (!editor) {
	console.log('No active editor.');
	return;
  }

  const document = editor.document;
  const fileUri = document.uri.toString();
  const code = document.getText();
  const cursor = editor.selection.active;

  const snippet = codeSnippet(code, cursor);

  console.log(`Sending snapshot for ${fileUri} (snippet length: ${snippet.length})`);

  activeWebSocket.send(
	JSON.stringify({
	  generateContentRequest: {
		contents: [
		  { role: 'user', parts: [{ text: systemPrompt(fileUri) }] },
		  { role: 'model', parts: [{ text: "Understood. Send the code snippet."}] }, // Simulate model turn for context
		  { role: 'user', parts: [{ text: snippet }] }
		]
	  }
	})
  );
}


// Function to append incoming text deltas to the live buffer
function appendInline(delta) {
  liveBuffer += delta;
  // Note: We might need a mechanism to clear the buffer, e.g., on new snapshot send or cursor move away.
  // For now, it just accumulates.
  console.log(`Live buffer updated: "${liveBuffer}"`);
}

// Function to send a specific command to Gemini (fix or explain)
function sendGeminiCommand(command, document, range, selectedText, context) {
  if (!checkConnection(context)) {
    vscode.window.showErrorMessage('Gemini Live Share session not active. Please start a session first.');
    return;
  }

  // Show progress notification
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Gemini is ${command === 'fix' ? 'fixing' : 'explaining'} the selected code...`,
    cancellable: false
  }, async (progress) => {
    // Create a response schema based on the command
    let responseSchema;
    if (command === 'fix') {
      responseSchema = {
        type: 'object',
        properties: {
          fixedCode: { type: 'string', description: 'The fixed version of the code' },
          explanation: { type: 'string', description: 'Brief explanation of the changes made' }
        },
        required: ['fixedCode']
      };
    } else { // explain
      responseSchema = {
        type: 'object',
        properties: {
          explanation: { type: 'string', description: 'Detailed explanation of how the code works' },
          keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key points about the code' }
        },
        required: ['explanation']
      };
    }

    // Create a prompt based on the command
    const prompt = command === 'fix' 
      ? `Fix the following code and explain what was wrong. Return ONLY a JSON object with 'fixedCode' and 'explanation' properties:\n\n${selectedText}`
      : `Explain how the following code works. Return ONLY a JSON object with 'explanation' and 'keyPoints' properties:\n\n${selectedText}`;

    // Create a buffer to accumulate the response
    let responseBuffer = '';
    
    // Set up a promise to handle the complete response
    const responsePromise = new Promise((resolve, reject) => {
      // Set up a message handler for this specific request
      const messageHandler = (buf) => {
        try {
          const msg = JSON.parse(buf.toString());
          
          if (msg.error) {
            activeWebSocket.removeListener('message', messageHandler);
            reject(new Error(msg.error.message || 'Unknown error'));
            return;
          }
          
          if (msg.generateContentResponse && msg.generateContentResponse.candidates && 
              msg.generateContentResponse.candidates.length > 0) {
            const candidate = msg.generateContentResponse.candidates[0];
            
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              const delta = candidate.content.parts[0].text;
              if (delta) {
                responseBuffer += delta;
                progress.report({ increment: 10, message: 'Receiving response...' });
              }
            }
            
            // Check if this is the final message
            if (candidate.finishReason === 'STOP') {
              activeWebSocket.removeListener('message', messageHandler);
              resolve(responseBuffer);
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
          // Don't reject here, as we might get partial messages that aren't valid JSON
        }
      };
      
      // Add the temporary message handler
      activeWebSocket.on('message', messageHandler);
      
      // Send the request
      activeWebSocket.send(JSON.stringify({
        generateContentRequest: {
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            responseSchema: responseSchema
          }
        }
      }));
    });
    
    try {
      // Wait for the complete response
      const response = await responsePromise;
      
      // Try to parse the response as JSON
      try {
        const jsonResponse = JSON.parse(response);
        
        if (command === 'fix' && jsonResponse.fixedCode) {
          // Apply the fix
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, range, jsonResponse.fixedCode);
          await vscode.workspace.applyEdit(edit);
          
          if (jsonResponse.explanation) {
            vscode.window.showInformationMessage(`Fix applied: ${jsonResponse.explanation}`);
          } else {
            vscode.window.showInformationMessage('Code fix applied successfully.');
          }
        } else if (command === 'explain' && jsonResponse.explanation) {
          // Show the explanation in a webview panel
          const panel = vscode.window.createWebviewPanel(
            'geminiExplanation',
            'Gemini Code Explanation',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
          );
          
          let keyPointsHtml = '';
          if (jsonResponse.keyPoints && Array.isArray(jsonResponse.keyPoints)) {
            keyPointsHtml = `
              <h2>Key Points</h2>
              <ul>
                ${jsonResponse.keyPoints.map(point => `<li>${point}</li>`).join('')}
              </ul>
            `;
          }
          
          panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Gemini Code Explanation</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
                .explanation { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>Code Explanation</h1>
              <div class="explanation">${jsonResponse.explanation}</div>
              ${keyPointsHtml}
            </body>
            </html>
          `;
        } else {
          vscode.window.showErrorMessage('Invalid response format from Gemini.');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        vscode.window.showErrorMessage('Failed to parse Gemini response as JSON.');
      }
    } catch (error) {
      console.error('Error getting response from Gemini:', error);
      vscode.window.showErrorMessage(`Gemini error: ${error.message}`);
    }
  });
}


// Function to handle incoming messages from Gemini
async function handleGemini(msg) {
  // console.log('Handling Gemini message:', msg); // Can be noisy, uncomment if needed
  if (msg.generateContentResponse && msg.generateContentResponse.candidates && msg.generateContentResponse.candidates.length > 0) {
	const candidate = msg.generateContentResponse.candidates[0];
	if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
		const delta = candidate.content.parts[0].text;
		if (delta) {
			appendInline(delta);
		}
	}
	// TODO: Handle finishReason if needed (e.g., STOP, MAX_TOKENS)
  } else if (msg.error) {
	console.error('Gemini API Error:', msg.error);
	vscode.window.showErrorMessage(`Gemini Error: ${msg.error.message || 'Unknown error'}`);
  }
}

// This method is called when your extension is deactivated
function deactivate() {
  console.log('Deactivating Gemini Live Share extension.');
  
  // Clean up WebSocket connection
  if (activeWebSocket) {
    console.log('Closing active WebSocket connection.');
    activeWebSocket.close();
    activeWebSocket = null;
  }
  
  // Clean up timers and intervals
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Reset reconnect attempts
  reconnectAttempts = 0;
}

module.exports = {
  activate,
  deactivate
}
