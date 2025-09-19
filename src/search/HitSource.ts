import vscode, { l10n } from 'vscode';
import path from 'path';
import { Code4i, getSourceObjectType } from "../tools/tools";
import { LineHit } from '../search/LineHit';
import { SourceFileMatch, QSYS_PATTERN } from '../types/types';

export class HitSource extends vscode.TreeItem {
  private readonly _path: string;
  private readonly _readonly?: boolean;
  private readonly _sourceName: string;
  private readonly _searchTerm: string;

  constructor(readonly result: SourceFileMatch, readonly searchTerm: string) {
    super(path.posix.basename(result.filePath), vscode.TreeItemCollapsibleState.Collapsed);

    const hits = result.matches.length;
    this._path = Code4i.sysNameInLocal(result.filePath.replace(QSYS_PATTERN, ''));
    this._sourceName = Code4i.sysNameInLocal(result.fileName);
    this._searchTerm = searchTerm ?searchTerm :this._sourceName;
    this.contextValue = getSourceObjectType( this._path )[1]+':'+Code4i.parserMemberPath( this._path ).extension;
    this.iconPath = vscode.ThemeIcon.File;
    this.description = `${hits} hit${hits === 1 ? `` : `s`}`;
    this._readonly = false;
    this.tooltip = new vscode.MarkdownString(`<table>`
        .concat(`<thead>${this._path}</thead><hr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Source Object Type:`)}</td><td>&nbsp;${l10n.t(this.contextValue)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`How Used:`)}</td><td>&nbsp;${l10n.t(result.howUsed)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Text:`)}</td><td>&nbsp;${l10n.t(result.fileText)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Matches:`)}</td><td>&nbsp;${l10n.t(String(hits))}</td></tr>`)
        .concat(`</table>`) 
    );
    this.tooltip.supportHtml = true;
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:hitSource`, this.contextValue);
  }

  async getChildren(): Promise<LineHit[]> {
    return this.result.matches.map((match:any) => new LineHit(this._searchTerm, this._path, match, this._readonly));
  }
}
