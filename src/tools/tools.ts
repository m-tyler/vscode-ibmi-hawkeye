import { CommandResult, RemoteCommand, } from '@halcyontech/vscode-ibmi-types';
import type { Tools } from '@halcyontech/vscode-ibmi-types/api/Tools';
import type { MemberParts } from '@halcyontech/vscode-ibmi-types/api/IBMi';
import { CustomUI } from '@halcyontech/vscode-ibmi-types/webviews/CustomUI';
import { loadBase, getBase } from '../base';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export namespace Code4i {
  export async function initialize(context: vscode.ExtensionContext) {
    loadBase(context);
  }
  export function getInstance() {
    return getBase()!.instance;
  }
  export function getConnection() {
    return getInstance().getConnection();
  }
  export function getConfig() {
    return getInstance().getConnection().getConfig();
  }
  export function getContent() {
    return getInstance().getConnection().getContent();
  }
  export function customUI() {
    return getBase()?.customUI();
  }
  export function getTempLibrary(): string {
    return getConfig().tempLibrary;
  }
  export function parserMemberPath(string: string, checkExtension?: boolean): MemberParts {
    return getInstance().getConnection().parserMemberPath(string, checkExtension);
  }
  export function sysNameInLocal(string: string): string {
    return getInstance().getConnection().sysNameInLocal(string);
  }
  // export async function getTable(library: string, name: string): Promise<Tools.DB2Row[]> {
  //     return getContent().getTable(library, name, name, true);
  // }
  export async function runSQL(sqlStatement: string, options?: { fakeBindings?: (string | number)[]; forceSafe?: boolean; }): Promise<Tools.DB2Row[]> {
    return getContent().ibmi.runSQL(sqlStatement, options || undefined);
  }
  export async function runCommand(command: RemoteCommand): Promise<CommandResult> {
    return await getConnection().runCommand(command);
  }
  export function makeid(length?: number) {
    return getBase()!.tools.makeid(length);
  }
  export function getLibraryIAsp(library: string): string | undefined {
    return getConnection().getLibraryIAsp(library);
  }
  export function getCurrentIAspName(): string | undefined {
    return getConnection().getCurrentIAspName();
  }
  export function lookupLibraryIAsp(library: string): Promise<string | undefined> {
    return getConnection().lookupLibraryIAsp(library);
  }
  export async function checkObject(library: string, name: string, type: string) {
    return await Code4i.getContent().checkObject({ library, name, type });
  };
}

export function getQSYSObjectPath(library: string, name: string, type: string, member?: string, iasp?: string) {
  return `${iasp ? `/${iasp.toUpperCase()}` : ''}/QSYS.LIB/${library.toUpperCase()}.LIB/${name.toUpperCase()}.${type.toUpperCase()}${member ? `/${member.toUpperCase()}.MBR` : ''}`;
}
export function sanitizeSearchTerm(searchTerm: string): string {
  return searchTerm.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
}
export async function checkObject(library: string, name: string, type: string) {
  return await Code4i.getContent().checkObject({ library, name, type });
};
export function nthIndex(aString: string, pattern: string, n: number) {
  let index = -1;
  while (n-- && index++ < aString.length) {
    index = aString.indexOf(pattern, index);
    if (index < 0) { break; }
  }
  return index;
}
export function getSourceObjectType(path: string): string[] {
  let srcObjType: string[];
  let parts: string[] = [];
  let i: number = 0;
  parts = path.split('/');
  let mbrExt: string[];
  // /iasp/lib/file/mbr.ext - if iasp length = 4
  if (parts.length === 4) { parts.slice(0); } // take away any iasp value
  i = parts.length - 1;
  // DO we have member extenstion? get it separated out.
  if (i !== 0) {
    mbrExt = parts[i].split('.');
    parts.push(mbrExt[1]);
  }
  switch (parts[2]) { // source file
  case `QDDSSRC`:
    switch (parts[4]) {
    case `PF`:
    case `LF`:
    case `SQL`:
      srcObjType = [`*FILE`, `*DBF`];
      break;

    case `DSPF`:
      srcObjType = [`*FILE`, `*DSPF`];
      break;
    case `PRTF`:
      srcObjType = [`*FILE`, `*PRTF`];
      break;
    default:
      srcObjType = [`*FILE`, `*ALL`];
      break;
    }
    break;
  case `QCLSRC`:
    srcObjType = [`*PGM`, `*PGM`];
    break;
  case `QRPGSRC`:
    srcObjType = [`*PGM`, `*PGM`];
    break;
  case `QTXTSRC`:
    if (parts[4] === `SQL`) {
      srcObjType = [`*PGM`, `*PGM`];
      break;
    }
    else {
      srcObjType = [`*ALL`, `*ALL`];
      break;
    }
  default:
    srcObjType = [`*ALL`, `*ALL`];
    break;
  }
  return srcObjType;
}

/**
 * @param  name action's name
 * @param command action's command string
 * @return the new command
 */
