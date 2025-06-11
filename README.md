# RefSense - AI Metadata Extractor for Zotero

A Zotero 7 plugin that extracts bibliographic metadata from PDF files using AI (OpenAI GPT or local Ollama models).

## Features

- 🔘 **PDF Reader Integration**: Extract metadata directly from PDF viewer
- 🤖 **AI-Powered Extraction**: Support for OpenAI GPT-4 and local Ollama/LLaVA models  
- 📄 **Flexible Page Selection**: First page, current page, or custom range
- 🔍 **Text & Image Processing**: OCR text extraction with image fallback
- 📥 **Automatic Parent Creation**: Generate Zotero items with extracted metadata
- ⚙️ **Configurable Settings**: Customize AI backend, models, and extraction options

## Installation

1. Download the latest `.xpi` file from the releases page
2. In Zotero 7, go to Tools → Add-ons
3. Click the gear icon and select "Install Add-on From File"
4. Select the downloaded `.xpi` file
5. Restart Zotero

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/zotero-refsense.git
cd zotero-refsense

# Install dependencies
npm install

# Build the plugin
npm run build

# Development build with watching
npm run dev
```

### Project Structure

```
zotero-refsense/
├── manifest.json          # Extension manifest
├── package.json          # Node.js package configuration
├── build.js             # Build script
├── src/
│   ├── bootstrap.js     # Plugin initialization
│   ├── content.js       # PDF reader integration
│   └── ...
├── config/              # Configuration files
├── ui/                  # User interface components
├── ai/                  # AI integration modules
└── utils/               # Utility functions
```

## Configuration

The plugin supports the following configuration options:

- **AI Backend**: Choose between OpenAI or Ollama
- **API Keys**: OpenAI API key for GPT models
- **Models**: Select specific models (e.g., gpt-4-turbo, llava:13b)
- **Page Extraction**: Configure which pages to process
- **Ollama Host**: Local Ollama server URL

## Usage

1. Open a PDF in Zotero's PDF reader
2. Click the "Extract Metadata" button in the toolbar
3. Review the extracted metadata
4. Confirm to create the parent item

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Support

For issues and feature requests, please use the GitHub issue tracker.