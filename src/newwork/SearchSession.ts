import * as vscode from 'vscode';
import { SearchResult } from './searchResult';

/**
 * Represents a search session from a Hawkeye command execution
 */
export class SearchSession extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly runCommand: string,
    public readonly results: SearchResult[]
  ) {
    super(
      `${runCommand} (${new Date().toLocaleTimeString()})`, 
      vscode.TreeItemCollapsibleState.Collapsed
    );
    
    this.tooltip = `Search results from ${runCommand}`;
    this.iconPath = new vscode.ThemeIcon('search');
    this.contextValue = 'searchSession';
    
    // Add additional metadata
    this.description = `${results.length} results`;
  }
}
