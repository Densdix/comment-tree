# Comment Tree

VS Code Extension for exploring and navigating all comments in the project through a tree view in the side panel.

**⚡ High Performance**: Optimized scanning with comprehensive exclusion rules to skip node_modules, build outputs, and cache directories for fast operation.

## Features

- **Collect all types of comments** from project files:
  - Single line comments (`//`, `#`, `--`)
  - Multiline comments (`/* */`, `<!-- -->`, `{# #}`)
  - Support for all popular programming languages

- **High performance scanning** with comprehensive exclusion rules
- **Customizable file extensions** through VS Code settings
- **Customizable regular expressions** for finding comments
- **Flexible exclusion rules** for files and folders (excludes node_modules, build dirs, caches by default)
- **Tree view** with grouping by files
- **Click on a comment** opens the file on the desired line
- **Detailed tips** with information about the file and position
- **Update command** for re-scanning
- **Debug command** to test exclusion rules

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Comment Tree"
4. Click Install

### From VSIX File

1. Download `comment-tree-x.x.x.vsix` from the [Releases](https://github.com/Densdix/comment-tree/releases) section
2. Open VS Code
3. Open Command Palette (Ctrl+Shift+P)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file
6. Click Install

## Usage

1. Open the workspace with the project
2. In the side panel find the "Comments" section
3. Expand the files to view the found comments
4. Click on a comment to navigate to it in the code
5. Use the update button to re-scan comments
6. Use the "Test Exclusions" command to verify that exclusions are working correctly

## Settings

The extension provides the following settings in `settings.json`:

### `commentExplorer.regex`

Regular expression for finding comments (default: `//.*|/\\*[\\s\\S]*?\\*/|<!--[\\s\\S]*?-->`)

### `commentExplorer.fileExtensions`

Array of file extensions to include in scanning (default includes popular languages)

### `commentExplorer.exclude`

Array of exclusion patterns for files and folders. By default, excludes common directories and files that don't contain user comments:

- `**/node_modules/**` - Node.js dependencies
- `**/dist/**`, `**/build/**`, `**/out/**` - Build outputs
- `**/.git/**`, `**/.vscode/**` - Version control and IDE files
- `**/.next/**`, `**/.nuxt/**`, `**/.cache/**` - Framework caches
- `**/coverage/**`, `**/*.min.js`, `**/*.map` - Generated/test files

Example settings:

```json
{
  "commentExplorer.regex": "//.*|#.*|--.*|/\\*[\\s\\S]*?\\*/",
  "commentExplorer.fileExtensions": ["js", "ts", "py", "java"],
  "commentExplorer.exclude": ["**/node_modules/**", "**/dist/**", "**/.git/**"]
}
```

### Commands

The extension provides the following commands:

- **Comment Tree: Refresh** - Re-scan all comments in the workspace
- **Comment Tree: Test Exclusions (Debug)** - Test that exclusion rules are working correctly

## Project structure

- `src/extension.ts` - Entry point of the extension
- `src/commentTreeProvider.ts` - Data provider for the comment tree
- `src/commentItem.ts` - Class for representing comments in the tree

## Development

### Requirements

- Node.js
- npm
- VS Code

### Building

```bash
npm install
npm run compile
```

### Code formatting

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format-check
```

### Running in development mode

```bash
npm run watch
```

### Testing

```bash
npm run test
```

## Known Limitations

- Maximum 10000 files are scanned at once for performance
- Some complex regular expressions may work slowly
- Large files may affect performance
- Comments in binary files are not supported

## License

MIT License

## Support

If you found a bug or want to suggest an improvement, please create an issue in the project repository.
