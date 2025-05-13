import  { TreeDataProvider } from "vscode";
import  { Range } from "vscode";
import * as vscode from 'vscode';
import { HawkeyeSearch } from "../api/HawkeyeSearch";
import { QsysFsOptions } from '@halcyontech/vscode-ibmi-types/';
import {SearchTreeProvider} from '../newwork/SearchTreeProvider';
import {registerCommandHandlers} from '../newwork/commandHandlers';
export type OpenEditableOptions = QsysFsOptions & { position?: Range };

export class HawkeyeSearchView implements TreeDataProvider<any> {
  private _searchTreeProvider: SearchTreeProvider;
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(context: vscode.ExtensionContext) {
    this._searchTreeProvider = new SearchTreeProvider(context);
    context.subscriptions.push(
      // vscode.window.registerTreeDataProvider('hawkeyeSearchView', this._searchTreeProvider),
      vscode.commands.registerCommand(`Hawkeye-Pathfinder.refreshSearchView`, async () => {
        this._searchTreeProvider.refresh();
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
        this.setResults(actionCommand, term, results);
      })
    );
    registerCommandHandlers( context, this._searchTreeProvider );
  }

  setViewVisible(visible: boolean) {
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, visible);
  }

  setResults(actionCommand :string, term: string, results: HawkeyeSearch.Result[]) {
    this._searchTreeProvider.addSearchSession(actionCommand, results, term);
    this.setViewVisible(true);
    vscode.commands.executeCommand(`hawkeyeSearchView.focus`);
  }

  getTreeItem(element: any): vscode.TreeItem |Thenable<vscode.TreeItem> {
    return this._searchTreeProvider.getTreeItem(element);
  }
  getChildren(element?: any): vscode.ProviderResult<any[]> {
    return this._searchTreeProvider.getChildren(element);
  }


  collapse() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.collapseAll`);
  }
  expand() {
    vscode.commands.executeCommand(`workbench.actions.treeView.hawkeyeSearchView.expandAll`);
  }

}