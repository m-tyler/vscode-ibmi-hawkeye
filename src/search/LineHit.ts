import * as vscode from 'vscode';
import { OpenEditableOptions, SearchMatch } from '../types/types';
import { computeHighlights } from "../tools";

export class LineHit extends vscode.TreeItem {
  constructor(term: string, readonly path: string, line: SearchMatch, readonly?: boolean) {
    let highlights: [number, number][] = [];

    const upperContent = line.content.trimEnd().toUpperCase();
    const upperTerm = term.toUpperCase();
    const openOptions: OpenEditableOptions = { readonly };
    let index = 0;

    // Calculate the highlights
    if (term.length > 0) {
      const positionLine = line.lineNumber>= 1 ? line.lineNumber-1 :0;
      while (index >= 0) {
        index = upperContent.indexOf(upperTerm, index);
        if (index >= 0) {
          if (!openOptions.position) {
            openOptions.position = new vscode.Range(positionLine, index, positionLine, index + term.length);
          }
          index += term.length;
        }
      }
    }

    highlights = computeHighlights(upperTerm ,upperContent.trimEnd());
    super({
      label: line.content.trim(),
      highlights
    });

    this.contextValue = `lineHit`;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;

    this.description = String(line.lineNumber);

    this.command = {
      command: `code-for-ibmi.openWithDefaultMode`,
      title: `Open`,
      arguments: [this, openOptions.readonly , openOptions.position]
    };
  }
}
