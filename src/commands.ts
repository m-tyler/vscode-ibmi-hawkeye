import vscode, { l10n, } from 'vscode';
import { Code4i, showCustomInputs, parseCommandString, replaceCommandDefault, scrubLibrary, setProtectMode,getSourceObjectType } from "./tools";
import { HawkeyeSearch } from "./api/HawkeyeSearch";
import { getMemberCount } from "./api/IBMiTools";
import { getHawkeyeAction } from "./commandActions";
import { HawkeyeSearchMatches, QSYS_PATTERN } from './types/types';
import { getRandomLocalizedMessages, loadMessageData } from "./localizedMessages";
import { MemberItem } from '@halcyontech/vscode-ibmi-types';
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
export namespace HwkI {
  export async function searchSourceFiles(memberItem: MemberItem): Promise<HawkeyeSearchMatches[]|undefined> {
    const commandName = 'DSPSCNSRC';
    let ww = <wItem>{};
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    ww.searchTerms = [];
    if (memberItem) {
      ww.path = memberItem.path;
      ww.protected = memberItem.filter.protected;
      ww.library = memberItem.filter.library;
      ww.sourceFile = memberItem.filter.object;
      ww.name = memberItem.filter.member;
      ww.type = memberItem.filter.memberType;
    }
    // else if (item) {
    //   ww.path = Code4i.sysNameInLocal(item._path.replace(QSYS_PATTERN, ''));
    //   const parts = Code4i.parserMemberPath( item._path );
    //   ww.protected = item._readonly;
    //   ww.sourceFile = parts.file;
    //   ww.library = parts.library;
    //   ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
    //   ww.name = parts.name;
    //   ww.type = getSourceObjectType(ww.path)[0];
    // }
    else {
      ww.library = ``;
      ww.sourceFile = ``;
      ww.name = ``;
      ww.type = ``;
      ww.protected = true;
    }
    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = getHawkeyeAction(0); // DSPSCNSRC
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCLIB', ww.library);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCFILE', ww.sourceFile);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCMBR', ww.name);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCTYPE', ww.type);
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { return undefined; }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    if (!keywords) {
      vscode.window.showErrorMessage(l10n.t(`Error running ${commandName} command, no keywords.`));
      return undefined;
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
      ww.searchTerm = ww.searchTerms.join(',');
    }
    ww.library = scrubLibrary(ww.library, `${commandName}`);
    ww.protected = setProtectMode(ww.library, `${commandName}`);

    // Hawkeye-Pathfinder
    if (ww.path) {

      if (ww.sourceFile !== ` `) {
        if (!ww.searchTerm || ww.searchTerm === ` `) {

          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Use command ${commandName} to search {0}.`, ww.path),
            placeHolder: l10n.t(`Enter the search for term`),
          }) || '';
        }

        if (ww.searchTerm) {
          try {
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: l10n.t(`Searching`),
            }, async progress => {
              progress.report({
                message: l10n.t(`Fetching member count for {0}`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library, sourceFile: ww.sourceFile, members: ww.name, extensions: ww.type });
              let messageData = loadMessageData(ww, {memberCount: memberCount, commandName: commandName} );
              const searchMessages = getRandomLocalizedMessages(messageData, 8);

              if (memberCount > 0) {
                // NOTE: if more messages are added, lower the timeout interval
                const timeoutInternal = 9000;

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
                let resultsSCN = await HawkeyeSearch.searchMembers(ww.library, ww.sourceFile
                  , `${ww.name || `*`}.${ww.type || `*`}`
                  , ww.searchTerm, ww.protected);

                if (resultsSCN) {
                  searchMatch = { command: `${commandName}`, searchDescription: `${commandName} ${new Date().toLocaleString()}`,  searchItem: ww.name, searchTerm: ww.searchTerm, files: resultsSCN };
                } else {
                  vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' in HAWKEYE/${commandName} {1}.`
                    , ww.searchTerm, ww.path
                  ));
                }

              } else {
                vscode.window.showErrorMessage(l10n.t(`No members to search.`));
              }

              return searchMatch;
            });

          } catch (e: unknown) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
    }
    return [searchMatch];
  };
  export async function displayFileSetsUsed(item: any): Promise<HawkeyeSearchMatches[]|undefined> {
    const commandName = 'DSPFILSETU';
    let ww = <wItem>{};
    let wwResultSequence: string = '*PGM';
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;

    if (item && item.object) {
      ww.path = item.path;
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.type = item.object.attribute;
    }
    else if (item && item.member) {
      ww.path = item.path;
      ww.protected = item.member.protected;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.member.name;
      ww.type = item.member.extension;
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item._path.replace(QSYS_PATTERN, ''));
      const parts = Code4i.parserMemberPath( item._path );
      ww.protected = item._readonly;
      ww.sourceFile = parts.file;
      ww.library = parts.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = parts.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else {
      ww.library = ``;
      ww.name = ``;
      ww.protected = true;
    }
    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    let chosenAction = getHawkeyeAction(1); // DSPFILSET
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'FILELIB', ww.library);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'FILE', ww.name);
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { vscode.window.showErrorMessage(l10n.t(`Search canceled.`)); return undefined; }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    if (!keywords) {
      vscode.window.showErrorMessage(l10n.t(`Search canceled.`));
      return undefined;
    } else {
      ww.path = keywords.FILELIB + '/' + keywords.FILE;
      ww.library = keywords.FILELIB;
      ww.sourceFile = keywords.FILE;
      ww.name = keywords.FILE;
      ww.type = ww.type?ww.type:'PF';
      ww.searchTerm = keywords.SCAN || '';
      wwResultSequence = keywords.SEQUNCE || '*PGM';
    }

    // Hawkeye-Pathfinder
    if (ww.path) {
      if (ww.type === 'SQL' && (/.*(tb|pf|v.*)/gi.test(ww.name))
        || ww.type === 'PF' || ww.type === '*FILE') {
      } else {
        // if (ww && !(/.*(tb.*\.sql|pf.*\.pf|v.*\.sql)/.test(ww.path))) {
        vscode.window.showErrorMessage(l10n.t(`Display File Set Used is only value for database tables or views.`));
        return undefined;
      }

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search results from ${commandName}`),
            value: `*NA`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || '';
        }

        if (ww.searchTerm) {
          try {
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: l10n.t(`Searching`),
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find file sets used.`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library });
              let messageData = loadMessageData(ww, {memberCount: memberCount, commandName: commandName} );
              const searchMessages = getRandomLocalizedMessages(messageData, 8);

              // NOTE: if more messages are added, lower the timeout interval
              const timeoutInternal = 9000;

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
              let resultsFSU = await HawkeyeSearch.displayFileSetsUsed(ww.library, ww.name, ww.searchTerm, ww.protected, wwResultSequence);

              if (resultsFSU) {
                searchMatch = { command: `${commandName}`, searchDescription: `${commandName} ${new Date().toLocaleString()}`,  searchItem: ww.name, searchTerm: ww.searchTerm, files: resultsFSU };
              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                  , ww.searchTerm, ww.path
                ));
              }
              return searchMatch;
            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
      //Running from command.
    };
    return [searchMatch];
  };
  export async function displayProgramObjects(item: any): Promise<HawkeyeSearchMatches[]|undefined> {
    let commandName = 'DSPPGMOBJ';
    let ww = <wItem>{};
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;

    if (item && item.object) {
      ww.path = item.path;
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.type = item.object.type;
    }
    else if (item && item.member) {
      ww.path = item.path;
      ww.protected = item.member.protected;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.member.name;
      ww.type = item.member.extension;
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item._path.replace(QSYS_PATTERN, ''));
      const parts = Code4i.parserMemberPath( item._path );
      ww.protected = item._readonly;
      ww.sourceFile = parts.file;
      ww.library = parts.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = parts.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else {
      ww.library = ``;
      ww.name = ``;
      ww.type = ``;
      ww.protected = true;
    }

    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = getHawkeyeAction(2); // DSPPGMOBJ
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJLIB', ww.library);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJ', ww.name);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJTYPE', ww.type);
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { return undefined; }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    if (!keywords) {
      return undefined;
    } else {
      ww.path = keywords.OBJLIB + '/' + keywords.OBJ;
      ww.library = keywords.OBJLIB;
      ww.name = keywords.OBJ;
      ww.type = keywords.OBJTYPE;
      ww.searchTerm = keywords.SCAN || '';
    }

    // Hawkeye-Pathfinder
    if (ww.path) {
      if (item && ((/.*(tb|pf|v.*|cmd)/gi.test(ww.type)) || !(/(\*PGM|\*SRVPGM)/gi.test(ww.type)))) {
        vscode.window.showErrorMessage(l10n.t(`Display Program Objects is only value for *PGM or *SRVPGM types.`));
        return undefined;
      }
      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search results from ${commandName}`),
            value: `*NA`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || '';
        }

        if (ww.searchTerm) {
          try {
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `Searching`,
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library });
              let messageData = loadMessageData(ww, {memberCount: memberCount, commandName: commandName} );
              const searchMessages = getRandomLocalizedMessages(messageData, 8);
              // NOTE: if more messages are added, lower the timeout interval
              const timeoutInternal = 9000;

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
              let resultsDPO = await HawkeyeSearch.displayProgramObjects(ww.library, ww.name, ww.searchTerm, ww.protected);

              if (resultsDPO) {
                searchMatch = { command: `${commandName}`, searchDescription: `${commandName} ${new Date().toLocaleString()}`,  searchItem: ww.name, searchTerm: ww.searchTerm, files: resultsDPO };
              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                  , ww.searchTerm, ww.path
                ));
              }
              return searchMatch;
            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
      //Running from command.
    }
    return [searchMatch];
  };
  export async function displayObjectUsed(item: any): Promise<HawkeyeSearchMatches[]|undefined> {
    let commandName = 'DSPOBJU';
    let ww = <wItem>{};
    let howUsed: string = '';
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    if (item && item.object) {
      ww.path = item.path;
      ww.path = Code4i.sysNameInLocal(item.path.replace(QSYS_PATTERN, ''));
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.type = item.object.attribute;
    }
    else if (item && item.member) {
      ww.path = Code4i.sysNameInLocal(item.path.replace(QSYS_PATTERN, ''));
      ww.protected = item.member.protected;
      ww.sourceFile = item.member.file;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = item.member.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item._path.replace(QSYS_PATTERN, ''));
      const parts = Code4i.parserMemberPath( item._path );
      ww.protected = item._readonly;
      ww.sourceFile = parts.file;
      ww.library = parts.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = parts.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else {
      ww.library = ``;
      ww.name = ``;
      ww.type = ``;
      ww.protected = true;
    }

    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = getHawkeyeAction(3); // DSPOBJU
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJLIB', ww.library);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJ', ww.name);
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJTYPE', ww.type);
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { 
      vscode.window.showInformationMessage(l10n.t(`Command HAWKEYE/${commandName}, canceled.` ));
      return undefined; 
    }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    if (!keywords) {
      return undefined;
    } else {
      ww.path = keywords.OBJLIB + '/' + keywords.OBJ +'.'+keywords.OBJTYPE;
      ww.library = keywords.OBJLIB;
      ww.name = keywords.OBJ;
      ww.type = keywords.OBJTYPE;
      ww.searchTerm = keywords.SCAN || '';
      howUsed = keywords.HOWUSED || '';
    }

    // Hawkeye-Pathfinder
    if (ww.path) {

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search within the results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || '';
        }

        if (ww.searchTerm) {
          if (!howUsed) {
            howUsed = await vscode.window.showInputBox({
              prompt: l10n.t(`Select the HOW USED string from ${commandName}`),
              value: `*ALL`,
              placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
            }) || '';
          }

          if (howUsed) {
            try {
              searchMatch = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Searching`,
              }, async progress => {
                progress.report({
                  message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
                });
                const memberCount = await getMemberCount({ library: ww.library });
                let messageData = loadMessageData(ww, {commandName: commandName, memberCount: memberCount} );
                const searchMessages = getRandomLocalizedMessages(messageData, 8);

                // NOTE: if more messages are added, lower the timeout interval
                const timeoutInternal = 9000;

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
                // try { } catch(err) {}
                let resultsDOU = await HawkeyeSearch.displayObjectUsed(ww.library, ww.name, ww.type
                  , ww.searchTerm, howUsed, ww.protected);

                if (resultsDOU && resultsDOU.length > 0) {
                  searchMatch = { command: `${commandName}`, searchDescription: `${commandName} ${new Date().toLocaleString()}`, searchItem: ww.name, searchTerm: ww.searchTerm, files: resultsDOU };
                } else {
                  vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                    , ww.searchTerm, ww.path
                  ));
                }
                return searchMatch;
              });
              
            } catch (e) {
              if (e instanceof Error) {
                vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
                return undefined;
              }
            }
          }
        }
      }

    } else {
      //Running from command.
    }
    return [searchMatch];
  };
  export async function displayProcedureUsed(item: any): Promise<HawkeyeSearchMatches[]|undefined> {
    let commandName = 'DSPPRCU';
    let ww = <wItem>{};
    let howUsed: string = '';
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    if (item && item.object) {
      ww.path = item.path;
      ww.path = Code4i.sysNameInLocal(item.path.replace(QSYS_PATTERN, ''));
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.type = item.object.attribute;
    }
    else if (item && item.member) {
      ww.path = Code4i.sysNameInLocal(item.path.replace(QSYS_PATTERN, ''));
      ww.protected = item.member.protected;
      ww.sourceFile = item.member.file;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = item.member.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item._path.replace(QSYS_PATTERN, ''));
      const parts = Code4i.parserMemberPath( item._path );
      ww.protected = item._readonly;
      ww.sourceFile = parts.file;
      ww.library = parts.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = parts.name;
      ww.type = getSourceObjectType(ww.path)[0];
    }
    else {
      ww.library = Code4i.getConnection().currentUser;
      ww.name = ``;
      ww.type = ``;
      ww.protected = true;
    }

    // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
    let command: string = '';
    const chosenAction = getHawkeyeAction(4); // DSPPRCU
    chosenAction.command = replaceCommandDefault(chosenAction.command, 'PRC', ww.name);
    command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
    if (!command) { 
      vscode.window.showInformationMessage(l10n.t(`Command HAWKEYE/${commandName}, canceled.` ));
      return undefined; 
    }

    // Parse user input into values to pass on to secondary tools. 
    let keywords = parseCommandString(command);
    if (!keywords) {
      return undefined;
    } else {
      // ww.path = keywords.OBJLIB + '/' + keywords.OBJ +'.'+keywords.OBJTYPE;
      ww.path = keywords.PRC;
      // ww.library = keywords.OBJLIB;
      ww.name = keywords.PRC;
      // ww.type = keywords.OBJTYPE;
      ww.searchTerm = keywords.SCAN || '';
      // howUsed = keywords.HOWUSED || '';
    }

    // Hawkeye-Pathfinder
    if (ww.path) {

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search within the results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || '';
        }

        if (ww.searchTerm) {
          // if (!howUsed) {
          //   howUsed = await vscode.window.showInputBox({
          //     prompt: l10n.t(`Select the HOW USED string from ${commandName}`),
          //     value: `*ALL`,
          //     placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
          //   }) || '';
          // }

          // if (howUsed) {
            try {
              searchMatch = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Searching`,
              }, async progress => {
                progress.report({
                  message: l10n.t(`Starting process to find where ${0} is used.`, ww.name)
                });
                // const memberCount = await getMemberCount({ library: ww.library });
                const memberCount = 0;
                let messageData = loadMessageData(ww, {commandName: commandName, memberCount: memberCount} );
                const searchMessages = getRandomLocalizedMessages(messageData, 8);

                // NOTE: if more messages are added, lower the timeout interval
                const timeoutInternal = 9000;

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
                // try { } catch(err) {}
                let resultsDOU = await HawkeyeSearch.hwkdisplayProcedureUsed(ww.library, ww.name
                  , ww.searchTerm, howUsed, ww.protected);

                if (resultsDOU && resultsDOU.length > 0) {
                  searchMatch = { command: `${commandName}`, searchDescription: `${commandName} ${new Date().toLocaleString()}`, searchItem: ww.name, searchTerm: ww.searchTerm, files: resultsDOU };
                } else {
                  vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                    , ww.searchTerm, ww.path
                  ));
                }
                return searchMatch;
              });
              
            } catch (e) {
              if (e instanceof Error) {
                vscode.window.showErrorMessage(l10n.t(`Error: {0}`, e.message));
                return undefined;
              }
            }
          // }
        }
      }

    } else {
      //Running from command.
    }
    return [searchMatch];
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
        vscode.window.showInformationMessage(l10n.t("Command PRTDDSDSP successful, check your spooled files"));
      }
      else {
        //failure
        vscode.window.showErrorMessage(l10n.t("Command PRTDDSDSP failed: {0}", result.stderr)); //show the error output in error notification
      }
    }
  };
};


