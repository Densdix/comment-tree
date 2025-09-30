// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CommentTreeProvider } from './commentTreeProvider';

// Export for testing
export { CommentTreeProvider };

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Comment Tree extension is now active!');

  // Check for workspace folders
  if (!vscode.workspace.workspaceFolders) {
    console.log('No workspace folders found - extension will activate when workspace is opened');
  } else {
    console.log(`Found ${vscode.workspace.workspaceFolders.length} workspace folder(s)`);
  }

  // Create comment tree provider
  const commentTreeProvider = new CommentTreeProvider();
  console.log('CommentTreeProvider created');

  // Register Tree Data Provider for representing comments
  const treeView = vscode.window.createTreeView('commentTreeView', {
    treeDataProvider: commentTreeProvider,
    showCollapseAll: true,
  });
  console.log('Tree view registered successfully');
  console.log('Tree view visible:', treeView.visible);

  // Add listener for tracking tree visibility
  treeView.onDidChangeVisibility((e) => {
    console.log('Tree view visibility changed:', e.visible);
  });

  // Register command for updating the comment tree
  const refreshCommand = vscode.commands.registerCommand('comment-tree.refresh', () => {
    console.log('Refresh command executed');
    commentTreeProvider.refresh();

    // Show statistics after updating
    setTimeout(() => {
      const stats = commentTreeProvider.getStats();
      const message = `Found ${stats.totalComments} comment${
        stats.totalComments !== 1 ? 's' : ''
      } in ${stats.totalFiles} file${stats.totalFiles !== 1 ? 's' : ''}`;
      vscode.window.showInformationMessage(message);
    }, 100);
  });
  console.log('Refresh command registered');

  // Register command for testing exclusions
  const testExclusionsCommand = vscode.commands.registerCommand('comment-tree.testExclusions', async () => {
    console.log('Test exclusions command executed');

    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder opened');
      return;
    }

    const config = vscode.workspace.getConfiguration('commentExplorer');
    const excludePatterns = config.get<string[]>('exclude', []);
    const fileExtensions = config.get<string[]>('fileExtensions', []);

    const includePattern = fileExtensions.length > 0 ? `**/*.{${fileExtensions.join(',')}}` : '**/*';

    const excludePattern = excludePatterns.length > 0 ? `{${excludePatterns.join(',')}}` : null;

    try {
      const startTime = Date.now();
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], includePattern),
        excludePattern,
        10000
      );
      const endTime = Date.now();

      // Check exclusions
      const nodeModulesFiles = files.filter((file) => file.fsPath.includes('node_modules'));
      const distFiles = files.filter((file) => file.fsPath.includes('/dist/') || file.fsPath.includes('\\dist\\'));
      const buildFiles = files.filter((file) => file.fsPath.includes('/build/') || file.fsPath.includes('\\build\\'));
      const gitFiles = files.filter((file) => file.fsPath.includes('/.git/') || file.fsPath.includes('\\.git\\'));

      const message = `Test Results:
    - Total files found: ${files.length}
    - Time: ${endTime - startTime}ms
    - node_modules files: ${nodeModulesFiles.length}
    - dist files: ${distFiles.length}
    - build files: ${buildFiles.length}
    - .git files: ${gitFiles.length}

    ${
      nodeModulesFiles.length === 0 && distFiles.length === 0 && buildFiles.length === 0 && gitFiles.length === 0
        ? '✅ Exclusions working correctly!'
        : '❌ Some exclusions not working'
    }`;

      vscode.window.showInformationMessage(message);
    } catch (error) {
      vscode.window.showErrorMessage(`Test failed: ${error}`);
    }
  });
  console.log('Test exclusions command registered');

  // Function for showing statistics
  const showStats = () => {
    setTimeout(() => {
      const stats = commentTreeProvider.getStats();
      if (stats.totalComments > 0) {
        const message = `Comment Tree: Found ${stats.totalComments} comment${
          stats.totalComments !== 1 ? 's' : ''
        } in ${stats.totalFiles} file${stats.totalFiles !== 1 ? 's' : ''}`;
        vscode.window.showInformationMessage(message);
      } else if (vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage('Comment Tree: No comments found in the current workspace');
      }
    }, 100);
  };

  // Start initial scanning if there is a workspace
  if (vscode.workspace.workspaceFolders) {
    commentTreeProvider.refresh();
    showStats();
  }

  // Add subscriptions for cleaning up when deactivating
  context.subscriptions.push(treeView);
  context.subscriptions.push(refreshCommand);
  context.subscriptions.push(testExclusionsCommand);

  // Handle workspace opening/closing event
  const workspaceFoldersChange = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    console.log('Workspace folders changed:', event.added.length, 'added,', event.removed.length, 'removed');
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      commentTreeProvider.refresh();
      showStats();
    }
  });

  context.subscriptions.push(workspaceFoldersChange);
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up resources when deactivating the extension
}
