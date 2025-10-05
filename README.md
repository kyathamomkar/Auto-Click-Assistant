# Auto Click Assistant

Download here: https://chromewebstore.google.com/detail/pandnmeeoflfbfijailiabjoodkhbpbj?utm_source=item-share-cb

A lightweight Chrome extension for automating repetitive clicking tasks on web pages.

## Features

- 🎯 **Element Selection** - Click on any element using visual selection or CSS selectors
- ⏱️ **Custom Intervals** - Set delays from milliseconds to minutes
- 🔄 **Loop Control** - Configure click count or infinite loops
- ⚡ **Quick Access** - Start/stop via extension popup or keyboard shortcuts
- 🛡️ **Safety Features** - Built-in protections against browser freezing

## Installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Usage

1. Click the extension icon in your toolbar
2. Click "Select Element" and choose your target on the page
3. Set click interval and number of clicks
4. Click "Start" to begin automation
5. Use "Stop" button or `Esc` key to end

## Keyboard Shortcuts

- `Alt+C` - Open extension popup
- `Ctrl+Shift+S` - Start/stop clicking
- `Escape` - Emergency stop

## Project Structure

```
├── manifest.json       # Extension configuration
├── popup.html         # Extension interface
├── popup.js           # Popup functionality
├── content.js         # Page interaction
├── background.js      # Background tasks
└── styles/            # CSS files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

Use responsibly and ensure compliance with website terms of service.
