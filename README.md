# Better Shortcuts for Stream Deck

An Elgato Stream Deck plugin that allows you to run any macOS Shortcuts directly from your Stream Deck buttons.

## Overview

This plugin bridges the gap between your Stream Deck and macOS Shortcuts app, enabling you to trigger any shortcut with a simple button press. Whether it's automating tasks, controlling smart home devices, or launching complex workflows, you can now access all your shortcuts directly from your Stream Deck.

## Features

- **Run Any Shortcut**: Execute any shortcut from your macOS Shortcuts app
- **Folder Organization**: Browse shortcuts organized by folders
- **Real-time Validation**: Automatically checks if shortcuts still exist
- **Visual Feedback**: Shows success/error indicators on your Stream Deck
- **Easy Configuration**: Simple property inspector for selecting shortcuts

## Requirements

- **macOS only** - This plugin is designed exclusively for macOS
- Elgato Stream Deck (any model)
- macOS Shortcuts app with shortcuts configured
- The `shortcuts` command-line tool (available on any macOS with Shortcuts)

## Installation

1. Download the latest release from the [releases page](../../releases)
2. Double-click the `.streamDeckPlugin` file to install
3. The plugin will appear in your Stream Deck software

## Usage

1. Drag the "Launch Shortcut" action to any button on your Stream Deck
2. In the property inspector, select the shortcut you want to run
3. Press the button to execute your shortcut

The plugin will:
- ✅ Show a checkmark when the shortcut runs successfully
- ❌ Show an alert if the shortcut fails or doesn't exist
- Validate shortcuts when buttons appear to ensure they're still available

## Development

### Prerequisites

- Node.js 20+
- macOS development environment
- Elgato Stream Deck software

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development with Auto-reload

```bash
npm run watch
```

This will build the plugin and automatically restart it when changes are detected.

### Project Structure

```
src/
├── actions/          # Stream Deck action implementations
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── shortcuts.ts      # Shortcuts integration logic
└── plugin.ts         # Main plugin entry point
```

## Troubleshooting

### Shortcuts Command Not Found
If you see "shortcuts binary not installed" in the logs:
- Ensure you're running a version of macOS with the Shortcuts app installed
- The `shortcuts` command should be available automatically

### Shortcut Not Found
If a button shows an alert:
- Check that the shortcut still exists in the Shortcuts app
- Reconfigure the button with the updated shortcut

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
