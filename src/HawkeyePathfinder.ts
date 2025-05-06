/* eslint-disable @typescript-eslint/naming-convention */
import vscode, { l10n, } from 'vscode';
import { Code4i, getInstance } from "./tools";
import { HawkeyeSearch } from "./api/HawkeyeSearch";
import { HawkeyeSearchView } from "./views/HawkeyeSearchView";
import { getMemberCount } from "./api/IBMiTools";
import { HwkI } from "./commands";
import { SearchResultProvider, SearchResult } from "./search/SearchProvider";
import { MemberItem, CommandResult } from '@halcyontech/vscode-ibmi-types';

export function initializeHawkeyePathfinder(context: vscode.ExtensionContext) {
  // const searchResultProvider = new SearchResultProvider();
  // const treeView = vscode.window.createTreeView("Hawkeye", {
  //   treeDataProvider: searchResultProvider,
  // });
  hawkeyeSearchViewProvider = new HawkeyeSearchView(context);
  context.subscriptions.push(
    hawkeyeSearchViewer,
    // treeView,
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.searchSourceFiles`, async (memberItem: MemberItem) => {
      try {
        const searchResults = await HwkI.searchSourceFiles(memberItem);
        // searchResultProvider.addSearchResults(searchResults);
      } catch (e: unknown) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayFileSetsUsed`, async (Item) => {
      try {
        const searchResults = await HwkI.displayFileSetsUsed(Item);
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayProgramObjects`, async (Item) => {
      try {
        const searchResults = await HwkI.displayProgramObjects(Item);
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
        }
      }
    }),
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayObjectUsed`, async (Item) => {
      try {
        const searchResults = await HwkI.displayObjectUsed(Item);
      } catch (e) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
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
    //   // vscode.window.registerTreeDataProvider(`hawkeyeSearchView`, hawkeyeSearchViewProvider),
  );
<<<<<<< Updated upstream
  getInstance()?.subscribe(context, `connected`, "Hawkeye Extension Setup" , create_HWK_getObjectSourceInfo_Tools);
=======
  Code4i.getInstance().subscribe(context, `connected`, "Hawkeye Extension Setup", create_HWK_getObjectSourceInfo_Tools);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
  if (!await getContent()?.checkObject({ library: library, name: "VSC00AFN87", type: "*SRVPGM" })) {
    Code4i.runCommand({
      command: `RUNSQL SQL('${getHWK_getObjectSourceInfo_func_src(library)}') COMMIT(*NONE) NAMING(*SQL)`,
      cwd: `/`,
      noLibList: true
    });
  }
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

// /**
//  * Use this function to alter the library reference if the source passes something like WFISRC
//  * This will be needed if the calling tool is triggered off a source file member reference.
//  *
//  * @param library
//  * @param command
//  * @returns the adjusted lib value
//  */
// function scrubLibrary(lib: string, command: string): string {
//   if (/.*(SRC).*/gi.test(lib)) {
//     switch (command) {
//     case `DSPSCNSRC`:
//       break;
//     case `DSPOBJU`:
//     case `DSPPGMOBJ`:
//       lib = `*ALL`;
//       break;
//     case `DSPFILSETU`:
//       lib = `*DOCLIBL`;
//       break;
//     default:
//       lib = `*LIBL`;
//       break;
//     }
//   }
//   else if (lib === `*`) {
//     switch (command) {
//     case `DSPOBJU`:
//     case `DSPPGMOBJ`:
//       lib = `*ALL`;
//       break;
//     case `DSPFILSETU`:
//       lib = `*DOCLIBL`;
//       break;
//     default:
//       break;
//     }
//   } else {
//   }
//   return lib;
// }
// /**
//  * setProtectMode
//  * Determine source protection by default as protecting unless otherwise known.
//  * @param library
//  * @param command
//  * @returns a true or false value
//  */
// function setProtectMode(library: string, command: String): boolean {
//   let protection: boolean = true;
//   if (command === `DSPSCNSRC`) {
//     if (Code4i.getConnection().currentUser === library) { protection = false; }
//   }
//   return protection;
// }
