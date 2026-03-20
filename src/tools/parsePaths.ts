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
  searchTerms: string[],
  entryType: string
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
  ww.entryType = '';

  if (item && item.object) {
    // Selection from object browser non-source objects
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.filter.protected;
    ww.library = scrubLibrary(item.object.library, `${commandName}`);
    ww.object = item.object.name;
    ww.name = item.object.name;
    ww.objType = item.object.type;
    ww.searchTerm = searchText ?? ww.name;
    ww.entryType = 'OBJECT';
  }
  else if (item && item.member) {
    // Selection from object browser source member
    ww.path = Code4i.sysNameInLocal(item.path);
    ww.protected = item.member.protected;
    ww.library = scrubLibrary(item.member.library, `${commandName}`, (ww.object >= ''));
    ww.object = item.member.file;
    ww.name = item.member.name;
    ww.nameType = item.member.extension;
    ww.objType = getSourceObjectType(ww.path)[0];
    ww.searchTerm = searchText ?? ww.name;
    ww.entryType = 'SOURCE';
  }
  else if (item) {
    ww.protected = item.readonly;
    const currIasp = Code4i.getCurrentIAspName();
    let newpath = ``;
    if (item instanceof Uri) {
      // This more than likely comes from right clicking in editor area
      // For DSPSCNSRC we just want *DOCLIBL/*ALL/*ALL.*ALL or maybe just *DOCLIBL
      // For DSPOBJU we just want to use the searchTerm
      // For DSPPGMOBJ we just want to use the searchTerm
      // For DSPPRCU we just want to use the searchTerm
      // For DSPFILSETU we just want to use the searchTerm
      ww.entryType = 'OBJECT';
      ww.searchTerm = searchText ?? '';
      ww.object = ww.searchTerm;
      // if (commandName === 'DSPSCNSRC') {
      //   ww.entryType = 'SOURCE';
      //   // ww.library = '*DOCLIBL';
      //   ww.name = ww.searchTerm;
      // }
      // else {
      // }
    }
    else if (item instanceof HitSource) {
      // This more than likely comes from the search results, right click
      // `item` should have values like path = lib/srcfile/mbr.type
      // meaning the object is now the source member not the file. 
      // It needs to be translated into *ALL/MBR.*TYPE

      // For DSPSCNSRC we just want *DOCLIBL/*ALL/*ALL.*ALL or maybe just *DOCLIBL
      // For DSPOBJU we just want to use the searchTerm
      // For DSPPGMOBJ we just want to use the searchTerm
      // For DSPPRCU we just want to use the searchTerm
      // For DSPFILSETU we just want to use the searchTerm

      ww.entryType = 'OBJECT';
      ww.searchTerm = searchText ?? (item.getSourceName() || '');
      ww.object = ww.searchTerm;
      if (commandName === 'DSPSCNSRC') {
        ww.entryType = 'SOURCE';
        // ww.library = '*DOCLIBL';
      }
      else {
        // newpath = item.getPath();
        // newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
        // ww.path = newpath;
        // ww.objType = getSourceObjectType(ww.path, commandName)[0];
        ww.searchTerm = searchText ?? '';
        // let pathParts = parsePath(ww.path, currIasp);
        // const filledCount = Object.values(pathParts).filter(value =>
        //   value !== undefined && value !== null && value !== ""
        // ).length;
        // if (commandName === 'DSPSCNSRC' && filledCount === 1) {
        //   // This special case if for when DSPSCNSRC is run but only the library is entered in
        //   ww.library = pathParts.object || '';
        // }
        // else {
        //   ww.library = pathParts.library || '';
        //   ww.object = pathParts.object || '';
        //   ww.name = pathParts.member || '';
        //   ww.nameType = pathParts.type || '';
        //   ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
        // }
      }
    }
    else if (item instanceof LineHit) {
      // console.log('item: ', item);
      if (item.label) {
        // LineHit is the source line that matches prior search and we want to do Hawkeye searches
        //   over this search match value.  This means grabbing from the label
        if (typeof item.label !== 'string' && item.label.highlights) {
          const startValue: number = item.label.highlights[0][0];   // The first number in the tuple
          const endValue: number = item.label.highlights[0][1];   // The second number in the tuple
          ww.searchTerm = searchText ?? (item.label.label.substring(startValue, endValue) || '');
        }
        // For DSPSCNSRC we just want *DOCLIBL/*ALL/*ALL.*ALL or maybe just *DOCLIBL
        // For DSPOBJU we just want to use the searchTerm
        // For DSPPGMOBJ we just want to use the searchTerm
        // For DSPPRCU we just want to use the searchTerm
        // For DSPFILSETU we just want to use the searchTerm
        ww.entryType = 'OBJECT';
        ww.object = ww.searchTerm;
        if (commandName === 'DSPSCNSRC') {
          ww.entryType = 'SOURCE';
          // ww.library = '*DOCLIBL';
        }
        else {
          newpath = ww.searchTerm;
          newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
          ww.path = newpath;
          // ww.objType = getSourceObjectType(ww.path, commandName)[0];
          ww.searchTerm = searchText ?? '';
          // let pathParts = parsePath(ww.path, currIasp);
          // const filledCount = Object.values(pathParts).filter(value =>
          //   value !== undefined && value !== null && value !== ""
          // ).length;
          // if (commandName === 'DSPSCNSRC' && filledCount === 1) {
          //   // This special case if for when DSPSCNSRC is run but only the library is entered in
          //   ww.entryType = 'SOURCE';
          //   ww.library = pathParts.object || '';
          // }
          // else {
          // ww.library = pathParts.library || '';
          // ww.object = pathParts.object || '';
          // ww.name = pathParts.member || '';
          // ww.nameType = pathParts.type || '';
          // ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
          // }
        }
      }
    }
    else if (item instanceof SearchSession) {
      // For DSPSCNSRC we just want *DOCLIBL/*ALL/*ALL.*ALL or maybe just *DOCLIBL, keep searchTerm
      // For DSPOBJU we just want to use the searchTerm for object
      // For DSPPGMOBJ we just want to use the searchTerm for object
      // For DSPPRCU we just want to use the searchTerm for object
      // For DSPFILSETU we just want to use the searchTerm for object
      ww.entryType = 'OBJECT';
      ww.searchTerm = searchText ?? item.searchItem;
      ww.object = ww.searchTerm;
      if (commandName === 'DSPSCNSRC') {
        // ww.library = '*DOCLIBL';
      }
      else {
        // newpath = item.getPath();
        // newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
        // ww.path = newpath;
        // ww.objType = getSourceObjectType(ww.path, commandName)[0];
        // ww.searchTerm = searchText ?? '';
        // let pathParts = parsePath(ww.path, currIasp);
        // const filledCount = Object.values(pathParts).filter(value =>
        //   value !== undefined && value !== null && value !== ""
        // ).length;
        // if (commandName === 'DSPSCNSRC' && filledCount === 1) {
        //   // This special case if for when DSPSCNSRC is run but only the library is entered in
        //   ww.library = pathParts.object || '';
        // }
        // else {
        //   ww.library = pathParts.library || '';
        //   ww.object = pathParts.object || '';
        //   ww.name = pathParts.member || '';
        //   ww.nameType = pathParts.type || '';
        //   ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
        // }
      }
    }
    else {
      // Probably came from command palette or second edit attempts 
      newpath = item;
      newpath = Code4i.upperCaseName(Code4i.sysNameInLocal(newpath));
      ww.path = newpath;
      ww.objType = getSourceObjectType(ww.path, commandName)[0];
      ww.searchTerm = searchText ?? '';
      let pathParts = parsePath(ww.path, currIasp);
      const filledCount = Object.values(pathParts).filter(value =>
        value !== undefined && value !== null && value !== ""
      ).length;
      if (commandName === 'DSPSCNSRC' && filledCount === 1) {
        // This special case if for when DSPSCNSRC is run but only the library is entered in
        ww.library = pathParts.object || '';
      }
      else {
        ww.library = pathParts.library || '';
        ww.object = pathParts.object || '';
        ww.name = pathParts.member || '';
        ww.nameType = pathParts.type || '';
        ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.object >= ''));
      }
    }
  }
  console.log(`${commandName}::`, item);
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