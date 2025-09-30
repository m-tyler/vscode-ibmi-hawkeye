import * as vscode from 'vscode';
import { OpenEditableOptions, SearchMatch } from '../types/types';
import { computeHighlights } from "../tools/tools";

export class LineHit extends vscode.TreeItem {
  constructor(searchTokens: string[], readonly path: string, line: SearchMatch, readonly?: boolean) {
    let highlights: [number, number][] = [];

    const upperContent = line.content.trimEnd().toLocaleUpperCase();
    // const upperTerm = term.toLocaleUpperCase();
    const openOptions: OpenEditableOptions = { readonly };
    let index = 0;

    // Calculate the cursor goto values
    for (const token of searchTokens) {
      const startIndex = upperContent.indexOf(token.toLocaleUpperCase());

      // If the token is found, create and return the Range.
      if (startIndex !== -1) {
        const endIndex = startIndex + token.length;
        const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
        const startPosition = new vscode.Position(positionLine, startIndex);
        const endPosition = new vscode.Position(positionLine, endIndex);
        openOptions.position = new vscode.Range(startPosition, endPosition);
        if (highlights.length === 0) {
          highlights = computeHighlights(token.toLocaleUpperCase(), upperContent.trim());      
        }
      }
    }
    if (searchTokens.length > 0) {
    //   const hasMatch: boolean = searchTokens.some(term => upperContent.includes(term.toLocaleUpperCase()));
    //   if (hasMatch)
    //     const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
    //   while (index >= 0) {
    //     index = upperContent.indexOf(upperTerm, index);
    //     if (index >= 0) {
    //       if (!openOptions.position) {
    //         openOptions.position = new vscode.Range(positionLine, index, positionLine, index + term.length);
    //       }
    //       index += term.length;
    //     }
    //   });
    }
    else {
      const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
      const index = 1;
      openOptions.position = new vscode.Range(positionLine, index, positionLine, index);
    }

    // highlights = computeHighlights(upperTerm, upperContent.trim());
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
      arguments: [this, openOptions.readonly, openOptions.position]
    };
  }
}
