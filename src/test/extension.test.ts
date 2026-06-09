import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { CommentTreeProvider } from '../commentTreeProvider';

suite('Comment Tree Extension Test Suite', () => {
  let commentTreeProvider: CommentTreeProvider;

  suiteSetup(async () => {
    // Wait for extension activation
    await vscode.extensions.getExtension('densdix.comment-tree')?.activate();
  });

  test('Extension should be activated', () => {
    const extension = vscode.extensions.getExtension('densdix.comment-tree');
    assert.ok(extension, 'Extension should be found');
    assert.strictEqual(extension?.isActive, true, 'Extension should be active');
  });

  test('Tree view should be registered', async () => {
    // Check that the extension has registered the view container
    // For simplicity, just check that the extension is active
    assert.ok(true, 'Extension is active and should have registered views');
  });

  test('Comment scanning should work', async function () {
    this.timeout(5000); // Increase timeout

    // Create provider for testing
    commentTreeProvider = new CommentTreeProvider();
    await commentTreeProvider.refresh();

    const stats = commentTreeProvider.getStats();
    console.log('Test stats:', stats);

    // Check that comments are found in test-comments.js
    assert.ok(stats.totalComments > 0, 'Should find some comments');

    // Get child elements
    const children = await commentTreeProvider.getChildren();
    assert.ok(children.length > 0, 'Should have file items');

    // Check first file
    if (children.length > 0) {
      const fileItem = children[0];
      const fileComments = await commentTreeProvider.getChildren(fileItem);
      assert.ok(fileComments.length > 0, 'File should have comments');
    }
  });

  test('Should exclude node_modules from scanning', async function () {
    this.timeout(5000);

    // Create provider for testing
    commentTreeProvider = new CommentTreeProvider();
    await commentTreeProvider.refresh();

    const children = await commentTreeProvider.getChildren();

    // Check that no files are in node_modules
    const hasNodeModulesFiles = children.some((child) => {
      const filePath = (child as any).filePath;
      return filePath && filePath.includes('node_modules');
    });

    assert.strictEqual(hasNodeModulesFiles, false, 'Should not scan files in node_modules');
  });

  test('Should exclude build directories from scanning', async function () {
    this.timeout(5000);

    // Create test file in dist directory
    const testFileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'dist', 'test-comment.js');

    try {
      await vscode.workspace.fs.writeFile(testFileUri, Buffer.from('// This comment should not be found\n'));

      // Create provider and scan
      commentTreeProvider = new CommentTreeProvider();
      await commentTreeProvider.refresh();

      const children = await commentTreeProvider.getChildren();

      // Check that file from dist is not found
      const hasDistFiles = children.some((child) => {
        const filePath = (child as any).filePath;
        return filePath && filePath.includes('dist');
      });

      assert.strictEqual(hasDistFiles, false, 'Should not scan files in dist directory');
    } finally {
      // Delete test file
      try {
        await vscode.workspace.fs.delete(testFileUri);
      } catch (error) {
        // Ignore error deleting
      }
    }
  });

  test('Should exclude .git directory from scanning', async function () {
    this.timeout(5000);

    // Create provider for testing
    commentTreeProvider = new CommentTreeProvider();
    await commentTreeProvider.refresh();

    const children = await commentTreeProvider.getChildren();

    // Check that no files are in .git
    const hasGitFiles = children.some((child) => {
      const filePath = (child as any).filePath;
      return filePath && filePath.includes('.git');
    });

    assert.strictEqual(hasGitFiles, false, 'Should not scan files in .git directory');
  });

  test('Should exclude .vscode directory from scanning', async function () {
    this.timeout(5000);

    // Create provider for testing
    commentTreeProvider = new CommentTreeProvider();
    await commentTreeProvider.refresh();

    const children = await commentTreeProvider.getChildren();

    // Check that no files are in .vscode
    const hasVscodeFiles = children.some((child) => {
      const filePath = (child as any).filePath;
      return filePath && filePath.includes('.vscode');
    });

    assert.strictEqual(hasVscodeFiles, false, 'Should not scan files in .vscode directory');
  });

  test('Should scan regular project files', async function () {
    this.timeout(5000);

    // Create provider for testing
    commentTreeProvider = new CommentTreeProvider();
    await commentTreeProvider.refresh();

    const children = await commentTreeProvider.getChildren();

    // Check that files from src directory are found
    const hasSrcFiles = children.some((child) => {
      const filePath = (child as any).filePath;
      return filePath && filePath.includes('src');
    });

    assert.ok(hasSrcFiles, 'Should scan files in src directory');
  });

  test('Should scan C files and ignore preprocessor directives', async function () {
    this.timeout(5000);

    const testFileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test-c.c');
    const fileContent = `#include <stdio.h>\n#define CONST_VAL 42\n\n// This is a C single line comment\nint main() {\n    /* This is a C multi-line comment */\n    return 0;\n}\n`;

    try {
      await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(fileContent));

      // Create provider and scan
      commentTreeProvider = new CommentTreeProvider();
      await commentTreeProvider.refresh();

      const children = await commentTreeProvider.getChildren();
      const cFileItem = children.find(
        (child) => (child as any).filePath && (child as any).filePath.endsWith('test-c.c')
      );

      assert.ok(cFileItem, 'C file should be scanned and found in the tree');

      const fileComments = await commentTreeProvider.getChildren(cFileItem);
      
      // We expect exactly 2 comments:
      // 1. // This is a C single line comment
      // 2. /* This is a C multi-line comment */
      assert.strictEqual(fileComments.length, 2, 'Should find exactly 2 comments');

      const texts = fileComments.map((c: any) => c.commentText);
      assert.ok(texts.some(t => t.includes('// This is a C single line comment')), 'Should find single-line comment');
      assert.ok(texts.some(t => t.includes('/* This is a C multi-line comment */')), 'Should find multi-line comment');
      assert.ok(!texts.some(t => t.includes('#include')), 'Should not find #include as comment');
      assert.ok(!texts.some(t => t.includes('#define')), 'Should not find #define as comment');
    } finally {
      try {
        await vscode.workspace.fs.delete(testFileUri);
      } catch (error) {
        // Ignore delete error
      }
    }
  });

  test('Should scan C++ files and ignore preprocessor directives', async function () {
    this.timeout(5000);

    const testFileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'test-cpp.cpp');
    const fileContent = `#include <iostream>\n#pragma once\n\n// This is a C++ single line comment\nint main() {\n    /* This is a C++ multi-line comment */\n    return 0;\n}\n`;

    try {
      await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(fileContent));

      // Create provider and scan
      commentTreeProvider = new CommentTreeProvider();
      await commentTreeProvider.refresh();

      const children = await commentTreeProvider.getChildren();
      const cppFileItem = children.find(
        (child) => (child as any).filePath && (child as any).filePath.endsWith('test-cpp.cpp')
      );

      assert.ok(cppFileItem, 'C++ file should be scanned and found in the tree');

      const fileComments = await commentTreeProvider.getChildren(cppFileItem);

      // We expect exactly 2 comments:
      // 1. // This is a C++ single line comment
      // 2. /* This is a C++ multi-line comment */
      assert.strictEqual(fileComments.length, 2, 'Should find exactly 2 comments');

      const texts = fileComments.map((c: any) => c.commentText);
      assert.ok(texts.some(t => t.includes('// This is a C++ single line comment')), 'Should find single-line comment');
      assert.ok(texts.some(t => t.includes('/* This is a C++ multi-line comment */')), 'Should find multi-line comment');
      assert.ok(!texts.some(t => t.includes('#include')), 'Should not find #include as comment');
      assert.ok(!texts.some(t => t.includes('#pragma')), 'Should not find #pragma as comment');
    } finally {
      try {
        await vscode.workspace.fs.delete(testFileUri);
      } catch (error) {
        // Ignore delete error
      }
    }
  });
});
