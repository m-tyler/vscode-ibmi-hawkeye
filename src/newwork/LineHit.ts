import * as vscode from 'vscode';
 import { HawkeyeSearch } from '../api/HawkeyeSearch'; // Import HawkeyeSearch
 import { OpenEditableOptions } from '../types/types'; // Import OpenEditableOptions

export class LineHit extends vscode.TreeItem {
  constructor(term: string, readonly path: string, line: HawkeyeSearch.Line, readonly?: boolean) {
    let highlights: [number, number][] = [];

    const upperContent = line.content.trimEnd().toUpperCase();
    const upperTerm = term.toUpperCase();
    const openOptions: OpenEditableOptions = { readonly };
    let index = 0;

    // Calculate the highlights
    if (term.length > 0) {
      const positionLine = line.number>= 1 ? line.number-1 :0;
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

    highlights = computeHighlights(upperTerm ,upperContent.trim());
    super({
      label: line.content.trim(),
      highlights
    });

    this.contextValue = `lineHit`;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;

    this.description = String(line.number);

    this.command = {
      command: `code-for-ibmi.openWithDefaultMode`,
      title: `Open`,
      arguments: [this, openOptions.readonly , openOptions.position]
    };
  }
}
/**
 * Computes where to highlight the search result label text
 */
function computeHighlights (term: string, line: string) :[number, number][]{
  let index = 0;
  let HI :[number,number][] = [];
  while (index >= 0) {
    index = line.indexOf(term, index);
    if (index >= 0) {
      HI.push([index, index +term.length]);
      index += term.length;
    }
  }
  return HI;
}