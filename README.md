# Memory MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Memory MCP Server is a locally running memory management server for desktop extensions. This is a memory MCP server for the desktop extension that provides a simple interface for remembering and managing user preferences, interests, personal information, current status, and more in a local environment.

## Features

- Create, Read, Update, Delete (CRUD) operations for user information
- Automatic memory saving and loading (JSON files)
- Operation logging
- Integration with desktop extensions
- Multi-platform support (Windows/macOS/Linux)

## Installation

1. Download the latest version from the GitHub releases page.
2. Extract the downloaded file.
3. In Claude Desktop's settings page, open the extensions page and drag and drop the extracted `.dxt` file.
4. When enabled, set the location for save files. (Required)

## Usage

1. Execute prompts from Claude Desktop. Memory will be automatically updated as needed.

## Developer Information

### Memory Format

Memory is saved in the following format:

```json
{
  "key": "memory_YYYYMMDDHHMMSS",
  "content": "User is [specific info]",
  "timestamp": "YYYY-MM-DDTHH:MM:SS.ssssss"
}
```

### Development Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/memory_mcp.git
   cd memory_mcp
   ```

2. Ensure Python 3.8 or higher is installed.

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Generate DXT file:
   ```bash
   npm run package
   ```

### Directory Structure

```
memory_mcp/
├── .gitignore
├── icon.png         # Extension icon
├── index.js         # Node.js entry point
├── main.py          # Python MCP server
├── manifest.json    # Extension manifest
├── package.json     # Project configuration
├── requirements.txt # Python dependencies
├── README_ja.md     # README (Japanese)
├── README.md        # README (English)
└── dist/            # Build output directory
```

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Bug reports and pull requests are welcome.

## Author

hidao80

## Acknowledgments

The `main.py` of this MCP server was created with reference to an [article](https://zenn.dev/zhizhiarv/articles/local-memory-mcp-for-claude-desktop#%E5%AE%9F%E8%A3%85) by [sherry](https://zenn.dev/zhizhiarv).  
Thank you.
