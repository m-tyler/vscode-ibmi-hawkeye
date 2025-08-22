import  { TreeDataProvider } from "vscode";
import  { Range } from "vscode";
import * as vscode from 'vscode';
import path from 'path';
import { HawkeyeSearch } from "../api/HawkeyeSearch";
import { QsysFsOptions } from '@halcyontech/vscode-ibmi-types/';
import {SearchTreeProvider} from '../newwork/SearchTreeProvider';
import {registerCommandHandlers} from '../newwork/commandHandlers';
import { SearchSession } from '../newwork/SearchSession';
import { HitSource } from '../newwork/HitSource'; // Import HitSource
import { LineHit } from '../newwork/LineHit'; // Import LineHit


export type OpenEditableOptions = QsysFsOptions & { position?: Range };

export class HawkeyeSearchView implements TreeDataProvider<any> {
  // private _searchTreeProvider: SearchTreeProvider;
  private _searchSessions: SearchSession[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> 
                          = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem |undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    // this._searchTreeProvider = new SearchTreeProvider;
    context.subscriptions.push(
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.refreshSearchView`, async () => {
        // this._searchTreeProvider.refresh();
        this.refresh();
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.closeSearchView`, async () => {
        vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, false);
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.collapseSearchView`, async () => {
        this.collapse();
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.expandSearchView`, async () => {
        this.expand();
      }),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.setSearchResults`, async (actionCommand :string, term: string, results: HawkeyeSearch.Result[]) => {
        // if (searchResults.hits.some(hit => hit.lines.length)) {
        //   searchViewViewer.message = vscode.l10n.t(`{0} file(s) contain(s) '{1}'`, searchResults.hits.length,  searchResults.term);
        // }
        // else {
        //   searchViewViewer.message = vscode.l10n.t(`{0} file(s) named '{1}'`, searchResults.hits.length,  searchResults.term);
        // }
        this.setResults(actionCommand, term, results);
      })
    );
    // registerCommandHandlers( context, this._searchTreeProvider );
  }

  setViewVisible(visible: boolean) {
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, visible);
  }

  setResults(actionCommand :string, term: string, results: HawkeyeSearch.Result[]) {
    this.addSearchSession(actionCommand, results, term);
    this.setViewVisible(true);

    vscode.commands.executeCommand(`hawkeyeSearchView.focus`);
  }

  // getTreeItem(element: any): vscode.TreeItem |Thenable<vscode.TreeItem> {
  //   return this._searchTreeProvider.getTreeItem(element);
  // }
  // getChildren(element?: any): vscode.ProviderResult<any[]> {
  //   return this._searchTreeProvider.getChildren(element);
  // }

  // getTreeItem(element: vscode.TreeItem) {
  //   return element;
  // }

  collapse() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.collapseAll`);
  }
  expand() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.expandAll`);
  }

  /**
   * Add a new search session with results
   * @param command The IBM i command that was executed (e.g., DSPSCNSRC)
   * @param results The results from the command execution
   */
  addSearchSession(command: string, results: any[], searchTerm: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const sessionId = `${command}_${timestamp}`;
    const hitSources = results.map(result => new HitSource(result, searchTerm)); 
    const newSession = new SearchSession(sessionId, command, hitSources, searchTerm);
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

}