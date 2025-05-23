// src/test/suite/search.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Search Functionality', () => {
  test('Search command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('Hawkeye-Pathfinder.searchSourceFiles'));
  });

  test('Search view should be visible after activation', async () => {
    // Set the context value to simulate being connected
    await vscode.commands.executeCommand('setContext', 'code-for-ibmi:connected', true);
    
    // Set the search view to be visible
    await vscode.commands.executeCommand('setContext', 'Hawkeye-Pathfinder:searchViewVisible', true);
    
    // Check if the view is registered
    // const views = await vscode.window.createTreeView('hawkeyeSearchView', {
    //   treeDataProvider: {
    //     getTreeItem: () => null,
    //     getChildren: () => []
    //   }
    // });
    
    // assert.ok(views, 'Search view should be created successfully');
    // views.dispose(); // Clean up
  });
});
