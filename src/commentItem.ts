import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a comment in the comment tree
 */
export class CommentItem extends vscode.TreeItem {
  /**
   * Creates a new comment item
   * @param filePath Path to the file with the comment
   * @param commentText Text of the comment
   * @param lineNumber Line number of the comment
   * @param column Column number of the comment
   */
  constructor(
    public readonly filePath: string,
    public readonly commentText: string,
    public readonly lineNumber: number,
    public readonly column: number = 0
  ) {
    super('', vscode.TreeItemCollapsibleState.None);

    // Set label - show only the beginning of the comment
    this.label = this.getDisplayText(commentText);

    // Set tooltip with full information
    this.tooltip = this.getTooltip();

    // Set command for click
    this.command = {
      command: 'vscode.open',
      title: 'Open Comment',
      arguments: [
        vscode.Uri.file(filePath),
        {
          selection: new vscode.Range(
            new vscode.Position(lineNumber - 1, column),
            new vscode.Position(lineNumber - 1, column + commentText.length)
          ),
        },
      ],
    };

    // Set icon for the comment
    this.iconPath = new vscode.ThemeIcon('comment');

    // Set context for the menu (if needed)
    this.contextValue = 'commentItem';

    // Make the element searchable
    this.resourceUri = vscode.Uri.file(filePath);
  }

  /**
   * Returns a shortened text of the comment for display
   * @param commentText Full text of the comment
   * @returns Shortened text for the label
   */
  private getDisplayText(commentText: string): string {
    // Remove comment markers and spaces at the beginning
    let cleaned = commentText
      .replace(/^\/\/\s*/, '') // remove // and spaces
      .replace(/^\/\*+\s*/, '') // remove /* and spaces
      .replace(/\s*\*+\/$/, '') // remove */ and spaces at the end
      .replace(/^<!--\s*/, '') // remove <!-- and spaces
      .replace(/\s*-->$/, '') // remove --> and spaces at the end
      .replace(/^#\s*/, '') // remove # and spaces
      .trim();

    // For multiline comments, remove stars at the beginning of lines
    if (commentText.includes('/*') && commentText.includes('*/')) {
      cleaned = cleaned
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, '').trim())
        .join(' ')
        .trim();
    }

    // Limit the length to 100 characters
    if (cleaned.length > 100) {
      return cleaned.substring(0, 97) + '...';
    }

    return cleaned || 'Empty comment';
  }

  /**
   * Returns a tooltip with full information about the comment
   */
  private getTooltip(): string {
    const fileName = path.basename(this.filePath);
    const relativePath = vscode.workspace.asRelativePath(this.filePath);

    return `File: ${relativePath}
    Line: ${this.lineNumber}
    Column: ${this.column + 1} 

        ${this.commentText}`;
  }
}
