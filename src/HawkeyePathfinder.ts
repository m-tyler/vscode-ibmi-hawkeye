/* eslint-disable @typescript-eslint/naming-convention */
import vscode, { l10n, } from 'vscode';
import { Code4i } from "./tools";
import { HwkI } from "./commands";
// import { SearchResultProvider } from "./search/SearchProvider";
import { SearchTreeProvider } from "./search/SearchTreeProvider";
import { getRandomLocalizedMessages, getCommandText } from "./localizedMessages";
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
      try {
        const searchResults = await HwkI.searchSourceFiles(memberItem);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults[0].command, searchResults, searchResults[0].searchTerm);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayFileSetsUsed`, async (Item) => {
      try {
        const searchResults = await HwkI.displayFileSetsUsed(Item);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults[0].command, searchResults, searchResults[0].searchTerm);
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayProgramObjects`, async (Item) => {
      try {
        const searchResults = await HwkI.displayProgramObjects(Item);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults[0].command, searchResults, searchResults[0].searchTerm);
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayObjectUsed`, async (Item) => {
      try {
        const searchResults = await HwkI.displayObjectUsed(Item);
        if (searchResults) {
          searchTreeProvider.addSearchSession(searchResults[0].command, searchResults, searchResults[0].searchTerm);
        }
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTRPGPRT', async (memberItem: MemberItem) => {
      await HwkI.runPRTRPGPRT(memberItem);
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSPRT', async (memberItem: MemberItem) => {
      await HwkI.runPRTDDSPRT(memberItem);
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSDSP', async (memberItem: MemberItem) => {
      await HwkI.runPRTDDSDSP(memberItem);
    }),
    vscode.commands.registerCommand('Hawkeye-Pathfinder.getRandomMessage', async () => {
      const commandName: string = `DSPOBJU`;
      const myTestData = {
        path: "/*LIBL/*ALL/PRP*.PGM",
        library: "WFISRC",
        name: "PRP06YRG",
        sourceFile: "QRPGSRC",
        type: "PGM",
        searchItem: `PRP06YRG`,
        searchTerm: ``,
        memberCount: 3800,
        commandName: commandName,
        commandText: getCommandText(commandName.toLocaleLowerCase())
      };
      const randomLocalizedMessages = getRandomLocalizedMessages(myTestData, 8);
      vscode.window.showInformationMessage(randomLocalizedMessages.map((msg, index) => `${index + 1}. ${msg}`).join('\n'), { modal: true });
    }),
  );
  Code4i.getInstance().subscribe(context, `connected`, "Hawkeye Extension Setup", create_HWK_getObjectSourceInfo_Tools);
}

async function create_HWK_getObjectSourceInfo_Tools(): Promise<void> {
  const library = Code4i.getTempLibrary();
  // let obj_exists = await getContent()?.checkObject({ library: library, name: "VSC00AFN86", type: "*PGM" });
  if ((await Code4i.runSQL(`select 1 as PROC_EXISTS from QSYS2.SYSPROCS where ROUTINE_NAME = 'VSC00AFN86'`)).length = 0) { // PROC not found
    // }
    // if (!obj_exists) {
    Code4i.runCommand({
      command: `RUNSQL SQL('${getHWK_getObjectSourceInfo_sp_src(library)}') COMMIT(*NONE) NAMING(*SQL)`,
      cwd: `/`,
      noLibList: true
    });
  }
  if (!await Code4i.getContent()?.checkObject({ library: library, name: "VSC00AFN87", type: "*SRVPGM" })) {
    Code4i.runCommand({
      command: `RUNSQL SQL('${getHWK_getObjectSourceInfo_func_src(library)}') COMMIT(*NONE) NAMING(*SQL)`,
      cwd: `/`,
      noLibList: true
    });
  }
  // searchTreeProvider.addSearchSession(searchResults[0].command, searchResults, searchResults[0].searchTerm)
}
function getHWK_getObjectSourceInfo_sp_src(library: string): string {
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
function getHWK_getObjectSourceInfo_func_src(library: string): string {
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
