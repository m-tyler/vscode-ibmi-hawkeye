
import { QsysFsOptions } from '@halcyontech/vscode-ibmi-types/';
import  { Range } from "vscode";

export const QSYS_PATTERN = /^(?:\/)|(?:QSYS\.LIB\/)|(?:\.LIB)|(?:\.FILE)|(?:\.MBR)/g;
export const IBMI_OBJECT_NAME = /^([\w$#@][\w\d$#@_.]{0,9})$/i;
export const NEWLINE = `\r\n`;

export type OpenEditableOptions = QsysFsOptions & { position?: Range };

// Level 1: Search Run object 
export type HawkeyeSearchMatches = {
  command: string;
  searchDescription: string; // e.g.; DSPOBJU mm/dd/yy hh:mm
  searchItem: string;
  searchTerm: string;
  files: SourceFileMatch[]
};
// Level 2: File object
export type SourceFileMatch = {
  fileName: string; // e.g.; PRP11JRG
  filePath: string; // e.g.; /wiasp/QSYS.LIB/WFISRC.LIB/QRPGSRC.FILE/PRP11JRG.RPGLE
  fileText: string; 
  howUsed: string;
  protected: boolean;
  matchCount: number;
  matches: SearchMatch[]
};
// Level 3: Match object
// export interface SearchMatch {
export type SearchMatch = {
  lineNumber: number; // Line number of the match
  content: string; // Match content
};
