import * as vscode from 'vscode';
import { HitSource } from './HitSource'; 

export class SearchSession extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly runCommand: string,
    public readonly searchItem: string,
    public readonly hitSources: HitSource[],
    public readonly searchTerm: string,
    public readonly collaspseState: vscode.TreeItemCollapsibleState

  ) {
    super(
      `${runCommand} (${new Date().toLocaleTimeString()})`, 
      // vscode.TreeItemCollapsibleState.Collapsed
      collaspseState
    );
    
    this.tooltip = 
    `Search results from ${runCommand}`
      .concat(searchItem ? vscode.l10n.t(`\nSearch Item: {0}`, searchItem) : ``)
      .concat(searchTerm ? vscode.l10n.t(`\nSearch Term: {0}`, searchTerm) : ``)
      ;
    this.iconPath = new vscode.ThemeIcon('search');
    this.contextValue = 'searchSession';
    
    // Add additional metadata
    this.description = `(${hitSources.length} results) ${searchItem}`;
  }
}
