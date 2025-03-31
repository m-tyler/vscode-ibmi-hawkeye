import * as vscode from 'vscode';
import { SearchTreeProvider } from './SearchTreeProvider';
import { SearchResult } from './SearchResult';

/**
 * Handler for the Hawkeye Scan Source Files command
 * @param searchTreeProvider The tree data provider for search results
 */
export async function handleScanSourceFiles(searchTreeProvider: SearchTreeProvider): Promise<void> {
  try {
    // Your existing code to execute the DSPSCNSRC command
    // This is a placeholder - you'll need to replace with your actual implementation
    const results = await executeDSPSCNSRC();
    
    // Instead of replacing the tree data, add a new session
    searchTreeProvider.addSearchSession('DSPSCNSRC', 
      results.map((result: any) => new SearchResult(
        result.label || result.toString(),
        result,
        {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [/* your arguments here */]
        }
      ))
    );
    
    // Make sure the view is visible
    vscode.commands.executeCommand('setContext', 'Hawkeye-Pathfinder:searchViewVisible', true);
  } catch (error) {
    vscode.window.showErrorMessage(`Error executing DSPSCNSRC: ${error}`);
  }
}

/**
 * Placeholder for the actual implementation of DSPSCNSRC command execution
 * Replace this with your actual implementation
 */
async function executeDSPSCNSRC(): Promise<any[]> {
  // This is a placeholder - replace with your actual implementation
  return [
    { label: 'Result 1', path: '/path/to/file1.txt', line: 10 },
    { label: 'Result 2', path: '/path/to/file2.txt', line: 20 },
    { label: 'Result 3', path: '/path/to/file3.txt', line: 30 }
  ];
}

/**
 * Register all command handlers
 * @param context The extension context
 * @param searchTreeProvider The tree data provider for search results
 */
export function registerCommandHandlers(
  context: vscode.ExtensionContext, 
  searchTreeProvider: SearchTreeProvider
): void {
  // Register the Scan Source Files command
  context.subscriptions.push(
    vscode.commands.registerCommand('Hawkeye-Pathfinder.scanSourceFiles', () => {
      handleScanSourceFiles(searchTreeProvider);
    })
  );

  // Register session management commands
  context.subscriptions.push(
    vscode.commands.registerCommand('Hawkeye-Pathfinder.clearAllSessions', () => {
      searchTreeProvider.clearSessions();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('Hawkeye-Pathfinder.removeSession', (session) => {
      if (session && session.id) {
        searchTreeProvider.removeSession(session.id);
      }
    })
  );
}
