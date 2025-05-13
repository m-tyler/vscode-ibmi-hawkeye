

// Level 1: Search Run object 
export type HawkeyeSearchMatches = {
  command: string,
  searchDescription: string, // e.g., DSPOBJU mm/dd/yy hh:mm
  searchTerm: string,
  files: SourceFileMatch[]
};
// Level 2: File object
export type SourceFileMatch = {
  fileName: string, // e.g., /wiasp/QSYS.LIB/WFISRC.LIB/QRPGSRC.FILE/PRP11JRG.RPGL
  fileText: string, 
  howused: string,
  matches: SearchMatch[]
};
// Level 3: Match object
export interface SearchMatch {
  line: number; // Line number of the match
  content: string; // Match content
}




export interface SearchResult {
  timestamp: string; // e.g., "MATTSCMD 04/28/25 at 15:25"
  files: SearchFile[]; // List of files
}

export interface SearchFile {
  fileName: string; // e.g., "file1.txt"
  matches: SearchMatch[]; // Matches within the file
}
