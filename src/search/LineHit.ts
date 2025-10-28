import * as vscode from 'vscode';
import { OpenEditableOptions, SearchMatch } from '../types/types';
import { computeHighlights } from "../tools/tools";

export class LineHit extends vscode.TreeItem {
  constructor(searchTokens: string[], readonly path: string, line: SearchMatch, readonly?: boolean) {
    let highlights: [number, number][] = [];

    const upperLine = line.content.trimEnd().toLocaleUpperCase();
    // const upperTerm = term.toLocaleUpperCase();
    const openOptions: OpenEditableOptions = { readonly };
    let index = 0;

    // Calculate the cursor goto values
    for (const token of searchTokens) {
      const startIndex = upperLine.indexOf(token.toLocaleUpperCase());

      // If the token is found, create and return the Range.
      if (startIndex !== -1) {
        const endIndex = startIndex + token.length;
        const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
        const startPosition = new vscode.Position(positionLine, startIndex);
        const endPosition = new vscode.Position(positionLine, endIndex);
        openOptions.position = new vscode.Range(startPosition, endPosition);
        if (highlights.length === 0) {
          highlights = computeHighlights(token.toLocaleUpperCase(), upperLine.trim());
        }
      }
    }
    if (searchTokens.length > 0) {
      // const hasMatch: boolean = searchTokens.some(term => upperLine.includes(term.toLocaleUpperCase()));
      const theMatch = findFirstTokenMatch(line.content, searchTokens);
      if (theMatch) {
        const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
        // while (index >= 0) {
        //   index = upperLine.indexOf(upperTerm, index);
        //   if (index >= 0) {
        //     if (!openOptions.position) {
        //       openOptions.position = new vscode.Range(positionLine, index, positionLine, index + term.length);
        //     }
        //     index += term.length;
        //   }
        // };
        openOptions.position = new vscode.Range(positionLine, theMatch.start, positionLine, theMatch.end);
      }
    }
    else {
      const positionLine = line.lineNumber >= 1 ? line.lineNumber - 1 : 0;
      const index = 1;
      openOptions.position = new vscode.Range(positionLine, index, positionLine, index);
    }

    // highlights = computeHighlights(upperTerm, upperLine.trim());
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
/**
 * Searches a source line for the first match of any token in an array.
 * @param sourceLine The string to search within.
 * @param tokens The array of tokens to search for.
 * @returns An object containing the matched token and its start and end positions, or null if no match is found.
 */
function findFirstTokenMatch(
  sourceLine: string,
  tokens: string[]
): { token: string; start: number; end: number } | null {
  for (const token of tokens) {
    const startIndex = sourceLine.indexOf(token);
    if (startIndex !== -1) {
      return {
        token: token,
        start: startIndex,
        end: startIndex + token.length,
      };
    }
  }
  return null;
}
