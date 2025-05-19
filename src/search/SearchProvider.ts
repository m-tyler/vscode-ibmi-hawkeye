import * as vscode from 'vscode';
// import { SearchResult, SearchFile, SearchMatch } from "../types/types";
import { HawkeyeSearchMatches, SourceFileMatch } from "../types/types";

export class SearchResultProvider implements vscode.TreeDataProvider<SearchResultItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SearchResultItem | undefined | null | void> = new vscode.EventEmitter<SearchResultItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SearchResultItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private searchResults: HawkeyeSearchMatches[] = [];
  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      // vscode.window.registerTreeDataProvider('hawkeyeSearchView', this._searchTreeProvider),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.refreshSearchView`, async () => {
        this.refresh();
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.closeSearchView`, async () => {
        vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, false);
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.collapseSearchView`, async () => {
        this.collapse();
      }),
    );
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  addSearchResults(results: HawkeyeSearchMatches[]): void {
    this.searchResults.push(...results);
    this.refresh();
  }

  clearSearchResults(): void {
    this.searchResults = [];
    this.refresh();
  }
  /**
   * Remove a specific search session
   * @param sessionId The ID of the session to remove
   */
  // removeSession(sessionId: string): void {
  //   const index = this._searchSessions.findIndex(session => session.id === sessionId);
  //   if (index !== -1) {
  //     this._searchSessions.splice(index, 1);
  //     this._onDidChangeTreeData.fire(undefined);
  //   }
  // }

  /**
   * Clear all search sessions
   */
  // clearSessions(): void {
  //   this._searchSessions = [];
  //   this._onDidChangeTreeData.fire(undefined);
  // }

  getTreeItem(element: SearchResultItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SearchResultItem): SearchResultItem[] {
    if (!element) {
      // Level 1: Search Run items (e.g., DSPOBJU with timestamp)
      return this.searchResults.map(result => new SearchResultItem(result.searchDescription, vscode.TreeItemCollapsibleState.Collapsed, result));
    } else if (element.file) {
      // Level 3: Matches inside a file
      return element.file.matches.map(
        match => new SearchResultItem(`Line ${match.lineNumber}: ${match.content}`, vscode.TreeItemCollapsibleState.None)
      );
    } else if (element.result) {
      // Level 2: Files inside a Search Run
      return element.result.files.map(
        file => new SearchResultItem(file.fileName, vscode.TreeItemCollapsibleState.Collapsed, undefined, file)
      );
    }
    return [];
  }

  collapse() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.collapseAll`);
  }
  expand() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.expandAll`);
  }

}

class SearchResultItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly result?: HawkeyeSearchMatches,
    public readonly file?: SourceFileMatch
  ) {
    super(label, collapsibleState);
    if (!result && file) {
      // File Level (set the icon or description if needed)
      this.description = "File";
    }
  }
}