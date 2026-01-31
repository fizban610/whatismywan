# What is My WAN

A Stream Deck plugin that displays your current public IP address and copies it to your clipboard with a single press.

## Features

- **Live IP Display** - Shows your current public WAN IP address directly on a Stream Deck key
- **One-Touch Copy** - Press the key to instantly copy your IP address to the clipboard
- **Auto-Refresh** - IP address automatically updates every 5 minutes
- **Flexible Display Options** - Choose how to display your IP:
  - 1 line: `192.168.1.100`
  - 2 lines: `192.168` / `1.100`
  - 4 lines: Each octet on its own line
- **Dynamic Text Sizing** - Font size automatically adjusts to fit the key

## Installation

### From Release

1. Download the latest `.streamDeckPlugin` file from the [Releases](../../releases) page
2. Double-click the downloaded file to install it in Stream Deck

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/whatismywan.git
   cd whatismywan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Link the plugin for development:
   ```bash
   streamdeck link net.jdhl.whatismywan.sdPlugin
   ```

5. Restart Stream Deck:
   ```bash
   streamdeck restart net.jdhl.whatismywan
   ```

## Usage

1. Open the Stream Deck application
2. Find "What is My WAN" in the action list (right sidebar)
3. Drag the "Show WAN IP" action onto a key
4. Your public IP address will appear on the key
5. Click the key to copy the IP address to your clipboard

### Configuration

Click the action in Stream Deck to access settings:

| Option | Description |
|--------|-------------|
| **1 Line** | Display full IP on one line (e.g., `192.168.1.100`) |
| **2 Lines** | Split IP across two lines (e.g., `192.168` / `1.100`) |
| **4 Lines** | Display each octet on its own line |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [Stream Deck](https://www.elgato.com/stream-deck) application 6.9 or later
- [Stream Deck CLI](https://www.npmjs.com/package/@elgato/cli) (`npm install -g @elgato/cli`)

### Project Structure

```
whatismywan/
├── src/
│   ├── plugin.ts              # Plugin entry point
│   └── actions/
│       └── show-wan-ip.ts     # Main action logic
├── net.jdhl.whatismywan.sdPlugin/
│   ├── manifest.json          # Plugin manifest
│   ├── ui/
│   │   └── show-wan-ip.html   # Settings UI
│   └── imgs/                  # Plugin icons
├── package.json
├── tsconfig.json
└── rollup.config.mjs
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the plugin |
| `npm run watch` | Build and watch for changes (auto-restarts Stream Deck) |

### Building for Release

1. Build the plugin:
   ```bash
   npm run build
   ```

2. Package the plugin:
   ```bash
   streamdeck pack net.jdhl.whatismywan.sdPlugin
   ```

This creates a `.streamDeckPlugin` file ready for distribution.

## How It Works

1. **IP Fetching** - Uses the [ipify.org](https://www.ipify.org/) API to retrieve your public IP address
2. **Display Rendering** - Generates SVG images with dynamically-sized text for crisp display
3. **Clipboard** - Uses native OS commands (`pbcopy` on macOS, PowerShell on Windows) for clipboard access

## Platform Support

| Platform | Minimum Version |
|----------|-----------------|
| macOS    | 12 (Monterey)   |
| Windows  | 10              |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Joshua Davis

## Acknowledgments

- [Elgato Stream Deck SDK](https://developer.elgato.com/documentation/stream-deck/)
- [ipify.org](https://www.ipify.org/) for the free IP lookup API
