import vscode, { Uri } from 'vscode';
import { Code4i, scrubLibrary, getSourceObjectType } from "./tools";
import { MemberItem } from '@halcyontech/vscode-ibmi-types';
import { HitSource } from '../search/HitSource';
import { LineHit } from '../search/LineHit';
import { SearchSession } from '../search/SearchSession';

export interface IBMiIdentity {
  library: string;
  file?: string;
  name?: string;
  extension?: string;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface wItem {
  path: string,
  protected: boolean,
  library: string,
  name: string,
  sourceFile: string,
  sourceType: string,
  objType: string,
  searchTerm: string,
  searchTerms: string[]
};
export function parseItem(item: any, commandName: string, searchText?: string): wItem {
  let ww = <wItem>{};
  ww.path = '';
  ww.library = '';
  ww.name = '';
  ww.objType = '';
  ww.sourceFile = '';
  ww.sourceType = '';
  ww.protected = false;
  ww.searchTerm = searchText ?? '';

  if (item && item.object) {
    // Selection from object browser non-source objects
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.filter.protected;
    ww.library = item.object.library;
    ww.library = scrubLibrary(ww.library, `${commandName}`);
    ww.name = item.object.name;
    ww.objType = item.object.type;
  }
  else if (item && item.member) {
    // Selection from object browser source member
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.member.protected;
    ww.sourceFile = item.member.file;
    ww.library = item.member.library;
    ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
    ww.name = item.member.name;
    ww.objType = getSourceObjectType(ww.path)[0];
  }
  else if (item) {
    let newpath = ``;
    if (item instanceof Uri) {
      // This more than likely comes from right clicking in editor area
      newpath = item.path;
    }
    else if (item instanceof HitSource) {
      // This more than likely comes from the search results, right click
      newpath = item.getPath();
    }
    else if (item instanceof LineHit) {
      // console.log('item: ', item);
      if (item.label) {
        if (typeof item.label !== 'string' && item.label.highlights) {
          const startValue: number = item.label.highlights[0][0];   // The first number in the tuple
          const endValue: number = item.label.highlights[0][1];   // The second number in the tuple
          ww.searchTerm = item.label.label.substring(startValue, endValue);
          if (commandName === 'DSPSCNSRC') {
            newpath = '*DOCLIBL/Q*/*ALL.*ALL';
          }
          else {
            // DSPOBJU
            // DSPFILSETU
            // DSPPGMOBJ
            newpath = '*ALL/' + ww.searchTerm;
          }
          console.log('newpath: ', newpath);
        }
      }
    }
    else if (item instanceof SearchSession) {
      if (commandName === 'DSPSCNSRC') {
        newpath = `*DOCLIBL/Q*/*ALL.*ALL`;
      }
      else { newpath = item.searchItem; }
    }
    else {
      // Probably came from command palette or second edit attempts 
      newpath = item;
    }
    let pathParts = parseQSYSPath(newpath);
    ww.path = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
    ww.objType = getSourceObjectType(ww.path, commandName)[0];
    ww.protected = item.readonly;
    ww.library = pathParts.library;
    ww.sourceFile = pathParts.file||'';
    ww.name = pathParts.name||'';
    ww.sourceType = pathParts.extension||'';
    ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
  }
  return ww;
}
/**
 * Parses a string representation of a QSYS identity.
 * Format: LIBRARY/FILE/NAME.extension (segments are optional except LIBRARY)
 */
export function parseQSYSPath(pathStr: string): IBMiIdentity {
  const segments = pathStr.split('/').filter(Boolean);

  // 1. First segment is always the Library (e.g., PRODLIB)
  const library = segments[0];
  // 2. Middle segment, if it exists, is the Source Physical File (e.g., QRPGLESRC)
  const file = segments.length > 1 ? segments[1] : undefined;
  // 3. Extract the last segment to check for name and extension
  const lastSegment = segments.length > 1 ? segments.pop() || "" : "";
  
  let name: string | undefined;
  let extension: string | undefined;
  if (file !== lastSegment) {
    // if exists get member and extension
    if (lastSegment) {
      const lastDotIndex = lastSegment.lastIndexOf('.');
      if (lastDotIndex !== -1 && lastDotIndex !== 0) {
        name = lastSegment.substring(0, lastDotIndex);
        extension = lastSegment.substring(lastDotIndex + 1);
      } else {
        name = lastSegment; // name only, no extension
      }
    }
  }

  return {
    library: library,
    ...(file && { file: file }),
    ...(name && { name: name }),
    ...(extension && { extension: extension }),
  };
}
