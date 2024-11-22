import { CodeForIBMi, CommandResult, RemoteCommand } from '@halcyontech/vscode-ibmi-types';
import Instance from "@halcyontech/vscode-ibmi-types/api/Instance";
import { Tools } from '@halcyontech/vscode-ibmi-types/api/Tools';
import { Extension, extensions } from "vscode";
import { IBMiMember } from '@halcyontech/vscode-ibmi-types';

let codeForIBMi : CodeForIBMi;
let baseExtension: Extension<CodeForIBMi> | undefined;

export namespace Code4i {
    export async function initialize() {
        // const baseExtension = vscode.extensions.getExtension<CodeForIBMi>(`halcyontechltd.code-for-ibmi`);
        baseExtension = (extensions ? extensions.getExtension(`halcyontechltd.code-for-ibmi`) : undefined);
        if (baseExtension) {
            codeForIBMi = (baseExtension.isActive ? baseExtension.exports : await baseExtension.activate());
        }
        else {
            throw new Error("halcyontechltd.code-for-ibmi not found or cannot be activated");
        }
    }

    export function getConnection() {
        return codeForIBMi.instance.getConnection();
    }

    export function getConfig() {
        return codeForIBMi.instance.getConfig();
    }

    export function getContent() {
        return codeForIBMi.instance.getContent();
    }

    export function getTempLibrary(): string {
        return getConfig().tempLibrary;
    }

    export async function getTable(library: string, name: string): Promise<Tools.DB2Row[]> {
        return getContent().getTable(library, name, name, true);
    }

    export async function runSQL(sqlStatement: string): Promise<Tools.DB2Row[]> {
        return getContent().ibmi.runSQL(sqlStatement);
    }
    
    export async function runCommand(command: RemoteCommand) : Promise<CommandResult>  {
        return await getConnection().runCommand(command);
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
export async function getLibraryAspInfo( library: string) :Promise<string|undefined> {
    let asp :string | undefined;
    const [row] = await Code4i.runSQL(`SELECT IASP_NUMBER FROM TABLE(QSYS2.LIBRARY_INFO('${library}'))`);
    const iaspNumber = row?.IASP_NUMBER;
    if (iaspNumber && typeof iaspNumber === 'number' && Code4i.getConnection().aspInfo[iaspNumber]) {
      asp = `/${Code4i.getConnection().aspInfo[iaspNumber]}`;
    }
    return asp;
}