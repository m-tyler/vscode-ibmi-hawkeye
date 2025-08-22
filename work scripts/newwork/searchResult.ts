import * as vscode from 'vscode';

/**
 * Represents an individual search result item
 */
export class SearchResult extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly resultData: any,
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    
    this.tooltip = this.label;
    this.contextValue = 'searchResult';
    
    // You can customize the icon based on the type of result
    this.iconPath = new vscode.ThemeIcon('symbol-field');
  }
}