export async function showCustomInputs(name: string, command: string, title?: string): Promise<string> {
  const components = [];
  let loop = true;

  let end = 0;
  while (loop) {
    const idx = command.indexOf(`\${`, end);

    if (idx >= 0) {
      const start = idx;
      end = command.indexOf(`}`, start);

      if (end >= 0) {
        let currentInput = command.substring(start + 2, end);

        const [name, label, initialValue] = currentInput.split(`|`);
        components.push({
          name,
          label,
          initialValue: initialValue || ``,
          start,
          end: end + 1
        });
      } else {
        loop = false;
      }
    } else {
      loop = false;
    }
  }

  if (components.length) {
    // const commandUI = new CustomUI();
    const commandUI: CustomUI = Code4i.customUI()!;

    if (title) {
      commandUI.addHeading(title, 2);
    }

    for (const component of components) {
      if (component.initialValue.includes(`,`)) {
        //Select box
        commandUI.addSelect(component.name, component.label, component.initialValue.split(`,`).map((value, index) => (
          {
            selected: index === 0,
            value,
            description: value,
            text: `Select ${value}`,
          }
        )));
      } else {
        //Input box
        commandUI.addInput(component.name, component.label, '', { default: component.initialValue });
      }
    }

    commandUI.addButtons({ id: `execute`, label: `Execute` }, { id: `cancel`, label: `Cancel` });

    const page = await commandUI.loadPage<any>(name);
    if (page) {
      page.panel.dispose();
      if (page.data && page.data.buttons !== `cancel`) {
        const dataEntries = Object.entries(page.data);
        for (const component of components.reverse()) {
          const value = dataEntries.find(([key]) => key === component.name)?.[1];
          command = command.substring(0, component.start) + value + command.substring(component.end);
        }
      } else {
        command = '';
      }
    }
  }

  return command;
}

export function parseCommandString(input: string): Record<string, string> {
  const regex = /(\w+)\(([^)]*)\)/g; // Match KEYWORD(value)
  const result: Record<string, string> = {};

  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    const key = match[1];  // Capture the keyword
    const value = match[2]; // Capture the value inside parentheses
    result[key] = value;   // Add to the result object
  }

  return result;
}

export function replaceCommandDefault(command: string, keyword: string, replaceValue: string): string {
  if (replaceValue === "") {
    return command;
  }

  let newCommand = ``;
  const commandName = command.split(' ')[0];
  let commandParts = parseCommandString(command);
  // const recordSize: number = Object.keys(commandParts).length;
  for (const key in commandParts) {
    if (commandParts.hasOwnProperty(key)) {
      let [name, label, initialValue] = commandParts[key].split(`|`);
      if (key === keyword) {
        // pass default value not the same as defined default so add value.
        // const pos = initialValue.indexOf(replaceValue);
        // if (pos < 0) {
        initialValue = replaceValue + `,` + initialValue;
        // }
        newCommand += `${key}(${name}|${label}|${initialValue}) `;
      }
      else {
        newCommand += `${key}(${commandParts[key]}) `;
      }
    }
  }
  return commandName + ` ` + newCommand;
}
export function replaceCommandDefaultold(command: string, keyword: string, replaceValue: string): string {

  let loop = true;
  let end = 0;
  while (loop) {
    const idx = command.indexOf(`\${`, end);
    if (idx >= 0) {
      const start = idx;
      end = command.indexOf(`}`, start);
      if (end >= 0) {
        let currentInput = command.substring(start + 2, end);
        let [name, label, initialValue] = currentInput.split(`|`);
        if (keyword !== name) {
          continue;
        }
        if (initialValue.indexOf(replaceValue) === 0) {
          initialValue += replaceValue + `,` + initialValue;
        }
        let pipe = command.indexOf(`|`, start);
        pipe = command.indexOf(`|`, pipe + 1);
        command = command.substring(0, pipe) + `${replaceValue},` + command.substring(pipe + 1);

      } else {
        loop = false;
      }
    } else {
      loop = false;
    }
  }
  return command;
}
/**
 * Computes where to highlight the search result label text
 */
export function computeHighlights(term: string, line: string): [number, number][] {
  let HI: [number, number][] = [];
  if (term > '') {
    let index = 0;
    while (index >= 0) {
      index = line.indexOf(term, index);
      if (index >= 0) {
        HI.push([index, index + term.length]);
        index += term.length;
      }
    }
  }
  return HI;
}

/**
 * Use this function to alter the library reference if the source passes something like PRDSRC 
 * This will be needed if the calling tool is triggered off a source file member reference.
 *  
 * @param library 
 * @param command
 * @returns the adjusted lib value
 */
export function scrubLibrary(lib: string, command: string, fromSourceFile?: boolean): string {
  if (/.*(SRC).*/gi.test(lib) || fromSourceFile) {
    switch (command) {
    case `DSPSCNSRC`:
      break;
    case `DSPOBJU`:
    case `DSPPGMOBJ`:
      lib = `*ALL`;
      break;
    case `DSPFILSETU`:
      lib = `*DOCLIBL`;
      break;
    default:
      lib = `*LIBL`;
      break;
    }
  }
  else if (lib === `*`) {
    switch (command) {
    case `DSPOBJU`:
    case `DSPPGMOBJ`:
      lib = `*ALL`;
      break;
    case `DSPFILSETU`:
      lib = `*DOCLIBL`;
      break;
    default:
      break;
    }
  } else {
  }
  return lib;
}
/**
 * setProtectMode
 * Determine source protection by default as protecting unless otherwise known.
 * @param library 
 * @param command
 * @returns a true or false value
 */
export function setProtectMode(library: string, command: String): boolean {
  let protection: boolean = true;
  if (command === `DSPSCNSRC`) {
    if (Code4i.getConnection().currentUser === library) { protection = false; }
  }
  return protection;
}
export function showExtensionVersion(extensionId: string) {
  try {
    const extensionPath = vscode.extensions.getExtension(extensionId)?.extensionPath;
    if (!extensionPath) {
      vscode.window.showErrorMessage('Could not determine extension path.');
      return;
    }
    const packageJsonPath = path.join(extensionPath, 'package.json');

    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    const description = packageJson.description || 'No description available.';
    const version = packageJson.version || 'Unknown version.';

    vscode.window.showInformationMessage(`Extension: ${description}\nVersion  : ${version}`, { modal: true });

  } catch (error: any) {
    vscode.window.showErrorMessage(`Error getting extension info: ${error.message}`);
  }
}