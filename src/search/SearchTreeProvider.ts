// searchtreeprovider.ts
import * as vscode from 'vscode';
import { SearchSession } from './SearchSession';
import { HitSource } from './HitSource'; // Import HitSource
import { LineHit } from '../search/LineHit'; // Import LineHit

/**
 * TreeDataProvider for the Hawkeye search results view
 * Maintains a collection of search sessions rather than replacing them
 */
export class SearchTreeProvider implements vscode.TreeDataProvider<SearchSession | HitSource | LineHit> {
  private _searchSessions: SearchSession[] = [];
  private _onDidChangeTreeData: vscode.EventEmitter<SearchSession | HitSource | LineHit | undefined | null>
    = new vscode.EventEmitter<SearchSession | HitSource | LineHit | undefined | null>();

  readonly onDidChangeTreeData: vscode.Event<SearchSession | HitSource | LineHit | undefined | null> = this._onDidChangeTreeData.event;
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
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.clearSessions`, async () => {
        this.clearSessions();
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.removeSession`, async (sessionId) => {
        this.removeSession(sessionId);
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.setViewVisible`, async (visible?: boolean) => {
        visible = visible||false;
        this.setViewVisible(visible);
      }),
    );
  }
  setViewVisible(visible: boolean) {
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, visible);
  }
  /**
   * Add a new search session with results
   * @param command The IBM i command that was executed (e.g., DSPSCNSRC)
   * @param results The results from the command execution
   */
  addSearchSession(command: string, results: any[], searchItem: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const sessionId = `${command}_${timestamp}`;
    const hitSources = results[0].files.map((file: any) => new HitSource(file, searchItem));
    const newSession = new SearchSession(sessionId, command, hitSources, searchItem);
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
  getTreeItem(element: SearchSession | HitSource | LineHit): vscode.TreeItem {
    return element;
  }

  /**
   * Get the children of the given element
   */
  getChildren(element?: SearchSession | HitSource | LineHit): Thenable<(SearchSession | HitSource | LineHit)[]> {
    if (!element) {
      // Root level - return all search sessions
      return Promise.resolve(this._searchSessions);
    } else if (element instanceof SearchSession) {
      // Session level - return all results for this session
      return Promise.resolve(element.hitSources);
    }
    else if (element instanceof HitSource) {
      // HitSource level - return all LineHit objects for this HitSource
      return Promise.resolve(element.getChildren());
    }

    // Leaf node or other cases
    return Promise.resolve([]);
  }
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
  async resolveTreeItem(item: SearchSession | HitSource | LineHit, element: any, token: vscode.CancellationToken): Promise<vscode.TreeItem> {
    if (!element) {
      // Root level - return all search sessions
      item.tooltip = item.tooltip;
    } else if (element instanceof SearchSession) {
      // Session level - return all results for this session
      item.tooltip = item.tooltip;
    }
    else if (element instanceof HitSource) {
      // HitSource level - return all LineHit objects for this HitSource
      item.tooltip = item.tooltip;
    }
    return item;
  }
  collapse() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.collapseAll`);
  }
  expand() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.expandAll`);
  }
}
