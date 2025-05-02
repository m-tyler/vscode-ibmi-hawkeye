import vscode, { l10n, } from 'vscode';
import { Code4i, showCustomInputs, parseCommandString } from "./tools";
import { HawkeyeSearch } from "./api/HawkeyeSearch";
import { HawkeyeSearchView } from "./views/HawkeyeSearchView";
import { getMemberCount } from "./api/IBMiTools";
import { hawkeyeActions } from "./commandActions";
import { MemberItem, ObjectItem, CommandResult } from '@halcyontech/vscode-ibmi-types';
import { SearchResult } from './newwork/SearchResult';
//https://code.visualstudio.com/api/references/icons-in-labels
// Create objects and functionality for this tool, here.

// eslint-disable-next-line @typescript-eslint/naming-convention
interface wItem {
  path: string,
  protected: boolean,
  library: string,
  name: string,
  sourceFile: string,
  type: string,
  searchTerm: string
  searchTerms: string[]
};
interface SearchResults {
  searchTerm?: string,
  results?: HawkeyeSearch.Result[]
};
export async function searchSourceFiles(memberItem: MemberItem): Promise<SearchResults> {
  let ww = <wItem>{};
  ww.searchTerms = [];
  if (memberItem) {
    ww.path = memberItem.path;
    ww.protected = memberItem.filter.protected;
    ww.library = memberItem.filter.library;
    ww.sourceFile = memberItem.filter.object;
    ww.name = memberItem.filter.member;
    ww.type = memberItem.filter.memberType;
  }
  else {
    ww.library = ``;
    ww.name = ``;
    ww.protected = true;
  }
  // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
  let command: string = '';
  const chosenAction = hawkeyeActions[0]; // DSPSCNSRC
  command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
  if (!command) { return {}; }

  // Parse user input into values to pass on to secondary tools. 
  let keywords = parseCommandString(command);
  // console.log(keywords);
  if (!keywords) {
    return {};
  } else {
    const path1 = keywords.SRCLIB + '/' + keywords.SRCFILE + '/' + keywords.SRCMBR;
    const mbrtype = keywords.TYPE === '*ALL' ? '*ALL' : keywords.TYPE;
    ww.path = path1 + '.' + mbrtype;
    ww.library = keywords.SRCLIB;
    ww.sourceFile = keywords.SRCFILE;
    ww.name = keywords.SRCMBR;
    ww.type = mbrtype;

    if (keywords.SCAN1 !== '') {
      ww.searchTerms.push(keywords.SCAN1);
    }
    if (keywords.SCAN2 !== '') {
      ww.searchTerms.push(keywords.SCAN2);
    }
    if (keywords.SCAN3 !== '') {
      ww.searchTerms.push(keywords.SCAN3);
    }
    if (keywords.SCAN4 !== '') {
      ww.searchTerms.push(keywords.SCAN4);
    }
    if (keywords.SCAN5 !== '') {
      ww.searchTerms.push(keywords.SCAN5);
    }
    if (keywords.SCAN6 !== '') {
      ww.searchTerms.push(keywords.SCAN6);
    }
    if (keywords.SCAN7 !== '') {
      ww.searchTerms.push(keywords.SCAN7);
    }
    if (keywords.SCAN8 !== '') {
      ww.searchTerms.push(keywords.SCAN8);
    }
    if (keywords.SCAN9 !== '') {
      ww.searchTerms.push(keywords.SCAN9);
    }
    if (keywords.SCANA !== '') {
      ww.searchTerms.push(keywords.SCANA);
    }
  }
  ww.searchTerm = ww.searchTerms.join(',');
  ww.library = scrubLibrary(ww.library, `DSPSCNSRC`);
  ww.protected = setProtectMode(ww.library, `DSPSCNSRC`);

  // Hawkeye-Pathfinder
  if (ww.path) {

    if (ww.sourceFile !== ` `) {
      if (!ww.searchTerm || ww.searchTerm === ` `) {

        ww.searchTerm = await vscode.window.showInputBox({
          prompt: l10n.t(`Use command DSPSCNSRC to search {0}.`, ww.path),
          placeHolder: l10n.t(`Enter the search for term`),
        }) || '';
      }

      if (ww.searchTerm) {
        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: l10n.t(`Searching`),
          }, async progress => {
            progress.report({
              message: l10n.t(`Fetching member count for {0}`, ww.path)
            });
            const memberCount = await getMemberCount({ library: ww.library, sourceFile: ww.sourceFile, members: ww.name, extensions: ww.type });

            if (memberCount > 0) {
              // NOTE: if more messages are added, lower the timeout interval
              const timeoutInternal = 9000;
              const searchMessages = [
                l10n.t(`Using Hawkeye Pathfinder's DSPSCNSRC to search source members`),
                l10n.t(`'{0}' in {1}.`, ww.searchTerm, ww.path),
                l10n.t(`This is taking a while because there are {0} members. Searching '{1}' in {2} still.`, memberCount, ww.searchTerm, ww.path),
                l10n.t(`What's so special about '{0}' anyway?`, ww.searchTerm),
                l10n.t(`Still searching '{0}' in {1}...`, ww.searchTerm, ww.path),
                l10n.t(`While you wait, why not make some tea?`),
                l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
                l10n.t(`Why was six afraid of seven?`),
                l10n.t(`How does one end up with {0} members?`, memberCount),
                l10n.t(`'{0}' in {1}.`, ww.searchTerm, ww.path),
              ];

              let currentMessage = 0;
              const messageTimeout = setInterval(() => {
                if (currentMessage < searchMessages.length) {
                  progress.report({
                    message: searchMessages[currentMessage]
                  });
                  currentMessage++;
                } else {
                  clearInterval(messageTimeout);
                }
              }, timeoutInternal);
              // Hawkeye-Pathfinder-DSPSCNSRC
              // returns results member name with member type as extension
              let results = await HawkeyeSearch.searchMembers(ww.library, ww.sourceFile
                , `${ww.name || `*`}.${ww.type || `*`}`
                , ww.searchTerm, ww.protected);

              // Filter search result by member type filter.
              if (results.length > 0 && ww.type) {
                const patternExt = new RegExp(`^` + ww.type.replace(/[*]/g, `.*`).replace(/[$]/g, `\\$`) + `$`);
                results = results.filter(result => {
                  const resultPath = result.path.split(`/`);
                  const resultName = resultPath[resultPath.length - 1].split(`.`)[0];
                  const resultExt = resultPath[resultPath.length - 1].split(`.`)[1];
                  // const member = members.find(member => member.name === resultName);
                  const member = resultName;
                  return (member && patternExt.test(resultExt));
                });
              }

              if (results.length > 0) {
                const objectNamesLower = true;
                // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

                results.forEach(result => {
                  if (objectNamesLower === true) {
                    result.path = result.path.toLowerCase();
                  }
                  result.label = result.path;
                });

                results = results.sort((a, b) => {
                  return a.path.localeCompare(b.path);
                });
                return { searchTerm: ww.searchTerm, results: results };
                // setSearchResultsHwk(`DSPSCNSRC`, ww.searchTerm, results);

              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' in HAWKEYE/DSPSCNSRC {1}.`
                  , ww.searchTerm, ww.path
                ));
              }

            } else {
              vscode.window.showErrorMessage(l10n.t(`No members to search.`));
            }

          });

        } catch (e: unknown) {
          if (e instanceof Error) {
            vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
          }
        }
      }
    }

  } else {
    //Running from command.
  }
  return {};
};
export async function displayFileSetsUsed(item: any): Promise<SearchResults> {
  let ww = <wItem>{};
  let promptedValue;
  if (item && item.object) {
    ww.path = item.path;
    ww.protected = item.filter.protected;
    ww.library = item.object.library;
    ww.library = scrubLibrary(ww.library, `DSPFILSETU`);
    ww.name = item.object.name;
    ww.type = item.object.attribute;
    promptedValue = `${ww.library}/${ww.name}`;
  }
  else if (item && item.member) {
    ww.path = item.path;
    ww.protected = item.member.protected;
    ww.library = item.member.library;
    ww.library = scrubLibrary(ww.library, `DSPFILSETU`);
    ww.name = item.member.name;
    ww.type = item.member.extension;
    promptedValue = `${ww.library}/${ww.name}`;

  }
  else {
    ww.library = ``;
    ww.name = ``;
    promptedValue = ``;
    ww.protected = true;
  }
  if (ww.path) {
    if (ww.type === 'SQL' && (/.*(tb|pf|v.*)/gi.test(ww.name))
      || ww.type === 'PF') {
    } else {
      // if (ww && !(/.*(tb.*\.sql|pf.*\.pf|v.*\.sql)/.test(ww.path))) {
      vscode.window.showErrorMessage(l10n.t(`Display File Set Used is only value for database tables or views.`));
      return {};
    }
  }
  // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
  let command: string = '';
  const chosenAction = hawkeyeActions[1]; // DSPFILSET
  command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
  if (!command) { return {}; }

  // Parse user input into values to pass on to secondary tools. 
  let keywords = parseCommandString(command);
  // console.log(keywords);
  if (!keywords) {
    return {};
  } else {
    ww.path = keywords.FILELIB + '/' + keywords.FILE;
    ww.library = keywords.FILELIB;
    ww.sourceFile = keywords.FILE;
    ww.name = keywords.FILE;
    ww.type = '*FILE';
    ww.searchTerm = keywords.SCAN || '';
  }
  // const input = await vscode.window.showInputBox({
  //   prompt: l10n.t(`See the help for DSPFILSETU for selectable input values`),
  //   title: l10n.t(`Display File Set Where Used`),
  //   value: promptedValue,
  //   placeHolder: l10n.t(`Enter LIBRARY/FILE to search for references.`),
  //   validateInput: (input) => {
  //     input = input.trim();
  //     const path = input.split(`/`);
  //     let checkPath;
  //     if (path.length > 2) {
  //       return l10n.t(`Please enter value in form LIBRARY/FILE`);
  //     }
  //   }
  // });

  // if (input) {
  //   const wpath = input.trim().toUpperCase().split(`/`);
  //   if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //   ww.path = [wpath[0], wpath[1]].join('/');
  //   ww.library = wpath[0];
  //   ww.name = wpath[1];
  // }

  // Hawkeye-Pathfinder
  if (ww.path) {

    if (ww.name !== ` `) {

      if (!ww.searchTerm) {
        ww.searchTerm = await vscode.window.showInputBox({
          prompt: l10n.t(`Select token to search results from DSPFILSETU`),
          value: `*NA`,
          placeHolder: l10n.t(`Enter the search for term`),
        }) || '';
      }

      if (ww.searchTerm) {
        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: l10n.t(`Searching`),
          }, async progress => {
            progress.report({
              message: l10n.t(`Starting process to find file sets used.`, ww.path)
            });

            // NOTE: if more messages are added, lower the timeout interval
            const timeoutInternal = 9000;
            const searchMessages = [
              l10n.t(`Using Hawkeye Pathfinder's DSPFILSETU to search for file sets used`),
              l10n.t(`Searching in '{1}' for uses of {0}.`, ww.searchTerm, ww.path),
              // l10n.t(`This is taking a while because there are {0} members. Searching '{1}' in {2} still.`, members.length, xrefLib, ww.path),
              l10n.t(`What's so special about '{0} in {1}' anyway?`, ww.searchTerm, ww.path),
              l10n.t(`Still getting uses for {0}...`, ww.path),
              l10n.t(`While you wait, why not make some tea?`),
              l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
              l10n.t(`Why was six afraid of seven?`),
              // l10n.t(`How does one end up with {0} members?`, members.length),
              l10n.t(`Searching in '{0}' for uses of {1}.`, ww.searchTerm, ww.path),
            ];

            let currentMessage = 0;
            const messageTimeout = setInterval(() => {
              if (currentMessage < searchMessages.length) {
                progress.report({
                  message: searchMessages[currentMessage]
                });
                currentMessage++;
              } else {
                clearInterval(messageTimeout);
              }
            }, timeoutInternal);
            // returns results member name with member type as extension
            let results = await HawkeyeSearch.hwkdisplayFileSetsUsed(ww.library, ww.name, ww.searchTerm, ww.protected);

            if (results.length > 0) {
              const objectNamesLower = true;
              results.forEach(result => {
                if (objectNamesLower === true) {
                  result.path = result.path.toLowerCase();
                }
                result.label = result.path;
              });

              results = results.sort((a, b) => {
                return a.path.localeCompare(b.path);
              });
              return { searchTerm: ww.path, results: results };

            } else {
              vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPFILSETU {1}.`
                , ww.searchTerm, ww.path
              ));
            }

          });

        } catch (e) {
          if (e instanceof Error) {
            vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
          }
        }
      }
    }

  } else {
    //Running from command.
  };
  return {};
};
export async function displayProgramObjects(item: any): Promise<SearchResults> {
  let ww = <wItem>{};
  if (item && item.object) {
    ww.path = item.path;
    ww.protected = item.filter.protected;
    ww.library = item.object.library;
    ww.library = scrubLibrary(ww.library, `DSPPGMOBJ`);
    ww.name = item.object.name;
    ww.type = item.object.type;
  }
  else if (item && item.member) {
    ww.path = item.path;
    ww.protected = item.member.protected;
    ww.library = item.member.library;
    ww.library = scrubLibrary(ww.library, `DSPPGMOBJ`);
    ww.name = item.member.name;
    ww.type = item.member.extension;

  }
  else {
    ww.library = ``;
    ww.name = ``;
    ww.protected = true;
    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = hawkeyeActions[2]; // DSPPGMOBJ
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { return {}; }
  
    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    // console.log(keywords);
    if (!keywords) {
      return {};
    } else {
      ww.path = keywords.OBJLIB + '/' + keywords.OBJ;
      ww.library = keywords.OBJLIB;
      ww.name = keywords.OBJ;
      ww.type = keywords.OBJTYPE;
      ww.searchTerm = keywords.SCAN || '';
    }
  }
  if (item && ((/.*(tb|pf|v.*|cmd)/gi.test(ww.type)) || !(/(\*PGM|\*SRVPGM)/gi.test(ww.type)))) {
    vscode.window.showErrorMessage(l10n.t(`Display Program Objects is only value for *PGM or *SRVPGM types.`));
    return {};
  }


  // const input = await vscode.window.showInputBox({
  //   prompt: l10n.t(`See the help for DSPPGMOBJ for selectable input value`),
  //   title: l10n.t(`Display Program Objects`),
  //   value: promptedValue,
  //   placeHolder: l10n.t(`Enter LIBRARY/PROGRAM to list objects used by program.`),
  //   validateInput: (input) => {
  //     input = input.trim();
  //     const path = input.split(`/`);
  //     if (path.length > 2) {
  //       return l10n.t(`Please enter value in form LIBRARY/PROGRAM.`);
  //     }
  //   }
  // });

  // if (input) {
  //   const wpath = input.trim().toUpperCase().split(`/`);
  //   if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //   ww.path = [wpath[0], wpath[1]].join('/');
  //   ww.library = wpath[0];
  //   ww.name = wpath[1];
  //   ww.type = `*`;
  // }

  // Hawkeye-Pathfinder
  if (ww.path) {

    if (ww.name !== ` `) {

      if (!ww.searchTerm) {
        ww.searchTerm = await vscode.window.showInputBox({
          prompt: l10n.t(`Select token to search results from DSPPGMOBJ`),
          value: `*NA`,
          placeHolder: l10n.t(`Enter the search for term`),
        }) || '';
      }

      if (ww.searchTerm) {
        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Searching`,
          }, async progress => {
            progress.report({
              message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
            });

            // NOTE: if more messages are added, lower the timeout interval
            const timeoutInternal = 9000;
            const searchMessages = [
              l10n.t(`Using Hawkeye Pathfinder's DSPPGMOBJ to list program objects used`),
              l10n.t(`Searching in '{1}' for uses of {0}.`, ww.searchTerm, ww.path),
              l10n.t(`What's so special about '{0} in {1}' anyway?`, ww.searchTerm, ww.path),
              l10n.t(`Still getting uses for {0}...`, ww.path),
              l10n.t(`While you wait, why not make some tea?`),
              l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
              l10n.t(`Why was six afraid of seven?`),
              l10n.t(`Searching in '{0}' for uses of {1}.`, ww.searchTerm, ww.path),
            ];

            let currentMessage = 0;
            const messageTimeout = setInterval(() => {
              if (currentMessage < searchMessages.length) {
                progress.report({
                  message: searchMessages[currentMessage]
                });
                currentMessage++;
              } else {
                clearInterval(messageTimeout);
              }
            }, timeoutInternal);
            // Hawkeye-Pathfinder-DSPSCNSRC
            // returns results member name with member type as extension
            let results = await HawkeyeSearch.hwkdisplayProgramObjects(ww.library, ww.name, ww.searchTerm, ww.protected);

            if (results.length > 0) {
              const objectNamesLower = true;
              // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

              results.forEach(result => {
                if (objectNamesLower === true) {
                  result.path = result.path.toLowerCase();
                }
                result.label = result.path;
              });

              results = results.sort((a, b) => {
                return a.path.localeCompare(b.path);
              });
              return { searchTerm: ww.path, results: results };
            } else {
              vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPPGMOBJ {1}.`
                , ww.searchTerm, ww.path
              ));
            }

          });

        } catch (e) {
          if (e instanceof Error) {
            vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
          }
        }
      }
    }

  } else {
    //Running from command.
  }
  return {};
};
export async function displayObjectUsed(item: any): Promise<SearchResults> {
  let ww = <wItem>{};
  if (item && item.object) {
    ww.path = item.path;
    ww.protected = item.filter.protected;
    ww.library = item.object.library;
    ww.library = scrubLibrary(ww.library, `DSPOBJU`);
    ww.name = item.object.name;
    ww.type = item.object.attribute;
  }
  else if (item && item.member) {
    ww.path = item.path;
    ww.protected = item.member.protected;
    ww.library = item.member.library;
    ww.library = scrubLibrary(ww.library, `DSPOBJU`);
    ww.name = item.member.name;
    ww.type = item.member.extension;

  }
  else {
    ww.library = ``;
    ww.name = ``;
    ww.protected = true;
    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = hawkeyeActions[1]; // DSPFILSET
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { return {}; }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    // console.log(keywords);
    if (!keywords) {
      return {};
    } else {
      ww.path = keywords.OBJLIB + '/' + keywords.OBJ;
      ww.library = keywords.OBJLIB;
      ww.name = keywords.OBJ;
      ww.type = keywords.OBJTYPE;
      ww.searchTerm = keywords.SCAN || '';
    }
  }
  // const input = await vscode.window.showInputBox({
  //   prompt: l10n.t(`Find where object is used by. See the help for DSPOBJU for selectable input values`),
  //   title: l10n.t(`Display Object Where Used`),
  //   // value: preloadvalue,
  //   value: promptedValue,
  //   placeHolder: l10n.t(`Enter LIBRARY/PROGRAM.(*|TYPE)`),
  //   validateInput: (input) => {
  //     input = input.trim();
  //     const path = input.split(`/`);
  //     if (path.length > 2) {
  //       return l10n.t(`Please enter value in form LIBRARY/PROGRAM.(*|TYPE)`);
  //     }
  //   }
  // });

  // if (input) {
  //   // ww = scrubInput(input, ww, `DSPOBJU`);
  //   let wpath = input.trim().toUpperCase().split(`/`);
  //   if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*`; }
  //   ww.path = [wpath[0], wpath[1]].join('/');
  //   ww.library = wpath[0];
  //   wpath = wpath[1].split(`.`);// split wpath[1] into obj + type
  //   ww.name = wpath[0];
  //   ww.type = wpath[1] ? wpath[1] : `*`;
  // }

  // Hawkeye-Pathfinder
  if (ww.path) {

    if (ww.name !== ` `) {

      if (!ww.searchTerm) {
        ww.searchTerm = await vscode.window.showInputBox({
          prompt: l10n.t(`Select token to search within the results from DSPOBJU`),
          value: `*NA`,
          placeHolder: l10n.t(`Enter the search for term`),
        })||'';
      }

      if (ww.searchTerm) {
        const howUsed = await vscode.window.showInputBox({
          prompt: l10n.t(`Select the HOW USED string from DSPOBJU`),
          value: `*NA`,
          placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
        });

        if (howUsed) {
          try {
            await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `Searching`,
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
              });

              // NOTE: if more messages are added, lower the timeout interval
              const timeoutInternal = 9000;
              const searchMessages = [
                l10n.t(`Using Hawkeye Pathfinder's DSPOBJU to list object used details`),
                l10n.t(`Searching in '{1}' for uses of {0}.`, ww.searchTerm, ww.path),
                l10n.t(`What's so special about '{0} in {1}' anyway?`, ww.searchTerm, ww.path),
                l10n.t(`Still getting uses for {0}...`, ww.path),
                l10n.t(`While you wait, why not make some tea?`),
                l10n.t(`Wow. This really is taking a while. Let's hope you get the result you want.`),
                l10n.t(`Why was six afraid of seven?`),
                l10n.t(`Searching in '{0}' for uses of {1}.`, ww.searchTerm, ww.path),
              ];

              let currentMessage = 0;
              const messageTimeout = setInterval(() => {
                if (currentMessage < searchMessages.length) {
                  progress.report({
                    message: searchMessages[currentMessage]
                  });
                  currentMessage++;
                } else {
                  clearInterval(messageTimeout);
                }
              }, timeoutInternal);
              // Hawkeye-Pathfinder-DSPSCNSRC
              // returns results member name with member type as extension
              let results = await HawkeyeSearch.hwkdisplayObjectUsed(ww.library, ww.name, ww.type
                , ww.searchTerm, howUsed, ww.protected);

              if (results.length > 0) {
                const objectNamesLower = true;
                // const objectNamesLower = GlobalConfiguration.get(`ObjectBrowser.showNamesInLowercase`);

                results.forEach(result => {
                  if (objectNamesLower === true) {
                    result.path = result.path.toLowerCase();
                  }
                  result.label = result.path;
                });

                results = results.sort((a, b) => {
                  return a.path.localeCompare(b.path);
                });
                return { searchTerm: ww.path, results: results };

              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/DSPOBJU {1}.`
                  , ww.searchTerm, ww.path
                ));
              }

            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error searching for file uses of: {0}`, e.message));
            }
          }
        }
      }
    }

  } else {
    //Running from command.
  }
  return {};
};
export async function runPRTRPGPRT(memberItem: MemberItem): Promise<void> {
  //Run commands, print to output, etc
  const connection = Code4i.getConnection();

  //Run SQL, upload/download stuff
  if (memberItem && !(/.*(RPG).*/gi.test(memberItem.path))) {
    vscode.window.showErrorMessage(l10n.t(`Spacing Chart-RPG Print File is only value for *RPG* programs.`));
    return;
  }
  //Prompt
  const command = await vscode.window.showInputBox({
    prompt: l10n.t("Prompt and run"),
    value: `PRTRPGPRT SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  });

  if (command) { //if prompt wasn't canceled
    const result = await connection.runCommand({ command, environment: "ile" });
    if (result.code === 0) {
      //success
      console.log(result.stdout);
      vscode.window.showInformationMessage(l10n.t("Command PRTRPGPRT successful, check your spooled files"));

    }
    else {
      //failure
      vscode.window.showErrorMessage(l10n.t("Command PRTRPGPRT failed: {0}", result.stderr)); //show the error output in error notification
    }
  }
};
export async function runPRTDDSPRT(memberItem: MemberItem): Promise<void> {
  //Run commands, print to output, etc
  const connection = Code4i.getConnection();

  //Run SQL, upload/download stuff
  if (memberItem && !(/.*(PRTF).*/gi.test(memberItem.path))) {
    vscode.window.showErrorMessage(l10n.t(`Spacing Chart-DDS Print File is only value for *PRTF* member.`));
    return;
  }
  //Prompt
  const command = await vscode.window.showInputBox({
    prompt: l10n.t("Prompt and run"),
    value: `PRTDDSPRT SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  });

  if (command) { //if prompt wasn't canceled
    const result = await connection.runCommand({ command, environment: "ile" });
    if (result.code === 0) {
      //success
      console.log(result.stdout);
      vscode.window.showInformationMessage(l10n.t("Command PRTDDSPRT successful, check your spooled files"));

    }
    else {
      //failure
      vscode.window.showErrorMessage(l10n.t("Command PRTDDSPRT failed: {0}", result.stderr)); //show the error output in error notification
    }
  }
};
export async function runPRTDDSDSP(memberItem: MemberItem): Promise<void> {
  //Run commands, print to output, etc
  const connection = Code4i.getConnection();

  //Run SQL, upload/download stuff
  if (memberItem && !(/.*(DSPF).*/gi.test(memberItem.path))) {
    vscode.window.showErrorMessage(l10n.t(`Spacing Chart-DDS Display File is only value for *DSPF* member.`));
    return;
  }
  //Prompt
  const command = await vscode.window.showInputBox({
    prompt: l10n.t("Prompt and run"),
    value: `PRTDDSDSP SRCFILE(${memberItem.member.library}/${memberItem.member.file}) SRCMBR(${memberItem.member.name}) SUMMARY(*NO) OUTPUT(*PRINT) PRTFILE(QSYSPRT)`
  });

  if (command) { //if prompt wasn't canceled
    const result = await connection.runCommand({ command, environment: "ile" });
    if (result.code === 0) {
      //success
      console.log(result.stdout);
      vscode.window.showInformationMessage(l10n.t("Command PRTDDSDSP successful, check your spooled files"));

    }
    else {
      //failure
      vscode.window.showErrorMessage(l10n.t("Command PRTDDSDSP failed: {0}", result.stderr)); //show the error output in error notification
    }
  }
};



/**
 * Use this function to alter the library reference if the source passes something like WFISRC 
 * This will be needed if the calling tool is triggered off a source file member reference.
 *  
 * @param library 
 * @param command
 * @returns the adjusted lib value
 */
function scrubLibrary(lib: string, command: string): string {
  if (/.*(SRC).*/gi.test(lib)) {
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
function setProtectMode(library: string, command: String): boolean {
  let protection: boolean = true;
  if (command === `DSPSCNSRC`) {
    if (Code4i.getConnection().currentUser === library) { protection = false; }
  }
  return protection;
}