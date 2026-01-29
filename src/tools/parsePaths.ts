import vscode, { Uri } from 'vscode';
import path from 'path';
import { Code4i, scrubLibrary, getSourceObjectType } from "./tools";
// import { MemberItem, ObjectItem } from '@halcyontech/vscode-ibmi-types';
import { HitSource } from '../search/HitSource';
import { LineHit } from '../search/LineHit';
import { SearchSession } from '../search/SearchSession';

export interface IBMiIdentity {
  library?: string;
  object: string;
  member?: string;
  extension?: string;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface wItem {
  path: string,
  protected: boolean,
  library: string,
  name: string,
  object: string,
  nameType: string,
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
  ww.object = '';
  ww.nameType = '';
  ww.protected = false;
  ww.searchTerm = searchText ?? '';

  if (item && item.object) {
    // Selection from object browser non-source objects
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.filter.protected;
    ww.library = scrubLibrary(item.object.library, `${commandName}`);
    ww.name = item.object.name;
    ww.objType = item.object.type;
  }
  else if (item && item.member) {
    // Selection from object browser source member
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.member.protected;
    ww.object = item.member.file;
    ww.library = scrubLibrary(item.member.library, `${commandName}`, (ww.object >= ''));
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
            newpath = '*DOCLIBL/Q*';
          }
          else {
            // DSPOBJU
            // DSPFILSETU
            // DSPPGMOBJ
            newpath = '*ALL/' + ww.searchTerm;
          }
          // console.log('newpath: ', newpath);
        }
      }
    }
    else if (item instanceof SearchSession) {
      if (commandName === 'DSPSCNSRC') {
        newpath = `*DOCLIBL/Q*`;
      }
      else { newpath = item.searchItem; }
    }
    else {
      // Probably came from command palette or second edit attempts 
      newpath = item;
    }
    // TODO: the different command need different values loaded. Come up with a pattern that fits best. 
    // TODO: for example, DSPOBJU run from right-click on search results needs to use searchItem for object and not library.
    newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
    ww.path = newpath;
    ww.objType = getSourceObjectType(ww.path, commandName)[0];
    ww.protected = item.readonly;
    let pathParts = parseQSYSPath(newpath, commandName);
    ww.library = pathParts.library || '';
    ww.object = pathParts.object || '';
    ww.name = pathParts.member || '';
    ww.nameType = pathParts.extension || '';
    ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
  }
  console.log(`${commandName}::`,item);
  return ww;
}
/**
 * Parses a string representation of a QSYS identity.
 */
