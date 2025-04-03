// searchtreeprovider.ts
import * as vscode from 'vscode';
import { SearchSession } from './SearchSession';
import { SearchResult } from './SearchResult';

/**
 * TreeDataProvider for the Hawkeye search results view
 * Maintains a collection of search sessions rather than replacing them
 */
export class SearchTreeProvider implements vscode.TreeDataProvider<SearchSession | SearchResult> {
  private _searchSessions: SearchSession[] = [];
  private _onDidChangeTreeData: vscode.EventEmitter<SearchSession | SearchResult | undefined | null> = new vscode.EventEmitter<SearchSession | SearchResult | undefined | null>();
  
  readonly onDidChangeTreeData: vscode.Event<SearchSession | SearchResult | undefined | null> = this._onDidChangeTreeData.event;

  /**
   * Add a new search session with results
   * @param command The IBM i command that was executed (e.g., DSPSCNSRC)
   * @param results The results from the command execution
   */
  addSearchSession(command: string, results: any[]): void {
    const timestamp = new Date().toLocaleTimeString();
    const sessionId = `${command}_${timestamp}`;
    const newSession = new SearchSession(sessionId, command, results);
    this._searchSessions.push(newSession);
    this._onDidChangeTreeData.fire(undefined); // Refresh the entire tree
  }

  /**
   * Remove a specific search session
   * @param sessionId The ID of the session to remove
   */
  removeSession(sessionId: string): void {
    const index = this._searchSessions.findIndex(session => session.id === sessionId);
    if (index !== -1) {
      this._searchSessions.splice(index, 1);
      this._onDidChangeTreeData.fire(undefined);
    }
  }

  /**
   * Clear all search sessions
   */
  clearSessions(): void {
    this._searchSessions = [];
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Get the tree item for the given element
   */
  getTreeItem(element: SearchSession | SearchResult): vscode.TreeItem {
    return element;
  }

  /**
   * Get the children of the given element
   */
  getChildren(element?: SearchSession | SearchResult): Thenable<(SearchSession | SearchResult)[]> {
    if (!element) {
      // Root level - return all search sessions
      return Promise.resolve(this._searchSessions);
    } else if (element instanceof SearchSession) {
      // Session level - return all results for this session
      return Promise.resolve(element.results);
    }
    
    // Leaf node or other cases
    return Promise.resolve([]);
  }
}
