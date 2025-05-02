/* eslint-disable @typescript-eslint/naming-convention */
import vscode, { l10n, } from 'vscode';
import { Code4i, showCustomInputs, parseCommandString } from "./tools";
import { HawkeyeSearch } from "./api/HawkeyeSearch";
import { HawkeyeSearchView } from "./views/HawkeyeSearchView";
import { getMemberCount } from "./api/IBMiTools";
import { searchSourceFiles } from "./commands";
import { MemberItem, CommandResult } from '@halcyontech/vscode-ibmi-types';

let hawkeyeSearchViewProvider: HawkeyeSearchView;
export function initializeHawkeyePathfinder(context: vscode.ExtensionContext) {
  hawkeyeSearchViewProvider = new HawkeyeSearchView(context);
  const hawkeyeSearchViewer = vscode.window.createTreeView(
    `hawkeyeSearchView`, {
    treeDataProvider: hawkeyeSearchViewProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });
  context.subscriptions.push(
    hawkeyeSearchViewer,
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.searchSourceFiles`, async (memberItem: MemberItem) => {
  //     let ww = <wItem>{};
  //     ww.searchTerms = [];
  //     let promptedValue = ``;
  //     if (memberItem) {
  //       ww.path = memberItem.path;
  //       ww.protected = memberItem.filter.protected;
  //       ww.library = memberItem.filter.library;
  //       ww.sourceFile = memberItem.filter.object;
  //       ww.name = memberItem.filter.member;
  //       ww.type = memberItem.filter.memberType;
  //       promptedValue = `${ww.library}/${ww.sourceFile}/${ww.name}.${ww.type}`;
  //     }
  //     else {
  //       ww.library = ``;
  //       ww.name = ``;
  //       promptedValue = ``;
  //       ww.protected = true;
  //     }
  //     // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
  //     let command: string = '';
  //     let cmdResult: CommandResult;
  //     const chosenAction2 = hawkeyeActions[0]; // DSPSCNSRC
  //     command = await showCustomInputs(`Run Command`, chosenAction2.command, chosenAction2.name || `Command`);
  //     if (!command) { return; }
  //     // console.log(command);

  //     // Parse user input into values to pass on to secondary tools. 
  //     let keywords = parseCommandString(command);
  //     // console.log(keywords);
  //     const path1 = keywords.SRCLIB + '/' + keywords.SRCFILE + '/' + keywords.SRCMBR;
  //     const mbrtype = keywords.TYPE === '*ALL' ? '*ALL' : keywords.TYPE;
  //     ww.path = path1 + '.' + mbrtype;
  //     ww.library = keywords.SRCLIB;
  //     ww.sourceFile = keywords.SRCFILE;
  //     ww.name = keywords.SRCMBR;
  //     ww.type = mbrtype;

  //     if (keywords.SCAN1 !== '') {
  //       ww.searchTerms.push(keywords.SCAN1);
  //     }
  //     if (keywords.SCAN2 !== '') {
  //       ww.searchTerms.push(keywords.SCAN2);
  //     }
  //     if (keywords.SCAN3 !== '') {
  //       ww.searchTerms.push(keywords.SCAN3);
  //     }
  //     if (keywords.SCAN4 !== '') {
  //       ww.searchTerms.push(keywords.SCAN4);
  //     }
  //     if (keywords.SCAN5 !== '') {
  //       ww.searchTerms.push(keywords.SCAN5);
  //     }
  //     if (keywords.SCAN6 !== '') {
  //       ww.searchTerms.push(keywords.SCAN6);
  //     }
  //     if (keywords.SCAN7 !== '') {
  //       ww.searchTerms.push(keywords.SCAN7);
  //     }
  //     if (keywords.SCAN8 !== '') {
  //       ww.searchTerms.push(keywords.SCAN8);
  //     }
  //     if (keywords.SCAN9 !== '') {
  //       ww.searchTerms.push(keywords.SCAN9);
  //     }
  //     if (keywords.SCANA !== '') {
  //       ww.searchTerms.push(keywords.SCANA);
  //     }
  //     console.log(ww.searchTerms);
  //     ww.searchTerm = ww.searchTerms.join(',');
  //     console.log(ww.searchTerm);
  //     ww.library = scrubLibrary(ww.library, `DSPSCNSRC`);
  //     ww.protected = setProtectMode(ww.library, `DSPSCNSRC`);

  //     // Hawkeye-Pathfinder
  //     if (ww.path) {

  //       if (ww.sourceFile !== ` `) {
  //         if (!ww.searchTerm || ww.searchTerm === ` `) {

  //           ww.searchTerm = await vscode.window.showInputBox({
  //             prompt: l10n.t(`Use command DSPSCNSRC to search {0}.`, ww.path),
  //             placeHolder: l10n.t(`Enter the search for term`),
  //           }) || '';
  //         }

  //         if (ww.searchTerm) {
            let term : string = '';
            try {
  //             await vscode.window.withProgress({
  //               location: vscode.ProgressLocation.Notification,
  //               title: l10n.t(`Searching`),
  //             }, async progress => {
  //               progress.report({
  //                 message: l10n.t(`Fetching member count for {0}`, ww.path)
  //               });
  //               const memberCount = await getMemberCount({ library: ww.library, sourceFile: ww.sourceFile, members: ww.name, extensions: ww.type });

  //               if (memberCount > 0) {
  //                 // NOTE: if more messages are added, lower the timeout interval
  //                 const timeoutInternal = 9000;
  //                 const searchMessages = [
  //                   l10n.t(`Using Hawkeye Pathfinder's DSPSCNSRC to search source members`),
  //                   l10n.t(`'{0}' in {1}.`, ww.searchTerm, ww.path),
  //                   l10n.t(`This is taking a while because there are {0} members. Searching '{1}' in {2} still.`, memberCount, ww.searchTerm, ww.path),
  //                   l10n.t(`What's so special about '{0}' anyway?`, ww.searchTerm),
  //                   l10n.t(`Still searching '{0}' in {1}...`, ww.searchTerm, ww.path),
  //                   l10n.t(`While you wait, why not make some tea?`),
  //                   l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
  //                   l10n.t(`Why was six afraid of seven?`),
  //                   l10n.t(`How does one end up with {0} members?`, memberCount),
  //                   l10n.t(`'{0}' in {1}.`, ww.searchTerm, ww.path),
  //                 ];

  //                 let currentMessage = 0;
  //                 const messageTimeout = setInterval(() => {
  //                   if (currentMessage < searchMessages.length) {
  //                     progress.report({
  //                       message: searchMessages[currentMessage]
  //                     });
  //                     currentMessage++;
  //                   } else {
  //                     clearInterval(messageTimeout);
  //                   }
  //                 }, timeoutInternal);
  //                 // Hawkeye-Pathfinder-DSPSCNSRC
  //                 // returns results member name with member type as extension
  //                 let results = await HawkeyeSearch.searchMembers(ww.library, ww.sourceFile
  //                   , `${ww.name || `*`}.${ww.type || `*`}`
  //                   , ww.searchTerm, ww.protected);

  //                 // Filter search result by member type filter.
  //                 if (results.length > 0 && ww.type) {
  //                   const patternExt = new RegExp(`^` + ww.type.replace(/[*]/g, `.*`).replace(/[$]/g, `\\$`) + `$`);
  //                   results = results.filter(result => {
  //                     const resultPath = result.path.split(`/`);
  //                     const resultName = resultPath[resultPath.length - 1].split(`.`)[0];
  //                     const resultExt = resultPath[resultPath.length - 1].split(`.`)[1];
  //                     // const member = members.find(member => member.name === resultName);
  //                     const member = resultName;
  //                     return (member && patternExt.test(resultExt));
  //                   });
  //                 }

  //                 if (results.length > 0) {
  //                   const objectNamesLower = true;
  //                   // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

  //                   results.forEach(result => {
  //                     if (objectNamesLower === true) {
  //                       result.path = result.path.toLowerCase();
  //                     }
  //                     result.label = result.path;
  //                   });

  //                   results = results.sort((a, b) => {
  //                     return a.path.localeCompare(b.path);
  //                   });
                    const searchResults = await searchSourceFiles(memberItem);
                    if (searchResults) {
                      term = searchResults.searchTerm||'';
                      const results = searchResults.results||[];
                      hawkeyeSearchViewProvider.setResults(`DSPSCNSRC`, term, results);

                  } else {
                    vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' in HAWKEYE/DSPSCNSRC {1}.`
                      , term, memberItem.path
                    ));
                  }

  //               } else {
  //                 vscode.window.showErrorMessage(l10n.t(`No members to search.`));
  //               }

  //             });

            } catch (e: unknown) {
              if (e instanceof Error) {
                vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
              }
            }
  //         }
  //       }

  //     } else {
  //       //Running from command.
  //     }
    }),
  //   vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayFileSetsUsed`, async (Item) => {
  //     let ww = <wItem>{};
  //     let promptedValue;
  //     if (Item && Item.object) {
  //       ww.path = Item.path;
  //       ww.protected = Item.filter.protected;
  //       ww.library = Item.object.library;
  //       ww.library = scrubLibrary(ww.library, `DSPFILSETU`);
  //       ww.name = Item.object.name;
  //       ww.type = Item.object.attribute;
  //       promptedValue = `${ww.library}/${ww.name}`;
  //     }
  //     else if (Item && Item.member) {
  //       ww.path = Item.path;
  //       ww.protected = Item.member.protected;
  //       ww.library = Item.member.library;
  //       ww.library = scrubLibrary(ww.library, `DSPFILSETU`);
  //       ww.name = Item.member.name;
  //       ww.type = Item.member.extension;
  //       promptedValue = `${ww.library}/${ww.name}`;

  //     }
  //     else {
  //       ww.library = ``;
  //       ww.name = ``;
  //       promptedValue = ``;
  //       ww.protected = true;
  //     }
  //     if (ww.path) {
  //       if (ww.type === 'SQL' && (/.*(tb|pf|v.*)/gi.test(ww.name))
  //         || ww.type === 'PF') {
  //       } else {
  //         // if (ww && !(/.*(tb.*\.sql|pf.*\.pf|v.*\.sql)/.test(ww.path))) {
  //         vscode.window.showErrorMessage(l10n.t(`Display File Set Used is only value for database tables or views.`));
  //         return;
  //       }
  //     }
  //     const input = await vscode.window.showInputBox({
  //       prompt: l10n.t(`See the help for DSPFILSETU for selectable input values`),
  //       title: l10n.t(`Display File Set Where Used`),
  //       value: promptedValue,
  //       placeHolder: l10n.t(`Enter LIBRARY/FILE to search for references.`),
  //       validateInput: (input) => {
  //         input = input.trim();
  //         const path = input.split(`/`);
  //         let checkPath;
  //         if (path.length > 2) {
  //           return l10n.t(`Please enter value in form LIBRARY/FILE`);
  //         }
  //       }
  //     });

  //     if (input) {
  //       const wpath = input.trim().toUpperCase().split(`/`);
  //       if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //       ww.path = [wpath[0], wpath[1]].join('/');
  //       ww.library = wpath[0];
  //       ww.name = wpath[1];
  //     }

  //     // Hawkeye-Pathfinder
  //     if (ww.path) {

  //       if (ww.name !== ` `) {
  //         // const aspText = ((config.sourceASP && config.sourceASP.length > 0) ? l10n.t(`(in ASP {0})`, config.sourceASP) : ``);

  //         const searchTerm = await vscode.window.showInputBox({
  //           prompt: l10n.t(`Select token to search results from DSPFILSETU`),
  //           value: `*NA`,
  //           placeHolder: l10n.t(`Enter the search for term`),
  //         });

  //         if (searchTerm) {
  //           try {
  //             await vscode.window.withProgress({
  //               location: vscode.ProgressLocation.Notification,
  //               title: l10n.t(`Searching`),
  //             }, async progress => {
  //               progress.report({
  //                 message: l10n.t(`Starting process to find file sets used.`, ww.path)
  //               });

  //               // NOTE: if more messages are added, lower the timeout interval
  //               const timeoutInternal = 9000;
  //               const searchMessages = [
  //                 l10n.t(`Using Hawkeye Pathfinder's DSPFILSETU to search for file sets used`),
  //                 l10n.t(`Searching in '{1}' for uses of {0}.`, searchTerm, ww.path),
  //                 // l10n.t(`This is taking a while because there are {0} members. Searching '{1}' in {2} still.`, members.length, xrefLib, ww.path),
  //                 l10n.t(`What's so special about '{0} in {1}' anyway?`, searchTerm, ww.path),
  //                 l10n.t(`Still getting uses for {0}...`, ww.path),
  //                 l10n.t(`While you wait, why not make some tea?`),
  //                 l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
  //                 l10n.t(`Why was six afraid of seven?`),
  //                 // l10n.t(`How does one end up with {0} members?`, members.length),
  //                 l10n.t(`Searching in '{0}' for uses of {1}.`, searchTerm, ww.path),
  //               ];

  //               let currentMessage = 0;
  //               const messageTimeout = setInterval(() => {
  //                 if (currentMessage < searchMessages.length) {
  //                   progress.report({
  //                     message: searchMessages[currentMessage]
  //                   });
  //                   currentMessage++;
  //                 } else {
  //                   clearInterval(messageTimeout);
  //                 }
  //               }, timeoutInternal);
  //               // Hawkeye-Pathfinder-DSPSCNSRC
  //               // returns results member name with member type as extension
  //               let results = await HawkeyeSearch.hwkdisplayFileSetsUsed(ww.library, ww.name, searchTerm, ww.protected);

  //               if (results.length > 0) {
  //                 const objectNamesLower = true;
  //                 // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

  //                 results.forEach(result => {
  //                   if (objectNamesLower === true) {
  //                     result.path = result.path.toLowerCase();
  //                   }
  //                   result.label = result.path;
  //                 });

  //                 results = results.sort((a, b) => {
  //                   return a.path.localeCompare(b.path);
  //                 });
  //                 setSearchResultsHwk(`DSPFILSETU`, ww.path, results);

  //               } else {
  //                 vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPFILSETU {1}.`
  //                   , searchTerm, ww.path
  //                 ));
  //               }

  //             });

  //           } catch (e) {
  //             if (e instanceof Error) {
  //               vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
  //             }
  //           }
  //         }
  //       }

  //     } else {
  //       //Running from command.
  //     }
  //   }),
  //   vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayProgramObjects`, async (Item) => {
  //     let ww = <wItem>{};
  //     let promptedValue;
  //     if (Item && Item.object) {
  //       ww.path = Item.path;
  //       ww.protected = Item.filter.protected;
  //       ww.library = Item.object.library;
  //       ww.library = scrubLibrary(ww.library, `DSPPGMOBJ`);
  //       ww.name = Item.object.name;
  //       ww.type = Item.object.type;
  //       promptedValue = `${ww.library}/${ww.name}`;
  //     }
  //     else if (Item && Item.member) {
  //       ww.path = Item.path;
  //       ww.protected = Item.member.protected;
  //       ww.library = Item.member.library;
  //       ww.library = scrubLibrary(ww.library, `DSPPGMOBJ`);
  //       ww.name = Item.member.name;
  //       ww.type = Item.member.extension;
  //       promptedValue = `${ww.library}/${ww.name}`;

  //     }
  //     else {
  //       ww.library = ``;
  //       ww.name = ``;
  //       promptedValue = ``;
  //       ww.protected = true;
  //     }
  //     if (Item && ((/.*(tb|pf|v.*|cmd)/gi.test(ww.type)) || !(/(\*PGM|\*SRVPGM)/gi.test(ww.type)))) {
  //       vscode.window.showErrorMessage(l10n.t(`Display Program Objects is only value for *PGM or *SRVPGM types.`));
  //       return;
  //     }
  //     const input = await vscode.window.showInputBox({
  //       prompt: l10n.t(`See the help for DSPPGMOBJ for selectable input value`),
  //       title: l10n.t(`Display Program Objects`),
  //       value: promptedValue,
  //       placeHolder: l10n.t(`Enter LIBRARY/PROGRAM to list objects used by program.`),
  //       validateInput: (input) => {
  //         input = input.trim();
  //         const path = input.split(`/`);
  //         if (path.length > 2) {
  //           return l10n.t(`Please enter value in form LIBRARY/PROGRAM.`);
  //         }
  //       }
  //     });

  //     if (input) {
  //       const wpath = input.trim().toUpperCase().split(`/`);
  //       if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //       ww.path = [wpath[0], wpath[1]].join('/');
  //       ww.library = wpath[0];
  //       ww.name = wpath[1];
  //       ww.type = `*`;
  //     }

  //     // Hawkeye-Pathfinder
  //     if (ww.path) {

  //       if (ww.name !== ` `) {

  //         const searchTerm = await vscode.window.showInputBox({
  //           prompt: l10n.t(`Select token to search results from DSPPGMOBJ`),
  //           value: `*NA`,
  //           placeHolder: l10n.t(`Enter the search for term`),
  //         });

  //         if (searchTerm) {
  //           try {
  //             await vscode.window.withProgress({
  //               location: vscode.ProgressLocation.Notification,
  //               title: `Searching`,
  //             }, async progress => {
  //               progress.report({
  //                 message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
  //               });

  //               // NOTE: if more messages are added, lower the timeout interval
  //               const timeoutInternal = 9000;
  //               const searchMessages = [
  //                 l10n.t(`Using Hawkeye Pathfinder's DSPPGMOBJ to list program objects used`),
  //                 l10n.t(`Searching in '{1}' for uses of {0}.`, searchTerm, ww.path),
  //                 l10n.t(`What's so special about '{0} in {1}' anyway?`, searchTerm, ww.path),
  //                 l10n.t(`Still getting uses for {0}...`, ww.path),
  //                 l10n.t(`While you wait, why not make some tea?`),
  //                 l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
  //                 l10n.t(`Why was six afraid of seven?`),
  //                 l10n.t(`Searching in '{0}' for uses of {1}.`, searchTerm, ww.path),
  //               ];

  //               let currentMessage = 0;
  //               const messageTimeout = setInterval(() => {
  //                 if (currentMessage < searchMessages.length) {
  //                   progress.report({
  //                     message: searchMessages[currentMessage]
  //                   });
  //                   currentMessage++;
  //                 } else {
  //                   clearInterval(messageTimeout);
  //                 }
  //               }, timeoutInternal);
  //               // Hawkeye-Pathfinder-DSPSCNSRC
  //               // returns results member name with member type as extension
  //               let results = await HawkeyeSearch.hwkdisplayProgramObjects(ww.library, ww.name, searchTerm, ww.protected);

  //               if (results.length > 0) {
  //                 const objectNamesLower = true;
  //                 // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

  //                 results.forEach(result => {
  //                   if (objectNamesLower === true) {
  //                     result.path = result.path.toLowerCase();
  //                   }
  //                   result.label = result.path;
  //                 });

  //                 results = results.sort((a, b) => {
  //                   return a.path.localeCompare(b.path);
  //                 });
  //                 setSearchResultsHwk(`DSPPGMOBJ`, ww.path, results);

  //               } else {
  //                 vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPPGMOBJ {1}.`
  //                   , searchTerm, ww.path
  //                 ));
  //               }

  //             });

  //           } catch (e) {
  //             if (e instanceof Error) {
  //               vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
  //             }
  //           }
  //         }
  //       }

  //     } else {
  //       //Running from command.
  //     }
  //   }),
  //   vscode.commands.registerCommand(`Hawkeye-Pathfinder.displayObjectUsed`, async (Item) => {
  //     let ww = <wItem>{};
  //     let promptedValue;
  //     if (Item && Item.object) {
  //       ww.path = Item.path;
  //       ww.protected = Item.filter.protected;
  //       ww.library = Item.object.library;
  //       ww.library = scrubLibrary(ww.library, `DSPOBJU`);
  //       ww.name = Item.object.name;
  //       ww.type = Item.object.attribute;
  //       promptedValue = `${ww.library}/${ww.name}`;
  //     }
  //     else if (Item && Item.member) {
  //       ww.path = Item.path;
  //       ww.protected = Item.member.protected;
  //       ww.library = Item.member.library;
  //       ww.library = scrubLibrary(ww.library, `DSPOBJU`);
  //       ww.name = Item.member.name;
  //       ww.type = Item.member.extension;
  //       promptedValue = `${ww.library}/${ww.name}`;

  //     }
  //     else {
  //       ww.library = ``;
  //       ww.name = ``;
  //       promptedValue = ``;
  //       ww.protected = true;
  //     }
  //     const input = await vscode.window.showInputBox({
  //       prompt: l10n.t(`Find where object is used by. See the help for DSPOBJU for selectable input values`),
  //       title: l10n.t(`Display Object Where Used`),
  //       // value: preloadvalue,
  //       value: promptedValue,
  //       placeHolder: l10n.t(`Enter LIBRARY/PROGRAM.(*|TYPE)`),
  //       validateInput: (input) => {
  //         input = input.trim();
  //         const path = input.split(`/`);
  //         if (path.length > 2) {
  //           return l10n.t(`Please enter value in form LIBRARY/PROGRAM.(*|TYPE)`);
  //         }
  //       }
  //     });

  //     if (input) {
  //       // ww = scrubInput(input, ww, `DSPOBJU`);
  //       let wpath = input.trim().toUpperCase().split(`/`);
  //       if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //       ww.path = [wpath[0], wpath[1]].join('/');
  //       ww.library = wpath[0];
  //       wpath = wpath[1].split(`.`);// split wpath[1] into obj + type
  //       ww.name = wpath[0];
  //       ww.type = wpath[1] ? wpath[1] : `*`;
  //     }

  //     // Hawkeye-Pathfinder
  //     if (ww.path) {

  //       if (ww.name !== ` `) {

  //         const searchTerm = await vscode.window.showInputBox({
  //           prompt: l10n.t(`Select token to search within the results from DSPOBJU`),
  //           value: `*NA`,
  //           placeHolder: l10n.t(`Enter the search for term`),
  //         });

  //         if (searchTerm) {
  //           const howUsed = await vscode.window.showInputBox({
  //             prompt: l10n.t(`Select the HOW USED string from DSPOBJU`),
  //             value: `*NA`,
  //             placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
  //           });

  //           if (howUsed) {
  //             try {
  //               await vscode.window.withProgress({
  //                 location: vscode.ProgressLocation.Notification,
  //                 title: `Searching`,
  //               }, async progress => {
  //                 progress.report({
  //                   message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
  //                 });

  //                 // NOTE: if more messages are added, lower the timeout interval
  //                 const timeoutInternal = 9000;
  //                 const searchMessages = [
  //                   l10n.t(`Using Hawkeye Pathfinder's DSPOBJU to list object used details`),
  //                   l10n.t(`Searching in '{1}' for uses of {0}.`, searchTerm, ww.path),
  //                   l10n.t(`What's so special about '{0} in {1}' anyway?`, searchTerm, ww.path),
  //                   l10n.t(`Still getting uses for {0}...`, ww.path),
  //                   l10n.t(`While you wait, why not make some tea?`),
  //                   l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
  //                   l10n.t(`Why was six afraid of seven?`),
  //                   l10n.t(`Searching in '{0}' for uses of {1}.`, searchTerm, ww.path),
  //                 ];

  //                 let currentMessage = 0;
  //                 const messageTimeout = setInterval(() => {
  //                   if (currentMessage < searchMessages.length) {
  //                     progress.report({
  //                       message: searchMessages[currentMessage]
  //                     });
  //                     currentMessage++;
  //                   } else {
  //                     clearInterval(messageTimeout);
  //                   }
  //                 }, timeoutInternal);
  //                 // Hawkeye-Pathfinder-DSPSCNSRC
  //                 // returns results member name with member type as extension
  //                 let results = await HawkeyeSearch.hwkdisplayObjectUsed(ww.library, ww.name, ww.type
  //                   , searchTerm, howUsed, ww.protected);

  //                 if (results.length > 0) {
  //                   const objectNamesLower = true;
  //                   // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

  //                   results.forEach(result => {
  //                     if (objectNamesLower === true) {
  //                       result.path = result.path.toLowerCase();
  //                     }
  //                     result.label = result.path;
  //                   });

  //                   results = results.sort((a, b) => {
  //                     return a.path.localeCompare(b.path);
  //                   });
  //                   setSearchResultsHwk(`DSPOBJU`, ww.path, results);

  //                 } else {
  //                   vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPOBJU {1}.`
  //                     , searchTerm, ww.path
  //                   ));
  //                 }

  //               });

  //             } catch (e) {
  //               if (e instanceof Error) {
  //                 vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
  //               }
  //             }
  //           }
  //         }
  //       }

  //     } else {
  //       //Running from command.
  //     }
  //   }),
  //   vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTRPGPRT', async (memberItem: MemberItem) => {
  //     //Run commands, print to output, etc
  //     const connection = Code4i.getConnection();

  //     //Run SQL, upload/download stuff
  //     if (memberItem && !(/.*(RPG).*/gi.test(memberItem.path))) {
  //       vscode.window.showErrorMessage(l10n.t(`Spacing Chart-RPG Print File is only value for *RPG* programs.`));
  //       return;
  //     }
  //     //Prompt
  //     const command = await vscode.window.showInputBox({
  //       prompt: l10n.t("Prompt and run"),
  //       value: `PRTRPGPRT SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  //     });

  //     if (command) { //if prompt wasn't canceled
  //       const result = await connection.runCommand({ command, environment: "ile" });
  //       if (result.code === 0) {
  //         //success
  //         console.log(result.stdout);
  //         vscode.window.showInformationMessage(l10n.t("Command PRTRPGPRT successful, check your spooled files"));

  //       }
  //       else {
  //         //failure
  //         vscode.window.showErrorMessage(l10n.t("Command PRTRPGPRT failed: {0}", result.stderr)); //show the error output in error notification
  //       }
  //     }
  //   }),
  //   vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSPRT', async (memberItem: MemberItem) => {
  //     //Run commands, print to output, etc
  //     const connection = Code4i.getConnection();

  //     //Run SQL, upload/download stuff
  //     if (memberItem && !(/.*(PRTF).*/gi.test(memberItem.path))) {
  //       vscode.window.showErrorMessage(l10n.t(`Spacing Chart-DDS Print File is only value for *PRTF* member.`));
  //       return;
  //     }
  //     //Prompt
  //     const command = await vscode.window.showInputBox({
  //       prompt: l10n.t("Prompt and run"),
  //       value: `PRTDDSPRT SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  //     });

  //     if (command) { //if prompt wasn't canceled
  //       const result = await connection.runCommand({ command, environment: "ile" });
  //       if (result.code === 0) {
  //         //success
  //         console.log(result.stdout);
  //         vscode.window.showInformationMessage(l10n.t("Command PRTDDSPRT successful, check your spooled files"));

  //       }
  //       else {
  //         //failure
  //         vscode.window.showErrorMessage(l10n.t("Command PRTDDSPRT failed: {0}", result.stderr)); //show the error output in error notification
  //       }
  //     }
  //   }),
  //   vscode.commands.registerCommand('Hawkeye-Pathfinder.runPRTDDSDSP', async (memberItem: MemberItem) => {
  //     //Run commands, print to output, etc
  //     const connection = Code4i.getConnection();

  //     //Run SQL, upload/download stuff
  //     if (memberItem && !(/.*(DSPF).*/gi.test(memberItem.path))) {
  //       vscode.window.showErrorMessage(l10n.t(`Spacing Chart-DDS Display File is only value for *DSPF* member.`));
  //       return;
  //     }
  //     //Prompt
  //     const command = await vscode.window.showInputBox({
  //       prompt: l10n.t("Prompt and run"),
  //       value: `PRTDDSDSP SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  //     });

  //     if (command) { //if prompt wasn't canceled
  //       const result = await connection.runCommand({ command, environment: "ile" });
  //       if (result.code === 0) {
  //         //success
  //         console.log(result.stdout);
  //         vscode.window.showInformationMessage(l10n.t("Command PRTDDSDSP successful, check your spooled files"));

  //       }
  //       else {
  //         //failure
  //         vscode.window.showErrorMessage(l10n.t("Command PRTDDSDSP failed: {0}", result.stderr)); //show the error output in error notification
  //       }
  //     }
  //   }),
  //   // vscode.window.registerTreeDataProvider(`hawkeyeSearchView`, hawkeyeSearchViewProvider),
  );
  Code4i.getInstance().subscribe(context, `connected`, "Hawkeye Extension Setup", create_HWK_getObjectSourceInfo_Tools);
}

function setSearchResultsHwk(actionCommand: string, term: string, results: HawkeyeSearch.Result[]) {
  hawkeyeSearchViewProvider.setResults(actionCommand, term, results);
}

async function create_HWK_getObjectSourceInfo_Tools(): Promise<void> {
  const library = Code4i.getTempLibrary();
  // let obj_exists = await Code4i.getContent()?.checkObject({ library: library, name: "VSC00AFN86", type: "*PGM" });
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