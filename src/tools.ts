import { CodeForIBMi, CommandResult, RemoteCommand } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/Instance";
import IBMi from "@halcyontech/vscode-ibmi-types/api/IBMi";
import type { Tools } from '@halcyontech/vscode-ibmi-types/api/Tools';
import { Extension, ExtensionContext } from "vscode";
import { IBMiMember } from '@halcyontech/vscode-ibmi-types';
import { loadBase, getBase } from './base';

let codeForIBMi : CodeForIBMi;
let sysTools : IBMi;
let baseExtension: Extension<CodeForIBMi> | undefined;

export namespace Code4i {
    export async function initialize(context: ExtensionContext) {
        loadBase(context);
    }
    
    export function getInstance() {
        return getBase()!.instance;
    }
    export function getConnection() {
        return getBase()!.instance.getConnection();
    }

    export function getConfig() {
        return getBase()!.instance.getConnection().getConfig();
    }

    export function getContent() {
        return getBase()!.instance.getConnection().getContent();
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
    
    export async function runCommand(command: RemoteCommand) : Promise<CommandResult>  {
        return await getConnection().runCommand(command);
    }
    export async function getMemberInfo(library: string, sourceFile: string, member: string): Promise<IBMiMember | undefined> {
        return await getConnection().getContent().getMemberInfo(library, sourceFile, member);
    }
    export function makeid(length? : number){
        return getBase()!.tools.makeid(length);
    }
    export async function getLibraryIAsp( library: string) :Promise<string|undefined> {
        return getConnection().getLibraryIAsp(library);
    }
    export async function lookupLibraryIAsp( library: string) :Promise<string|undefined> {
        return getConnection().lookupLibraryIAsp(library);
    }
}

export const IBMI_OBJECT_NAME = /^([\w$#@][\w\d$#@_.]{0,9})$/i;

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
// export async function getLibraryAspInfo( library: string) :Promise<string|undefined> {
//     // let asp :string | undefined;
//     // const [row] = await Code4i.runSQL(`SELECT IASP_NUMBER FROM TABLE(QSYS2.LIBRARY_INFO('${library}'))`);
//     // const iaspNumber = row?.IASP_NUMBER;
//     // if (iaspNumber && typeof iaspNumber === 'number' && Code4i.getConnection().aspInfo[iaspNumber]) {
//     //   asp = `/${Code4i.getConnection().aspInfo[iaspNumber]}`;
//     // }
//     // return asp;
// }