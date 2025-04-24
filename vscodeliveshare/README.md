# VS Code Live Share with Gemini

A VS Code extension that integrates Gemini's Live API to provide real-time coding assistance, suggestions, and explanations as you type.

## Features

- **Real-time Code Suggestions**: Get intelligent code suggestions as you type, powered by Gemini's Live API
- **Code Explanations**: Select any code and get detailed explanations about how it works
- **Code Fixes**: Select problematic code and let Gemini suggest fixes with explanations
- **Context-Aware**: The extension maintains context of your current file, providing relevant suggestions based on your code
- **Live Connection**: Maintains a WebSocket connection to Gemini's Live API for low-latency responses

## Requirements

- **VS Code**: Version 1.60.0 or higher
- **Node.js**: Version 14.0.0 or higher
- **Gemini API Key**: You need to obtain an API key from [Google AI Studio](https://ai.google.dev/)

## Getting Started

### Setting Up the Extension for Development

1. **Clone the Repository**
   ```bash
   git clone https://github.com/HarleyCoops/VSCodeLiveShare.git
   cd VSCodeLiveShare
   ```

2. **Install Dependencies**
   ```bash
   cd vscodeliveshare
   npm install
   ```

3. **Configure API Key**
   - Create a `.env` file in the `vscodeliveshare` directory
   - Add your Gemini API key to the file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Launch the Extension in Development Mode**
   - Open the `vscodeliveshare` folder in VS Code
   - Press `F5` to start debugging
   - This will open a new VS Code window with the extension loaded
   - You should see a notification that the extension is active

### Testing the Extension

1. **Start a Gemini Session**
   - In the VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`), type "Gemini: Start Session"
   - Select the command to start a new Gemini Live Share session
   - You should see a notification that the session has started

2. **Use Code Suggestions**
   - Open or create a code file
   - As you type, the extension will send context to Gemini and provide suggestions

3. **Get Code Explanations**
   - Select a block of code
   - Right-click and choose "Gemini: Explain this code" from the context menu
   - A new panel will open with a detailed explanation

4. **Fix Code Issues**
   - Select problematic code
   - Right-click and choose "Gemini: Fix this code" from the context menu
   - The extension will suggest fixes and apply them if you approve

## Extension Settings

This extension contributes the following settings:

* `geminiLiveShare.apiKey`: Your Gemini API key (can also be set via `.env` file)
* `geminiLiveShare.enableInlineCompletions`: Enable/disable inline code completions (default: true)
* `geminiLiveShare.enableContextStreaming`: Enable/disable streaming editor context to Gemini (default: true)
* `geminiLiveShare.maxContextLines`: Maximum number of lines to include in context (default: 150)

## Known Issues

- **WebSocket Connection Stability**: The extension may occasionally disconnect from the Gemini Live API. We've implemented reconnection logic to handle this gracefully.
- **Large File Performance**: When working with very large files, the extension may experience performance issues as it sends context to the Gemini API.
- **Model Limitations**: The Gemini model may occasionally provide incorrect suggestions or explanations, especially for complex or domain-specific code.

## Troubleshooting

### Connection Issues

If you experience connection issues with the Gemini API:

1. **Check API Key**: Ensure your API key in the `.env` file is correct and has not expired
2. **Restart Session**: Use the "Gemini: Start Session" command to restart the WebSocket connection
3. **Check Console Logs**: Open the Output panel in VS Code and select "Gemini Live Share" to view detailed logs
4. **Firewall Settings**: Ensure your firewall allows WebSocket connections to the Gemini API endpoints

### Performance Issues

If the extension is running slowly:

1. **Reduce Context Size**: The extension sends surrounding code as context. Working with smaller files can improve performance.
2. **Limit Concurrent Requests**: Avoid making multiple requests in quick succession.

## Release Notes

### 0.1.0 (Current)

- Initial implementation of Gemini Live API integration
- Real-time code suggestions as you type
- Code explanation and fix features
- WebSocket connection with reconnection logic

---

## Development Roadmap

Future plans for this extension include:

- **Improved Response Parsing**: Better handling of model responses for more accurate suggestions
- **Multi-file Context**: Provide context from multiple files for more comprehensive assistance
- **User Preferences**: Allow users to customize the style and format of suggestions
- **Language-specific Features**: Tailored assistance for different programming languages
- **Offline Mode**: Cache common suggestions for use when API connection is unavailable
- **Collaborative Features**: Integration with VS Code's built-in Live Share for collaborative coding

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Enjoy coding with Gemini Live Share!**