export function parseQSYSPath(pathStr: string, commandName: string): IBMiIdentity {
  let library: string | null = null;
  let object: string = '';
  let member: string | null = null;
  let type: string | null = null;
  const currIasp = Code4i.getCurrentIAspName();
  let lastSegment = '';

  let pathParsed = path.parse(pathStr); // returns ParsedPath object
  let segments = pathStr.split('/').filter(Boolean); // removes empty element for strings like //dir/dir/etc. 
  // If DSPSCNSRC path could be [iasp]/[lib]/file/[mbr[.ext]] where file is only value required
  // if DSPFILSET/DSPFILSETU/DSPOBJU/DSPPGMOBJ the path could be [iasp]/[lib]/object.[ext]
  // if DSPPRCU the only thing needed is procedure name, which value do I take??
  // if the number of segments is 1 and ther is s dot then i have an mbr.ext for DSPSCNSRC or obj.ext for others.

  switch (commandName) {
  case 'DSPSCNSRC':
    switch (segments.length) {
    case 4:
      segments = segments.slice(1); // Remove the IASP drop to next section
    case 3:
      library = segments[0];
      object = segments[1];
      if (pathParsed.ext.length > 0) {
        type = pathParsed.ext;
      }
      member = pathParsed.name;
      break;
    case 2:
      // If received an item with an extension assume its a source member
      if (pathParsed.ext.length > 0) {
        library = '*DOCLIBL';
        object = segments[0];
        member = pathParsed.name;
        type = pathParsed.ext;
      }
      else {
        library = segments[0];
        object = segments[1];
      }
      break;
    default:
      if (pathParsed.ext.length > 0) {
        library = '*DOCLIBL';
        object = 'Q*';
        member = pathParsed.name;
        type = pathParsed.ext;
      }
      else {
        library = '*DOCLIBL';
        object = segments[0];
        member = '*ALL';
        type = '*ALL';
      }
    }
    break;
  case 'DSPPRCU':
    break;

    // The end result is to end with LIB/FILE values
  case 'DSPFILSET':
  case 'DSPFILSETU':
    lastSegment = segments[segments.length - 1];
    // Remove the iasp reference if found
    if (currIasp === segments[0]){
      delete segments[0];
    }
    switch (segments.length) {
    case 4: // [iasp]/[lib]/srcf/[mbr].[ext]
      // drop iasp and mbr.ext
      if (lastSegment === pathParsed.base) {
        library = segments[1];
        object = segments[2];
      }
    case 3: // [iasp]/[lib]/object.[ext]
            // [lib]/srcf/[mbr].[ext]
      // drop iasp and.ext
      if (lastSegment === pathParsed.base) {
        library = segments[1];
        object = pathParsed.name; // object without extension for DSPFILSET/U commands
      }
      break;
    case 2:
      library = segments[0];
      object = segments[1];
      if (pathParsed.ext.length > 0) {
        type = pathParsed.ext;
      }
      break;
    default:
      library = '*DOCLIBL';
      object = segments[0];
      if (pathParsed.ext.length > 0) {
        type = pathParsed.ext;
      }
      break;
    }
    break;
  
  default: // DSPOBJU,DSPPGMOBJ

    lastSegment = segments[segments.length - 1];
    // Remove the iasp reference if found
    if (currIasp === segments[0]){
      // const segmentIasp = segments.shift();
      delete segments[0];
    }
    switch (segments.length) {
    case 4: // [iasp]/[lib]/srcf/[mbr].[ext]
      // drop iasp and mbr.ext
      if (lastSegment === pathParsed.base) {
        library = segments[1];
        object = segments[2];
      }
    case 3: // [iasp]/[lib]/object.[ext]
            // [lib]/srcf/[mbr].[ext]
      // drop iasp and.ext
      if (lastSegment === pathParsed.base) {
        library = segments[1];
        object = segments[2];
      }

      segments = segments.slice(1); // Remove the IASP drop to next section
    case 2:
      library = segments[0];
      object = segments[1];
      if (pathParsed.ext.length > 0) {
        type = pathParsed.ext;
      }
      break;
    default:
      library = '*DOCLIBL';
      object = segments[0];
      if (pathParsed.ext.length > 0) {
        type = pathParsed.ext;
      }
      break;
    }
  }


  // if (segments.length >= 2) {
  //   library = segments[segments.length - 2];
  //   pathStr = segments[segments.length - 1];
  // }
  // else {
  //   pathStr = segments[0];
  // }
  // const parts = pathStr.split('.');
  // object = parts[0];
  // if (parts.length > 1) {
  //   type = parts[parts.length - 1];
  // }

  // let lastSegment = '';

  // Slash search
  // One token = object
  //   if (segments.length === 1) {
  //   library = '';
  //   lastSegment = segments[0];
  // }
  // else{
  //   // two+ tokens equals library + object
  //   library = segments[0];
  //   lastSegment = segments.length > 1 ? segments.pop() || "" : "";
  // }

  // Dot search
  // one token = object
  // two tokens = object+type
  // two+ tokens = object+type, drop thrid token

  // 1. First segment is always the Library (e.g., PRODLIB)
  // 2. Middle segment, if it exists, is the Source Physical File (e.g., QRPGLESRC)
  // const object = segments.length > 1 ? segments[1] : undefined;
  // 3. Extract the last segment to check for name and extension
  // const lastSegment = segments.length > 1 ? segments.pop() || "" : "";

  // let name: string | undefined;
  // let extension: string | undefined;
  // if (object !== lastSegment) {
  //   // if exists get member and extension
  //   if (lastSegment) {
  //     const lastDotIndex = lastSegment.lastIndexOf('.');
  //     if (lastDotIndex !== -1 && lastDotIndex !== 0) {
  //       name = lastSegment.substring(0, lastDotIndex);
  //       extension = lastSegment.substring(lastDotIndex + 1);
  //     } else {
  //       name = lastSegment; // name only, no extension
  //     }
  //   }
  // }

  return {
    object: object,
    ...(library && { library: library }),
    ...(member && { name: member }),
    ...(type && { type: type }),
  };
}
type ParsedPath = {
  schema: string | null;
  item: string;
  partition: string | null;
  type: string | null;
};

function parsePath(path: string, knownDb?: string): ParsedPath {
  let schema: string | null = null;
  let item: string;
  let partition: string | null = null;
  let type: string | null = null;

  // If a known db name is provided, strip it out
  if (knownDb && path.startsWith(knownDb + "/")) {
    path = path.substring(knownDb.length + 1);
  }

  const segments = path.split("/").filter(s => s.length > 0);

  if (segments.length === 3) {
    // schema/item/partition.type
    schema = segments[0];
    item = segments[1];
    const [p, t] = segments[2].split(".");
    partition = p || null;
    type = t || null;
  } else if (segments.length === 2) {
    // schema/item[.type]
    schema = segments[0];
    const [i, t] = segments[1].split(".");
    item = i;
    type = t || null;
  } else if (segments.length === 1) {
    // item[.type]
    const [i, t] = segments[0].split(".");
    item = i;
    type = t || null;
  } else {
    throw new Error("Unexpected path format: " + path);
  }

  return { schema, item, partition, type };
}

// // Examples
// const currIasp = Code4i.getCurrentIAspName();
// console.log(parsePath("db/schema/item.type", "db"));
// // { schema: 'schema', item: 'item', partition: null, type: 'type' }

// console.log(parsePath("schema/item/partition.type", "db"));
// // { schema: 'schema', item: 'item', partition: 'partition', type: 'type' }

// console.log(parsePath("schema/item", "db"));
// // { schema: 'schema', item: 'item', partition: null, type: null }

// console.log(parsePath("item.table", "db"));
// // { schema: null, item: 'item', partition: null, type: 'table' }