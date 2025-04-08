import * as vscode from 'vscode';
import path from 'path';
import { LineHit } from './LineHit';
import { HawkeyeSearch } from '../api/HawkeyeSearch';

export class HitSource extends vscode.TreeItem {
  private readonly _path: string;
  private readonly _readonly?: boolean;

  constructor(readonly result: HawkeyeSearch.Result, readonly term: string) {
    super(result.label ? result.path : path.posix.basename(result.path), vscode.TreeItemCollapsibleState.Collapsed);

    const hits = result.lines.length;
    this.contextValue = `hitSource`;
    this.iconPath = vscode.ThemeIcon.File;
    this.description = `${hits} hit${hits === 1 ? `` : `s`}`;
    this._path = result.path;
    this._readonly = result.readonly;
    this.tooltip = ``
      .concat(result.howUsed ? vscode.l10n.t(`How Used\t\t\t:  {0}`, result.howUsed) : ``)
      .concat(result.contextValue ? vscode.l10n.t(`\nContext: {0}`, result.contextValue) : ``);
  }

  async getChildren(): Promise<LineHit[]> {
   
    return this.result.lines.map(line => new LineHit(this.term, this._path, line, this._readonly));
  }
}
