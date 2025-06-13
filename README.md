# RefSense - AI Metadata Extractor for Zotero

A powerful Zotero 7 plugin that extracts bibliographic metadata from PDF files using AI (OpenAI GPT or local Ollama models) and intelligently manages parent items.

## ✨ Features

### 🔘 **PDF Reader Integration**
- **Floating Button**: "📄 RefSense" button automatically appears in PDF reader
- **Keyboard Shortcut**: Ctrl+Shift+E for quick access
- **Auto-Detection**: Automatically detects PDF reader windows

### 🤖 **AI-Powered Extraction**
- **OpenAI GPT-4 Turbo**: High-precision metadata extraction
- **Local Ollama Models**: Privacy-focused local processing
- **Smart Prompting**: Optimized prompts for academic paper analysis
- **Robust Error Handling**: Retry logic with exponential backoff

### 📄 **Advanced PDF Processing**
- **Multi-Method Text Extraction**: 6 different extraction methods for maximum compatibility
- **Quality Validation**: Binary filtering and academic content scoring
- **Flexible Page Selection**: First page, current page, or custom range
- **Fallback System**: Comprehensive text extraction with quality verification

### 🧠 **Intelligent Parent Item Management**
- **Duplicate Detection**: Checks for existing parent items
- **Smart Update Options**: 3-choice dialog (Update/Create New/Cancel)
- **Field-by-Field Comparison**: Visual side-by-side metadata comparison
- **Selective Updates**: Choose which fields to update with radio buttons
- **Batch Operations**: "Select All Existing" or "Select All New" options

### 📥 **Seamless Zotero Integration**
- **Automatic Parent Creation**: Generate Zotero items with extracted metadata
- **PDF Linking**: Establish proper parent-child relationships
- **Transaction Management**: Database integrity with rollback support
- **Field Mapping**: Complete mapping to Zotero fields (title, authors, year, journal, DOI, etc.)

### ⚙️ **Comprehensive Settings**
- **Dynamic UI**: Backend-specific settings sections
- **API Key Management**: Secure Base64 encoding and masking
- **Connection Testing**: Validate API connectivity
- **Model Selection**: Choose from available AI models

## 🚀 Quick Start

### Installation

1. Download the latest `.xpi` file from the releases page
2. In Zotero 7, go to **Tools → Add-ons**
3. Click the gear icon and select **"Install Add-on From File"**
4. Select the downloaded `.xpi` file
5. Restart Zotero

### Configuration

1. Go to **Tools → Add-ons → RefSense → Options**
2. Choose your AI backend (OpenAI or Ollama)
3. Configure API keys and model settings
4. Test connection to ensure everything works

### Basic Usage

1. **Open a PDF** in Zotero's PDF reader
2. **Click the RefSense button** (📄) or press **Ctrl+Shift+E**
3. **Wait for AI processing** - metadata will be extracted automatically
4. **Choose your action**:
   - If no parent exists: Review and confirm metadata
   - If parent exists: Choose to update, create new, or cancel
5. **For updates**: Use the comparison dialog to select which fields to update
6. **Confirm** - parent item will be created or updated

## 🔧 Advanced Features

### Field-by-Field Metadata Comparison

When updating existing parent items, RefSense shows a detailed comparison dialog:

```
┌─────────────────────────────────────────────────────────┐
│ 메타데이터 비교 선택                                       │
│                                                        │
│ ┌─────────┬─────────────────┬─────────────────────────┐   │
│ │ Field   │ Existing Value  │ New Extracted Value     │   │
│ ├─────────┼─────────────────┼─────────────────────────┤   │
│ │ Title   │ ○ Old Title     │ ● New Extracted Title   │   │
│ │ Authors │ ○ John Doe      │ ● Jane Smith, Bob Lee   │   │
│ │ Year    │ ○ 2023          │ ● 2024                  │   │
│ │ Journal │ ○ (empty)       │ ● Nature Science        │   │
│ └─────────┴─────────────────┴─────────────────────────┘   │
│                                                        │
│ [Select All Existing] [Select All New]                 │
│                           [Apply Selected] [Cancel]    │
└─────────────────────────────────────────────────────────┘
```

### Supported AI Models

**OpenAI**:
- GPT-4 Turbo (recommended)
- GPT-4
- GPT-3.5 Turbo

**Ollama** (local):
- LLaVA models
- Llama models with vision capabilities
- Custom local models

## 🛠️ Development

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
├── manifest.json              # Zotero 7 Extension manifest
├── package.json              # npm package configuration
├── bootstrap.js              # Main plugin file
├── build.js                  # XPI build script
├── ai/                       # AI communication modules
│   ├── openai.js            # OpenAI API integration
│   └── ollama.js            # Ollama API integration
├── config/                   # Configuration system
│   ├── settings.js          # Settings management
│   └── prefs.xhtml          # Settings UI
├── build/                    # Build output
│   └── refsense.xpi         # Installable XPI package
└── CLAUDE.md                 # Development documentation
```

## 📋 Configuration Options

### AI Backend Settings

```json
{
  "ai_backend": "openai",               // "openai" or "ollama"
  "openai_api_key": "sk-...",          // OpenAI API key
  "openai_model": "gpt-4-turbo",       // OpenAI model
  "ollama_model": "llava:13b",         // Ollama model
  "ollama_host": "http://localhost:11434", // Ollama server
  "default_page_source": "first",      // "first", "current", "range"
  "page_range": "1–2"                  // Page range for extraction
}
```

### Page Extraction Options

- **First Page**: Extract from the first page (default, recommended for papers)
- **Current Page**: Extract from currently viewed page
- **Page Range**: Extract from specified page range (e.g., "1-3")

## 🔍 How It Works

1. **PDF Text Extraction**: Uses 6 different methods including Zotero's Fulltext API, cache files, and database queries
2. **Quality Validation**: Filters binary content and scores academic relevance
3. **AI Processing**: Sends optimized prompts to chosen AI backend
4. **Metadata Parsing**: Converts AI JSON response to Zotero fields
5. **Smart Handling**: Detects existing parents and offers intelligent update options
6. **Database Integration**: Uses Zotero's transaction system for data integrity

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Use the GitHub issue tracker
- **Documentation**: See CLAUDE.md for detailed development info
- **Discussions**: GitHub Discussions for questions and ideas

## 🔒 Privacy & Security

- **OpenAI**: Only sends PDF text content (first page typically contains public bibliographic info)
- **Ollama**: Completely local processing, no data transmitted externally
- **API Keys**: Stored locally with Base64 encoding
- **No Tracking**: No usage analytics or data collection

## 🎯 Roadmap

- [ ] Batch processing for multiple PDFs
- [ ] Advanced duplicate detection across entire library
- [ ] Custom field mapping options
- [ ] Integration with additional AI providers
- [ ] Enhanced OCR capabilities
- [ ] Multi-language support

---

**RefSense** - Making academic research more efficient with AI-powered metadata extraction.