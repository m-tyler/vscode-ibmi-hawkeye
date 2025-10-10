import vscode, { l10n, } from 'vscode';
import { Code4i } from "./tools/tools";
import { HwkI } from "./commands";
import { SearchTreeProvider } from "./search/SearchTreeProvider";
import { MemberItem } from '@halcyontech/vscode-ibmi-types';

export function initializeHawkeyePathfinder(context: vscode.ExtensionContext) {
  const searchTreeProvider = new SearchTreeProvider(context);
  const searchTreeView = vscode.window.createTreeView(
    `hawkeyeSearchView`, {
    treeDataProvider: searchTreeProvider,
  });
  context.subscriptions.push(
    searchTreeView,
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.searchSourceFiles`, async (memberItem: MemberItem) => {
      if (!await checkPathfinderExistence()) {return;}
      try {
        const searchResults = await HwkI.searchSourceFiles(memberItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm);
        } else {
          vscode.window.showInformationMessage(l10n.t(`Hawkeye search source canceled`));
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayFileSetsUsed`, async (fileItem) => {
      if (!await checkPathfinderExistence()) {return;}
      try {
        const searchResults = await HwkI.displayFileSetsUsed(fileItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm> ''?searchResults.searchTerm:'');
          vscode.commands.executeCommand(`Hawkeye-Pathfinder.setViewVisible`,true);
        } else {
          vscode.window.showInformationMessage(l10n.t(`Hawkeye Display File Set Used canceled`));
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error(12): {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayProgramObjects`, async (anyItem) => {
      if (!await checkPathfinderExistence()) {return;}
      try {
        const searchResults = await HwkI.displayProgramObjects(anyItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm> ''?searchResults.searchTerm:'');
          vscode.commands.executeCommand(`Hawkeye-Pathfinder.setViewVisible`,true);
        } else {
          vscode.window.showInformationMessage(l10n.t(`Hawkeye Display Program Objects canceled`));
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error(13): {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayObjectUsed`, async (anyItem) => {
      if (!await checkPathfinderExistence()) {return;}
      try {
        const searchResults = await HwkI.displayObjectUsed(anyItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm> ''?searchResults.searchTerm:'');
          vscode.commands.executeCommand(`Hawkeye-Pathfinder.setViewVisible`,true);
        } else {
          vscode.window.showInformationMessage(l10n.t(`Hawkeye Display Object Useage canceled`));
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error(14): {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayProcedureUsed`, async (anyItem) => {
      if (!await checkPathfinderExistence()) {return;}
      try {
        const searchResults = await HwkI.displayProcedureUsed(anyItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm> ''?searchResults.searchTerm:'');
          vscode.commands.executeCommand(`Hawkeye-Pathfinder.setViewVisible`,true);
        } else {
          vscode.window.showInformationMessage(l10n.t(`Hawkeye Display Procedure Usage canceled`));
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error(15): {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTRPGPRT', async (memberItem: MemberItem) => {
      if (!await checkPathfinderExistence()) {return;}
      await HwkI.runPRTRPGPRT(memberItem);
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSPRT', async (memberItem: MemberItem) => {
      if (!await checkPathfinderExistence()) {return;}
      await HwkI.runPRTDDSPRT(memberItem);
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSDSP', async (memberItem: MemberItem) => {
      if (!await checkPathfinderExistence()) {return;}
      await HwkI.runPRTDDSDSP(memberItem);
    }),
  );
  Code4i.getInstance().subscribe(context, `connected`, "Hawkeye Extension Setup", runOnConnection);
  Code4i.getInstance().subscribe(context, `disconnected`, "Hawkeye Extension Cleanup", runOnDisconnection);
}
function runOnConnection() {
  // msgqBrowserObj.populateData(Code4i.getConfig().messageQueues);
  createHWKgetObjectSourceInfoTools();
}
async function runOnDisconnection() {
  vscode.commands.executeCommand(`Hawkeye-Pathfinder.clearSessions`);
  vscode.commands.executeCommand(`Hawkeye-Pathfinder.refreshSearchView`);
}
async function createHWKgetObjectSourceInfoTools(): Promise<void> {
  const library = Code4i.getTempLibrary();
  // let obj_exists = await getContent()?.checkObject({ library: library, name: "VSC00AFN86", type: "*PGM" });
  if ((await Code4i.runSQL(`select 1 as PROC_EXISTS from QSYS2.SYSPROCS where ROUTINE_NAME = 'VSC00AFN86'`)).length = 0) { // PROC not found
    // }
    // if (!obj_exists) {
    Code4i.runCommand({
      command: `RUNSQL SQL('${getHWKgetObjectSourceInfoSpSrc(library)}') COMMIT(*NONE) NAMING(*SQL)`,
      cwd: `/`,
      noLibList: true
    });
  }
  if (!await Code4i.getContent()?.checkObject({ library: library, name: "VSC00AFN87", type: "*SRVPGM" })) {
    Code4i.runCommand({
      command: `RUNSQL SQL('${getHWKgetObjectSourceInfoFuncSrc(library)}') COMMIT(*NONE) NAMING(*SQL)`,
      cwd: `/`,
      noLibList: true
    });
  }
  // searchTreeProvider.addSearchSession(searchResults.command, searchResults, searchResults.searchTerm)
}
function getHWKgetObjectSourceInfoSpSrc(library: string): string {
  return [
    `create or replace procedure ${library}.HWK_getObjectSourceInfo_sp`,
    `( in APITYP CHAR(2)`,
    `,in APIOPT  CHAR(2)`,
    `,in APIOB  CHAR(10)`,
    `,in APIOBL  CHAR(10)`,
    `,in APIOBM  CHAR(10)`,
    `,in APIOBA  CHAR(10)`,
    `,inout APISTS  CHAR(1)`,
    `,inout APISF  CHAR(10)`,
    `,inout APISFL  CHAR(10)`,
    `,inout APISFM  CHAR(10)`,
    `)`,
    `language cl`,
    `Parameter Style General`,
    `specific VSC00AFN86`,
    `external name HAWKEYE.H$APISRC`,
  ].join(` `);
}
function getHWKgetObjectSourceInfoFuncSrc(library: string): string {
  return [`create or replace function ${library}.HWK_GetObjectSourceInfo`,
    `(`,
    ` APITYP CHAR(2)`,
    `,APIOPT  CHAR(2)`,
    `,APIOB  CHAR(10)`,
    `,APIOBL  CHAR(10)`,
    `,APIOBM  CHAR(10)`,
    `,APIOBA  CHAR(10)`,
    `)`,
    `returns table (`,
    ` APISTS  CHAR(1)`,
    `,APISF  CHAR(10)`,
    `,APISFL  CHAR(10)`,
    `,APISFM  CHAR(10)`,
    `)`,
    `language sql`,
    `specific VSC00AFN87`,
    `not deterministic`,
    `called on null input`,
    `no external action`,
    `modifies sql data`,
    `not fenced`,
    `set option  alwblk = *ALLREAD ,`,
    `alwcpydta = *OPTIMIZE ,`,
    `datfmt = *ISO,`,
    `commit = *NONE ,`,
    `dbgview = *SOURCE ,`,
    `decresult = (31, 31, 00) ,`,
    `dftrdbcol = *NONE ,`,
    `dyndftcol = *NO ,`,
    `dynusrprf = *USER ,`,
    `srtseq = *HEX`,
    `begin`,
    `declare  APISTS  CHAR(1) default '' '';`,
    `declare  APISF  CHAR(10) default '' '';`,
    `declare  APISFL  CHAR(10) default '' '';`,
    `declare  APISFM  CHAR(10) default '' '';`,
    `call HWK_getObjectSourceInfo_sp(APITYP,APIOPT,APIOB,APIOBL,APIOBM,APIOBA,APISTS,APISF,APISFL,APISFM);`,
    `return select * from table(values (APISTS,APISF,APISFL,APISFM ) ) x (APISTS,APISF,APISFL,APISFM);`,
    `end`,
  ].join(` `);
}
async function checkPathfinderExistence(): Promise<boolean>{

const itsThere = await Code4i.checkObject(`HAWKEYE`, `HAWKBAR`, `*CMD`);
if (!itsThere) {
  const message = `Hawkeye Pathfinder is not installed on system ${Code4i.getConnection().currentConnectionName}`;
  vscode.window.showErrorMessage( l10n.t(message) );  
  return false;
}
return true;
}