# VSCode Live Share Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Stream your live VS Code editor state directly to Google's Gemini Live API and receive real-time, multimodal AI assistance directly within your IDE.**

This extension provides a seamless bridge between your local development environment and the power of Gemini 2.5 Pro Live. It enables features like intelligent inline code completions, context-aware code actions (e.g., "fix this", "explain this"), terminal monitoring for real-time assistance, and an integrated chat panel that understands your current file context without manual copy-pasting.

## Features

*   **Live Inline Completions:** Get real-time code suggestions ("ghost text") as you type, powered by Gemini's understanding of your current file and cursor position.
*   **Contextual Code Actions:** Trigger specific Gemini actions on selected code or diagnostics (e.g., automatically apply fixes, generate explanations).
*   **Terminal Monitoring:** Get real-time assistance and insights from your terminal output, helping you understand errors and debug issues faster.
*   **Integrated Chat Panel:** Interact with Gemini in a dedicated panel that shares the live state of your active editor, providing highly relevant assistance.
*   **Low Latency:** Leverages the Gemini Live API's bi-directional WebSocket for millisecond-level interaction.
*   **Privacy Conscious:** Designed with privacy in mind, allowing for filename hashing and PII stripping.

## Getting Started

1. Install the extension from the VS Code marketplace or by downloading the VSIX file.
2. Obtain a Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Create a `.env` file in the extension directory with your API key:
   ```
   GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```
4. Open the Command Palette (Ctrl+Shift+P) and run "Start Gemini Live Share".
5. Start coding and see inline completions appear as you type.
6. Select code and right-click to access "Gemini: Fix this code" or "Gemini: Explain this code" actions.
7. To monitor your terminal, run "Start Gemini Terminal Monitoring" from the Command Palette.

## Terminal Monitoring

The terminal monitoring feature allows Gemini to analyze your terminal output in real-time, providing insights and assistance for:

- Error messages and debugging
- Build process issues
- Test results analysis
- Command suggestions
- Performance optimization tips

To use this feature:

1. Start a Gemini Live Share session
2. Open a terminal in VS Code
3. Run "Start Gemini Terminal Monitoring" from the Command Palette
4. Execute commands in your terminal as usual
5. Gemini will analyze the output and provide insights
6. To stop monitoring, run "Stop Gemini Terminal Monitoring"

## Commands

- **Start Gemini Live Share**: Starts a new Gemini Live Share session
- **Start Gemini Terminal Monitoring**: Begins monitoring the active terminal
- **Stop Gemini Terminal Monitoring**: Stops terminal monitoring

## Requirements

- VS Code 1.99.0 or higher
- Node.js 20.x or higher
- A Google Gemini API Key

## Extension Settings

This extension contributes the following settings:

* `gemini.apiKey`: Your Google Gemini API Key (alternatively set via .env file)
* `gemini.model`: The Gemini model to use (default: "models/gemini-2.0-flash-live-001")
* `gemini.debounceDelay`: Delay in milliseconds before sending editor changes (default: 300)

## Known Issues

- Terminal monitoring requires the proposed API to be enabled
- Large files may cause performance issues
- API key must be set in the .env file (settings support coming soon)

## Release Notes

### 0.0.1

Initial release with:
- Live inline completions
- Code actions (fix and explain)
- Terminal monitoring
- WebSocket connection management

## License

This project is licensed under the MIT License - see the LICENSE file for details.
