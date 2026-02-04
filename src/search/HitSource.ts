import vscode, { l10n } from 'vscode';
import path from 'path';
import { Code4i, getSourceObjectType } from "../tools/tools";
import { LineHit } from '../search/LineHit';
import { SourceFileMatch, QSYS_PATTERN } from '../types/types';

export class HitSource extends vscode.TreeItem {
  private readonly path: string;
  private readonly readonly?: boolean;
  private readonly sourceName: string;
  private readonly _searchTerm: string;
  private readonly searchTokens: string[];

  constructor(readonly result: SourceFileMatch, readonly searchTerm: string, collapseResults: vscode.TreeItemCollapsibleState, descCycle: boolean = false) {
    // super(path.posix.basename(result.filePath), vscode.TreeItemCollapsibleState.Expanded);
    super(path.posix.basename(result.filePath), collapseResults);

    const hits = result.matches.length;
    this.path = Code4i.sysNameInLocal(result.filePath.replace(QSYS_PATTERN, ''));
    this.sourceName = Code4i.sysNameInLocal(result.fileName);
    this._searchTerm = searchTerm ?searchTerm :this.sourceName;
    this.searchTokens = result.searchTokens.map(str => str.replace(/'/g, ''));
    this.contextValue = getSourceObjectType( this.path )[1]+':'+Code4i.parserMemberPath( this.path ).extension;
    this.iconPath = vscode.ThemeIcon.File;
    if (!descCycle) {
      this.description = `(${hits} hit${hits === 1 ? `` : `s`}) ${result.fileText} (${result.howUsed})`;
    } else {
      this.description = `${result.fileText} (${hits} hit${hits === 1 ? `` : `s`}) (${result.howUsed})`;
    }
    this.readonly = false;
    this.tooltip = new vscode.MarkdownString(`<table>`
        .concat(`<thead>${this.path}</thead><hr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Source Object Type:`)}</td><td>&nbsp;${l10n.t(this.contextValue)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`How Used:`)}</td><td>&nbsp;${l10n.t(result.howUsed)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Text:`)}</td><td>&nbsp;${l10n.t(result.fileText)}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Matches:`)}</td><td>&nbsp;${l10n.t(String(hits))}</td></tr>`)
        .concat(`<tr><td style="text-align: right;">${l10n.t(`Search Tokens:`)}</td><td>&nbsp;${l10n.t(String(this.searchTokens))}</td></tr>`)
        .concat(`</table>`) 
    );
    this.tooltip.supportHtml = true;
    vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:hitSource`, this.contextValue);
  }
  getPath(){return this.path;}
  getSourceName(){return this.sourceName;}

  async getChildren(): Promise<LineHit[]> {
    return this.result.matches.map((match:any) => new LineHit(this.searchTokens, this.path, match, this.readonly));
  }
}
