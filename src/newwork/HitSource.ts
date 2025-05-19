import * as vscode from 'vscode';
import path from 'path';
import { Code4i, getSourceObjectType } from "../tools";
import { LineHit } from './LineHit';
import { SourceFileMatch, QSYS_PATTERN } from '../types/types';


export class HitSource extends vscode.TreeItem {
  private readonly _path: string;
  private readonly _readonly?: boolean;

  constructor(readonly result: SourceFileMatch, readonly term: string) {
    super(path.posix.basename(result.fileName), vscode.TreeItemCollapsibleState.Collapsed);

    const hits = result.matches.length;
    // this.contextValue = `hitSource`;
    this._path = Code4i.sysNameInLocal(result.fileName.replace(QSYS_PATTERN, ''));
    // this.contextValue = Code4i.parserMemberPath( this._path ).extension;
    this.contextValue = getSourceObjectType( this._path )[1]+':'+Code4i.parserMemberPath( this._path ).extension;
    this.iconPath = vscode.ThemeIcon.File;
    this.description = `${hits} hit${hits === 1 ? `` : `s`}`;
    this._readonly = false;
    this.tooltip = ``
      .concat(this.contextValue ? vscode.l10n.t(`\nSource Object Type: {0}`, this.contextValue) : ``)
      .concat(result.howUsed    ? vscode.l10n.t(`\nHow Used:  {0}`, result.howUsed) : ``)
      .concat(result.fileText   ? vscode.l10n.t(`\nText  \t\t: {0}`, result.fileText) : ``)
      .concat(hits              ? vscode.l10n.t(`\nMatches \t: {0}`, hits) : ``)
      ;
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:hitSource`, this.contextValue);
  }

  async getChildren(): Promise<LineHit[]> {
   
    return this.result.matches.map((match:any) => new LineHit(this.term, this._path, match, this._readonly));
  }
}
