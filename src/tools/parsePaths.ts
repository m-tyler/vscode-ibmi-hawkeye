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
  
  if (item && item.object) {
    // Selection from object browser non-source objects
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.filter.protected;
    ww.library = scrubLibrary(item.object.library, `${commandName}`);
    ww.object = item.object.name;
    ww.name = item.object.name;
    ww.objType = item.object.type;
    ww.searchTerm = searchText ?? ww.name;
  }
  else if (item && item.member) {
    // Selection from object browser source member
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.member.protected;
    ww.library = scrubLibrary(item.member.library, `${commandName}`, (ww.object >= ''));
    ww.object = item.member.file;
    ww.name = item.member.name;
    ww.objType = getSourceObjectType(ww.path)[0];
    ww.searchTerm = searchText ?? ww.name;
  }
  else if (item) {
    let newpath = ``;
    if (item instanceof Uri) {
      // This more than likely comes from right clicking in editor area
      if (commandName === 'DSPSCNSRC') {
      }
      else {
        newpath = item.path;
      }
      ww.searchTerm = searchText ?? '';
    }
    else if (item instanceof HitSource) {
      // This more than likely comes from the search results, right click
      if (commandName === 'DSPSCNSRC') {
            ww.searchTerm = searchText ?? (item.getSourceName()||'');
          }
          else {
            newpath = item.getPath();
          }
        }
        else if (item instanceof LineHit) {
          // console.log('item: ', item);
          if (item.label) {
            if (typeof item.label !== 'string' && item.label.highlights) {
              const startValue: number = item.label.highlights[0][0];   // The first number in the tuple
              const endValue: number = item.label.highlights[0][1];   // The second number in the tuple
              ww.searchTerm = searchText ?? (item.label.label.substring(startValue, endValue)||'');
        }
      }
    }
    else if (item instanceof SearchSession) {
      if (commandName === 'DSPSCNSRC') {
        ww.searchTerm = searchText ?? item.searchItem;
      }
      else { newpath = item.searchItem; }
    }
    else {
      // Probably came from command palette or second edit attempts 
      newpath = item;
      ww.searchTerm = searchText ?? '';
    }
    newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
    ww.path = newpath;
    ww.objType = getSourceObjectType(ww.path, commandName)[0];
    ww.protected = item.readonly;
    const currIasp = Code4i.getCurrentIAspName();
    let pathParts = parsePath(ww.path, currIasp);
    ww.library = pathParts.library || '';
    ww.object = pathParts.object || '';
    ww.name = pathParts.member || '';
    ww.nameType = pathParts.type || '';
    ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
  }
  console.log(`${commandName}::`,item);
  return ww;
}

type ParsedPath = {
  library: string | null;
  object: string;
  member: string | null;
  type: string | null;
};

function parsePath(path: string, knownDb?: string): ParsedPath {
  let library: string | null = null;
  let object: string;
  let member: string | null = null;
  let type: string | null = null;

  // If a known db name is provided, strip it out
  if (knownDb && path.startsWith(knownDb + "/")) {
    path = path.substring(knownDb.length + 1);
  }

  const segments = path.split("/").filter(s => s.length > 0);

  if (segments.length === 3) {
    // schema/object/member.type
    library = segments[0];
    object = segments[1];
    const [p, t] = segments[2].split(".");
    member = p || null;
    type = t || null;
  } else if (segments.length === 2) {
    // library/object[.type]
    library = segments[0];
    const [i, t] = segments[1].split(".");
    object = i;
    type = t || null;
  } else if (segments.length === 1) {
    // object[.type]
    const [i, t] = segments[0].split(".");
    object = i;
    type = t || null;
  } else {
    // throw new Error("Unexpected path format: " + path);
    object = '';
  }

  return { library, object, member, type };
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