import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CommentItem } from './commentItem';

/**
 * Interface for a comment
 */
interface Comment {
  filePath: string;
  text: string;
  lineNumber: number;
  column: number;
}

/**
 * Interface for a file with comments
 */
interface FileWithComments {
  filePath: string;
  comments: Comment[];
}

/**
 * Data provider for the comment tree
 */
export class CommentTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | null
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null> = this._onDidChangeTreeData.event;

  private filesWithComments: FileWithComments[] = [];
  private readonly configSection = 'commentExplorer';

  constructor() {
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration(this.configSection)) {
        await this.refresh();
      }
    });
  }

  /**
   * Updates the comment tree
   */
  public async refresh(): Promise<void> {
    await this.scanForComments();
    this._onDidChangeTreeData.fire(null);
  }

  /**
   * Gets the root elements of the tree (files with comments)
   */
  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    console.log('getChildren called with element:', element ? element.label : 'root');

    if (!element) {
      // Root elements - files with comments
      console.log('Getting root items, files count:', this.filesWithComments.length);
      return Promise.resolve(this.getFileItems());
    } else if (element.contextValue === 'fileItem') {
      // Child elements - comments in the file
      const filePath = (element as any).filePath;
      const fileComments = this.filesWithComments.find((f) => f.filePath === filePath);
      console.log('Getting comments for file:', filePath, 'comments count:', fileComments?.comments.length || 0);

      if (fileComments) {
        return Promise.resolve(
          fileComments.comments.map(
            (comment) => new CommentItem(comment.filePath, comment.text, comment.lineNumber, comment.column)
          )
        );
      }
    }

    return Promise.resolve([]);
  }

  /**
   * Gets the file items for the root level
   */
  private getFileItems(): vscode.TreeItem[] {
    return this.filesWithComments.map((file) => {
      const item = new vscode.TreeItem(
        vscode.workspace.asRelativePath(file.filePath),
        vscode.TreeItemCollapsibleState.Expanded
      );

      // Set the number of comments
      const commentCount = file.comments.length;
      item.description = `${commentCount} comment${commentCount !== 1 ? 's' : ''}`;

      // Set the icon for the file
      item.iconPath = vscode.ThemeIcon.File;

      // Set the context for the menu
      item.contextValue = 'fileItem';

      // Save the path to the file for use in getChildren
      (item as any).filePath = file.filePath;

      return item;
    });
  }

  /**
   * Gets the tree item for the given element
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Scans the workspace for comments
   */
  private async scanForComments(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      this.filesWithComments = [];
      return;
    }

    const config = vscode.workspace.getConfiguration(this.configSection);
    const regexPattern = config.get<string>('regex', '//.*$|/\\*[\\s\\S]*?\\*/|<!--.*?-->|#.*$');
    const fileExtensions = config.get<string[]>('fileExtensions', []);
    const excludePatterns = config.get<string[]>('exclude', []);

    // Create glob pattern for including files
    const includePattern = fileExtensions.length > 0 ? `**/*.{${fileExtensions.join(',')}}` : '**/*';

    this.filesWithComments = [];

    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
      const pattern = new vscode.RelativePattern(workspaceFolder, includePattern);

      // Create exclude pattern from the array of patterns
      const excludePattern = excludePatterns.length > 0 ? `{${excludePatterns.join(',')}}` : null;

      const files = await vscode.workspace.findFiles(pattern, excludePattern, 10000);

      for (const file of files) {
        try {
          const comments = await this.extractCommentsFromFile(file.fsPath, regexPattern);
          if (comments.length > 0) {
            this.filesWithComments.push({
              filePath: file.fsPath,
              comments,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.fsPath}:`, error);
        }
      }
    }

    // Sort files by path
    this.filesWithComments.sort((a, b) => a.filePath.localeCompare(b.filePath));
  }

  /**
   * Extracts comments from a file
   * @param filePath Path to the file
   * @param regexPattern Regular expression for finding comments
   */
  private async extractCommentsFromFile(filePath: string, regexPattern: string): Promise<Comment[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const comments: Comment[] = [];
      const lines = content.split('\n');

      // Search for single line comments
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        // Search for single line comments
        const singleLineMatch = line.match(/^(\s*)\/\/(.*)/);
        if (singleLineMatch) {
          comments.push({
            filePath,
            text: `//${singleLineMatch[2].replace(/\r$/, '')}`,
            lineNumber: lineIndex + 1,
            column: singleLineMatch[1].length,
          });
        }

        // Search for hash comments
        const hashMatch = line.match(/^(\s*)#(.*)/);
        if (hashMatch) {
          comments.push({
            filePath,
            text: `#${hashMatch[2].replace(/\r$/, '')}`,
            lineNumber: lineIndex + 1,
            column: hashMatch[1].length,
          });
        }
      }

      // Search for multiline comments in the whole file
      const multilineRegex = /\/\*[\s\S]*?\*\//g;
      let match;
      while ((match = multilineRegex.exec(content)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;

        // Find the line and column
        let lineNumber = 1;
        let column = 0;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineLength = line.length + 1;

          if (charCount + lineLength > matchIndex) {
            lineNumber = i + 1;
            column = matchIndex - charCount;
            break;
          }

          charCount += lineLength;
        }

        comments.push({
          filePath,
          text: matchText,
          lineNumber,
          column,
        });
      }

      // Search for HTML comments
      const htmlRegex = /<!--[\s\S]*?-->/g;
      while ((match = htmlRegex.exec(content)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;

        let lineNumber = 1;
        let column = 0;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineLength = line.length + 1;

          if (charCount + lineLength > matchIndex) {
            lineNumber = i + 1;
            column = matchIndex - charCount;
            break;
          }

          charCount += lineLength;
        }

        comments.push({
          filePath,
          text: matchText,
          lineNumber,
          column,
        });
      }

      return comments;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Gets the statistics for the comments
   */
  public getStats(): { totalFiles: number; totalComments: number } {
    return {
      totalFiles: this.filesWithComments.length,
      totalComments: this.filesWithComments.reduce((sum, file) => sum + file.comments.length, 0),
    };
  }
}
