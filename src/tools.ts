import { CodeForIBMi, CommandResult, RemoteCommand } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/api/Instance";
import { Tools } from '@halcyontech/vscode-ibmi-types/api/Tools';
import { CachedServerSettings, GlobalStorage } from '@halcyontech/vscode-ibmi-types/api/Storage';
import * as vscode from 'vscode';
import { Extension, extensions } from "vscode";

let codeForIBMi : CodeForIBMi;
let baseExtension: Extension<CodeForIBMi> | undefined;

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
  // export async function getTable(library: string, name: string): Promise<Tools.DB2Row[]> {
  //     return getContent().getTable(library, name, name, true);
  // }
  export async function runSQL(sqlStatement: string): Promise<Tools.DB2Row[]> {
    return getContent().ibmi.runSQL(sqlStatement);
  }
  export async function runCommand(command: RemoteCommand): Promise<CommandResult> {
    return await getConnection().runCommand(command);
  }
  export async function getMemberInfo(library: string, sourceFile: string, member: string): Promise<IBMiMember | undefined> {
    return await getConnection().getContent().getMemberInfo(library, sourceFile, member);
  }
  export function makeid(length?: number) {
    return getBase()!.tools.makeid(length);
  }
  export async function getLibraryIAsp(library: string): Promise<string | undefined> {
    return getConnection().getLibraryIAsp(library);
  }
  export function getCurrentIAspName(): string | undefined {
    return getConnection().getCurrentIAspName();
  }
  export async function lookupLibraryIAsp(library: string): Promise<string | undefined> {
    return getConnection().lookupLibraryIAsp(library);
  }
}

export const IBMI_OBJECT_NAME = /^([\w$#@][\w\d$#@_.]{0,9})$/i;

export function getQSYSObjectPath(library: string, name: string, type: string, member?: string, iasp?: string) {
    return `${iasp ? `/${iasp.toUpperCase()}` : ''}/QSYS.LIB/${library.toUpperCase()}.LIB/${name.toUpperCase()}.${type.toUpperCase()}${member ? `/${member.toUpperCase()}.MBR` : ''}`;
}

export function makeid(length? : number){
    return codeForIBMi.tools.makeid(length);
}
export function getInstance(): Instance | undefined {
    return (baseExtension && baseExtension.isActive && baseExtension.exports ? baseExtension.exports.instance : undefined);
}
export function sanitizeSearchTerm(searchTerm: string): string {
    return searchTerm.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
}

export function nthIndex(aString: string, pattern: string, n: number) {
    let index = -1;
    while (n-- && index++ < aString.length) {
        index = aString.indexOf(pattern, index);
        if (index < 0) { break; }
    }
    return index;
}  
export async function getLibraryAspInfo( library: string) :Promise<string|undefined> {
    let asp :string | undefined;
    const [row] = await Code4i.runSQL(`SELECT IASP_NUMBER FROM TABLE(QSYS2.LIBRARY_INFO('${library}'))`);
    const iaspNumber = row?.IASP_NUMBER;
    if (iaspNumber && typeof iaspNumber === 'number' && Code4i.getConnection().aspInfo[iaspNumber]) {
      asp = `/${Code4i.getConnection().aspInfo[iaspNumber]}`;
    }
    return asp;
    else { 
      srcObjType = `*ANY:${parts[4]}`;
      break;
    }
  default:
    srcObjType = `*ANY:${parts[4]}`;
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

export function replaceCommandDefault(command: string, keyword:string, replaceValue:string) : string
{
  if (replaceValue === '') {return command;}
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
        if (keyword!==name) {continue;} // Not at keyword to alter default value
        let pipe = command.indexOf(`|`, start);
        pipe = command.indexOf(`|`, pipe+1);
        command = command.substring(0,pipe)+`${replaceValue},`+command.substring(0,pipe+1);
      } else {
        loop = false;
      }
    } else {
      loop = false;
    }
  }
  return command;
}