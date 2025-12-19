import vscode, { l10n, } from 'vscode';
import { Code4i, showCustomInputs, parseCommandString, replaceCommandDefault, scrubLibrary, setProtectMode, getSourceObjectType } from "./tools/tools";
import { HawkeyeSearch } from "./api/HawkeyeSearch";
import { getMemberCount } from "./api/IBMiTools";
import { getHawkeyeAction } from "./tools/commandActions";
import { HawkeyeSearchMatches, QSYS_PATTERN } from './types/types';
import { setProgressWindowLocalizedMessages, loadMessageData } from "./tools/localizedMessages";
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
  sourceType: string,
  objType: string,
  searchTerm: string,
  searchTerms: string[]
};
export namespace HwkI {
  export async function searchSourceFiles(memberItem: MemberItem): Promise<HawkeyeSearchMatches | undefined> {
    const commandName = 'DSPSCNSRC';
    let ww = <wItem>{};
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let promptedValue = ``;
    ww.searchTerms = [];
    if (memberItem) {
      ww.path = memberItem.path;
      ww.protected = memberItem.filter.protected;
      ww.library = memberItem.filter.library;
      ww.sourceFile = memberItem.filter.object;
      ww.name = memberItem.filter.member;
      ww.sourceType = memberItem.filter.memberType;
      promptedValue = `${ww.library}/${ww.sourceFile}/${ww.name}.${ww.sourceType}`;
    }
    else {
      ww.library = ``;
      ww.sourceFile = ``;
      ww.name = ``;
      ww.objType = ``;
      ww.sourceType = ``;
      ww.protected = true;
    }
    let keywords: Record<string, string>;
    const config = vscode.workspace.getConfiguration('vscode-ibmi-hawkeye');
    // let namePattern: string = config.get<string>('useActions') || '';
    if (config.useActions) {
      // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
      let command: string = '';
      const chosenAction = getHawkeyeAction(0); // DSPSCNSRC
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCLIB', ww.library);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCFILE', ww.sourceFile);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCMBR', ww.name);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'SRCTYPE', ww.sourceType);
      command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
      if (!command) { return undefined; }

      // Parse user input into values to pass on to secondary tools. 
      keywords = parseCommandString(command);
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
        ww.sourceType = mbrtype;

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
    } else {
      let input = await vscode.window.showInputBox({
        prompt: l10n.t(`See the help for DSPSCNSRC for selectable input values`),
        title: l10n.t(`Search source file using DSPSCNSRC`),
        value: promptedValue,
        placeHolder: l10n.t(`Enter file path (format: LIB/SRCFILE/NAME.ext`),
        validateInput: (input) => {
          input = input.trim();
          const path = input.split(`/`);
          let checkPath;
          if (path.length > 3) {
            return l10n.t(`Please enter value in form LIBRARY/FILE/NAME.ext`);
          } else if (path.length > 2) {                 // Check member
            let checkMember = path[2].replace(/[*]/g, ``).split(`.`);
            checkMember[0] = checkMember[0] !== `` ? checkMember[0] : `a`;
            checkPath = path[0] + `/` + path[1] + `/` + checkMember[0] + `.` + (checkMember.length > 1 ? checkMember[1] : ``);
          } else if (path.length > 1) {                 // Check filePath
            checkPath = input + (path[path.length - 1] === `` ? `a` : ``) + `/a.b`;
          } else {                                      // Check library
            checkPath = input + (path[path.length - 1] === `` ? `a` : ``) + `/a/a.a`;
          }
        }
      });

      if (!input) { return undefined; } else {
        // split LIB/SRCF/MBR.ext into LIB,SRCF, MBR.ext
        // assumption
        const wpath = input.trim().toUpperCase().split(`/`);
        let wmember: string[] = [];
        // LIB/SRCF no member or ext
        if (wpath.length < 3 || wpath[2] === ``) {
          wmember = [`*ALL`, `*ALL`];
        }
        // LIB/SRCF/MBR no ext
        else if (!wpath[2].includes(`.`)) {
          wmember = [wpath[2], ``];
        } else {
          wmember = wpath[2].split(`.`);
        }
        if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = `Q*`; }
        ww.path = [[wpath[0], wpath[1], wmember[0]].join(`/`), wmember[1]].join('.');
        ww.library = wpath[0];
        ww.sourceFile = wpath[1];
        ww.name = wmember[0] || '*ALL';
        ww.sourceType = wmember[1] || '*ALL';
        // connection.currentUser
      }
      keywords = {};
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
          }) || 'searchCanceled';
        }

        if (ww.searchTerm === 'searchCanceled') { } else {
          try {
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: l10n.t(`Searching`),
            }, async progress => {
              progress.report({
                message: l10n.t(`Fetching member count for {0}`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library, sourceFile: ww.sourceFile, members: ww.name, extensions: ww.sourceType });
              let messageData = loadMessageData(ww, { memberCount: memberCount, commandName: commandName });
              const searchMessages = setProgressWindowLocalizedMessages(messageData, 8);

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
                  , `${ww.name || `*`}.${ww.sourceType || `*`}`
                  , ww.searchTerm, ww.protected);

                if (resultsSCN) {
                  searchMatch = {
                    command: `${commandName}`
                    , searchDescription: `${commandName} ${new Date().toLocaleString()}`
                    , searchItem: ww.searchTerm
                    , searchTerm: ww.searchTerm
                    , files: resultsSCN
                  };
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
              vscode.window.showErrorMessage(l10n.t(`Error(1): {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
    }
    return searchMatch.command ? searchMatch : undefined;
  };
  export async function displayFileSetsUsed(item: any): Promise<HawkeyeSearchMatches | undefined> {
    const commandName = 'DSPFILSETU';
    let ww = <wItem>{};
    let wwResultSequence: string = '*PGM';
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let promptedValue;

    if (item && item.object) {
      ww.path = item.path;
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.objType = item.object.attribute;
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else if (item && item.member) {
      ww.path = item.path;
      ww.protected = item.member.protected;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.member.name;
      ww.sourceType = item.member.extension;
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item.path);
      const upperCasedString = Code4i.upperCaseName(ww.path);
      const parts = upperCasedString.startsWith(`/`) ? upperCasedString.substring(1).split(`/`) : upperCasedString.split(`/`);;
      ww.protected = item._readonly;
      ww.library = parts[0];
      if (parts.length > 2){
        ww.sourceFile = parts[1];
        ww.name = parts[2];
      }
      else {
        ww.sourceFile = ``;
        ww.name = parts[1];
      }
      ww.protected = item._readonly;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else {
      ww.library = ``;
      ww.name = ``;
      ww.protected = true;
    }
    const config = vscode.workspace.getConfiguration('vscode-ibmi-hawkeye');
    // let namePattern: string = config.get<string>('useActions') || '';
    if (config.useActions) {

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
        ww.sourceType = ww.sourceType ? ww.sourceType : 'PF';
        ww.objType = ww.objType ? ww.objType : '*FILE';
        ww.searchTerm = keywords.SCAN || '';
        wwResultSequence = keywords.SEQUNCE || '*PGM';
      }

    } else {
      const input = await vscode.window.showInputBox({
        prompt: l10n.t(`See the help for DSPFILSETU for selectable input values`),
        title: l10n.t(`Display File Set Where Used`),
        value: promptedValue,
        placeHolder: l10n.t(`Enter LIBRARY/FILE to search for references.`),
        validateInput: (input) => {
          input = input.trim();
          const path = input.split(`/`);
          let checkPath;
          if (path.length > 2) {
            return l10n.t(`Please enter value in form LIBRARY/FILE`);
          }
        }
      });

      if (!input) { return undefined; } else {
        const wpath = input.trim().toUpperCase().split(/[/.]/);
        if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*DOCLIBL`; }
        ww.path = [wpath[0], wpath[1]].join('/');
        ww.library = wpath[0];
        ww.name = wpath[1];
        if (wpath[2]) {
          ww.sourceType = wpath[2] ? wpath[2] : 'PF';
        } else {
          ww.sourceType = 'PF';
        }
        ww.path += '.' + ww.sourceType;
      }
    }

    // Hawkeye-Pathfinder
    if (ww.path) {
      if (ww.sourceType === 'SQL' && (/.*(tb|pf|v.*)/gi.test(ww.name))
        || ww.sourceType === 'PF' || ww.objType === '*FILE') {
      } else {
        // if (ww && !(/.*(tb.*\.sql|pf.*\.pf|v.*\.sql)/.test(ww.path))) {
        vscode.window.showErrorMessage(l10n.t(`Display File Set Used is only value for database tables or views.`));
        return undefined;
      }

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || 'searchCanceled';
        }

        if (ww.searchTerm === 'searchCanceled') { } else {
          try {
            ww.searchTerm = ww.searchTerm !== '*NONE' ? ww.searchTerm : '';
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: l10n.t(`Searching`),
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find file sets used.`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library });
              let messageData = loadMessageData(ww, { memberCount: memberCount, commandName: commandName });
              const searchMessages = setProgressWindowLocalizedMessages(messageData, 8);

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
              let resultsFSU = await HawkeyeSearch.displayFileSetsUsed(ww.library.toLocaleUpperCase(), ww.name.toLocaleUpperCase(), ww.searchTerm, ww.protected, wwResultSequence);

              if (resultsFSU) {
                searchMatch = {
                  command: `${commandName}`
                  , searchDescription: `${commandName} ${new Date().toLocaleString()}`
                  , searchItem: ww.name.toLocaleUpperCase()
                  , searchTerm: ww.searchTerm
                  , files: resultsFSU
                };
              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                  , ww.searchTerm, ww.path
                ));
              }
              return searchMatch;
            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error(2): {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
      //Running from command.
    };
    return searchMatch.command ? searchMatch : undefined;
  };
  export async function displayProgramObjects(item: any): Promise<HawkeyeSearchMatches | undefined> {
    let commandName = 'DSPPGMOBJ';
    let ww = <wItem>{};
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let promptedValue;

    if (item && item.object) {
      ww.path = item.path;
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.objType = item.object.type;
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else if (item && item.member) {
      ww.path = item.path;
      ww.protected = item.member.protected;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.member.name;
      ww.sourceType = item.member.extension;
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.sourceType}`;
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item.path);
      const upperCasedString = Code4i.upperCaseName(ww.path);
      const parts = upperCasedString.startsWith(`/`) ? upperCasedString.substring(1).split(`/`) : upperCasedString.split(`/`);;
      ww.protected = item._readonly;
      ww.library = parts[0];
      if (parts.length > 2){
        ww.sourceFile = parts[1];
        ww.name = parts[2];
      }
      else {
        ww.sourceFile = ``;
        ww.name = parts[1];
      }
      ww.protected = item._readonly;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.objType = getSourceObjectType(ww.path, commandName)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.sourceType}`;
    }
    else {
      ww.library = ``;
      ww.name = ``;
      ww.sourceType = ``;
      ww.objType = ``;
      ww.protected = true;
    }
    const config = vscode.workspace.getConfiguration('vscode-ibmi-hawkeye');
    // let namePattern: string = config.get<string>('useActions') || '';
    if (config.useActions) {
      // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
      let command: string = '';
      const chosenAction = getHawkeyeAction(2); // DSPPGMOBJ
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJLIB', ww.library);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJ', ww.name);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJTYPE', ww.objType);
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
        ww.objType = keywords.OBJTYPE;
        ww.searchTerm = keywords.SCAN || '';
      }
    } else {
      const input = await vscode.window.showInputBox({
        prompt: l10n.t(`See the help for DSPPGMOBJ for selectable input value`),
        title: l10n.t(`Display Program Objects`),
        value: promptedValue,
        placeHolder: l10n.t(`Enter LIBRARY/PROGRAM to list objects used by program.`),
        validateInput: (input) => {
          input = input.trim();
          const path = input.split(`/`);
          if (path.length > 2) {
            return l10n.t(`Please enter value in form LIBRARY/PROGRAM.`);
          }
        }
      });

      if (!input) { return undefined; } else {
        const wpath = input.trim().toUpperCase().split(/[./]/);
        if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*ALL`; }
        ww.path = [wpath[0], wpath[1]].join('/');
        ww.library = wpath[0];
        ww.name = wpath[1];
        ww.objType = wpath[2] || `*PGM`;
      }
    }

    // Hawkeye-Pathfinder
    if (ww.path) {
      if (item && !(/(\*PGM|\*SRVPGM|\*MENU|\*MODULE|\*QRYDFN|\*CMD|\*JOBD|\*SBSD|\*USRPRF|\*EXT|\*EXTSQL)/gi.test(ww.objType))) {
        vscode.window.showErrorMessage(l10n.t(`Display Program Objects is only value for *PGM or *SRVPGM types.`));
        return undefined;
      }
      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter an additional search term`),
          }) || 'searchCanceled';
        }

        if (ww.searchTerm === 'searchCanceled') { return undefined; } else {
          try {
            ww.searchTerm = ww.searchTerm !== '*NONE' ? ww.searchTerm : '';
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `Searching`,
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
              });
              const memberCount = await getMemberCount({ library: ww.library });
              let messageData = loadMessageData(ww, { memberCount: memberCount, commandName: commandName });
              const searchMessages = setProgressWindowLocalizedMessages(messageData, 8);
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
              let resultsDPO = await HawkeyeSearch.displayProgramObjects(ww.library.toLocaleUpperCase(), ww.name.toLocaleUpperCase(), ww.objType, ww.searchTerm, ww.protected);

              if (resultsDPO) {
                searchMatch = {
                  command: `${commandName}`
                  , searchDescription: `${commandName} ${new Date().toLocaleString()}`
                  , searchItem: ww.name.toLocaleUpperCase()
                  , searchTerm: ww.searchTerm
                  , files: resultsDPO
                };
              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                  , ww.searchTerm, ww.path
                ));
              }
              return searchMatch;
            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error(3): {0}`, e.message));
              return undefined;
            }
          }
        }
      }

    } else {
      //Running from command.
    }
    return searchMatch.command ? searchMatch : undefined;
  };
  export async function displayObjectUsed(item: any): Promise<HawkeyeSearchMatches | undefined> {
    let commandName = 'DSPOBJU';
    let ww = <wItem>{};
    let howUsed: string = '';
    // let searchMatch: HawkeyeSearchMatches;
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let promptedValue;
    if (item && item.object) {
      // Selection from object browser non-source objects
      ww.path = item.path;
      ww.path = Code4i.sysNameInLocal(item.path);
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.objType = item.object.type;
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else if (item && item.member) {
      // Selection from object browser source member
      ww.path = Code4i.sysNameInLocal(item.path);
      ww.protected = item.member.protected;
      ww.sourceFile = item.member.file;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = item.member.name;
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else if (item) {
      // Can be from the search results list
      ww.path = Code4i.sysNameInLocal(item.path);
      const upperCasedString = Code4i.upperCaseName(ww.path);
      const parts = upperCasedString.startsWith(`/`) ? upperCasedString.substring(1).split(`/`) : upperCasedString.split(`/`);
      ww.protected = item.readonly;
      ww.library = parts[0];
      if (parts.length > 2){
        ww.sourceFile = parts[1];
        ww.name = parts[2];
      }
      else {
        ww.sourceFile = ``;
        ww.name = parts[1];
      }
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}.${ww.objType}`;
    }
    else {
      // from the command button or command pallete
      ww.library = ``;
      ww.name = ``;
      ww.objType = ``;
      ww.protected = true;
    }

    const config = vscode.workspace.getConfiguration('vscode-ibmi-hawkeye');
    // let namePattern: string = config.get<string>('useActions') || '';
    if (config. useActions) {
      // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
      let command: string = '';
      const chosenAction = getHawkeyeAction(3); // DSPOBJU
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJLIB', ww.library);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJ', ww.name);
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'OBJTYPE', ww.objType);
      command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
      if (!command) {
        vscode.window.showInformationMessage(l10n.t(`Command HAWKEYE/${commandName}, canceled.`));
        return undefined;
      }

      // Parse user input into values to pass on to secondary tools. 
      let keywords = parseCommandString(command);
      if (!keywords) {
        return undefined;
      } else {
        ww.path = keywords.OBJLIB + '/' + keywords.OBJ + '.' + keywords.OBJTYPE;
        ww.library = keywords.OBJLIB;
        ww.name = keywords.OBJ;
        ww.objType = keywords.OBJTYPE;
        ww.searchTerm = keywords.SCAN || '';
        howUsed = keywords.HOWUSED || '';
      }
    } else {
      const input = await vscode.window.showInputBox({
        prompt: l10n.t(`Find where object is used by. See the help for DSPOBJU for selectable input values`),
        title: l10n.t(`Display Object Where Used`),
        // value: preloadvalue,
        value: promptedValue,
        placeHolder: l10n.t(`Enter LIBRARY/PROGRAM.(*|TYPE)`),
        validateInput: (input) => {
          input = input.trim();
          const path = input.split(`/`);
          if (path.length > 2) {
            return l10n.t(`Please enter value in form LIBRARY/PROGRAM.(*|TYPE)`);
          }
        }
      });

      if (!input) { return undefined; } else {
        // ww = scrubInput(input, ww, `DSPOBJU`);
        let wpath = input.trim().toUpperCase().split(`/`);
        if (wpath.length === 1 || wpath[1] === ``) { wpath[1] = wpath[0]; wpath[0] = `*ALL`; }
        ww.path = [wpath[0], wpath[1]].join('/');
        ww.library = wpath[0];
        wpath = wpath[1].split(`.`);// split wpath[1] into obj + type
        ww.name = wpath[0];
        ww.objType = wpath[1] ? wpath[1] : `*ALL`;
      }
    }

    // Hawkeye-Pathfinder
    if (ww.path) {

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search within the results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter a specific term to search results for or press Enter to skip`),
          }) || 'searchCanceled';
        }

        if (ww.searchTerm === 'searchCanceled') { } else {
          if (!howUsed) {
            howUsed = await vscode.window.showInputBox({
              prompt: l10n.t(`Select the HOW USED string from ${commandName}`),
              value: `*ALL`,
              placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
            }) || 'searchCanceled';
          }

          if (howUsed === 'searchCanceled') { } else {
            try {
              ww.searchTerm = ww.searchTerm !== '*NONE' ? ww.searchTerm : '';
              searchMatch = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Searching`,
              }, async progress => {
                progress.report({
                  message: l10n.t(`Starting process to find program objects used by {0}.`, ww.path)
                });
                const memberCount = await getMemberCount({ library: ww.library });
                let messageData = loadMessageData(ww, { commandName: commandName, memberCount: memberCount });
                const searchMessages = setProgressWindowLocalizedMessages(messageData, 8);

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
                let resultsDOU = await HawkeyeSearch.displayObjectUsed(ww.library.toLocaleUpperCase(), ww.name.toLocaleUpperCase(), ww.objType
                  , ww.searchTerm, howUsed, ww.protected);

                if (resultsDOU && resultsDOU.length > 0) {
                  searchMatch = {
                    command: `${commandName}`
                    , searchDescription: `${commandName} ${new Date().toLocaleString()}`
                    , searchItem: ww.name.toLocaleUpperCase()
                    , searchTerm: ww.searchTerm
                    , files: resultsDOU
                  };
                } else {
                  vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                    , ww.searchTerm, ww.path
                  ));
                }
                return searchMatch;
              });

            } catch (e) {
              if (e instanceof Error) {
                vscode.window.showErrorMessage(l10n.t(`Error(4): {0}`, e.message));
                return undefined;
              }
            }
          }
        }
      }

    } else {
      //Running from command.
    }
    return searchMatch.command ? searchMatch : undefined;
  };
  export async function displayProcedureUsed(item: any): Promise<HawkeyeSearchMatches | undefined> {
    let commandName = 'DSPPRCU';
    let ww = <wItem>{};
    let howUsed: string = '';
    let searchMatch: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let promptedValue;
    if (item && item.object) {
      ww.path = item.path;
      ww.path = Code4i.sysNameInLocal(item.path);
      ww.protected = item.filter.protected;
      ww.library = item.object.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`);
      ww.name = item.object.name;
      ww.objType = item.object.attribute;
      promptedValue = `${ww.library}/${ww.name}`;
    }
    else if (item && item.member) {
      ww.path = Code4i.sysNameInLocal(item.path);
      ww.protected = item.member.protected;
      ww.sourceFile = item.member.file;
      ww.library = item.member.library;
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.name = item.member.name;
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}`;
    }
    else if (item) {
      ww.path = Code4i.sysNameInLocal(item.path);
      const upperCasedString = Code4i.upperCaseName(ww.path);
      const parts = upperCasedString.startsWith(`/`) ? upperCasedString.substring(1).split(`/`) : upperCasedString.split(`/`);;
      ww.protected = item._readonly;
      ww.library = parts[0];
      if (parts.length > 2){
        ww.sourceFile = parts[1];
        ww.name = parts[2];
      }
      else {
        ww.sourceFile = ``;
        ww.name = parts[1];
      }
      ww.library = scrubLibrary(ww.library, `${commandName}`, (ww.sourceFile >= ''));
      ww.objType = getSourceObjectType(ww.path)[0];
      promptedValue = `${ww.library}/${ww.name}`;
    }
    else {
      ww.library = Code4i.getConnection().currentUser;
      ww.name = ``;
      ww.objType = ``;
      ww.protected = true;
    }

    const config = vscode.workspace.getConfiguration('vscode-ibmi-hawkeye');
    // let namePattern: string = config.get<string>('useActions') || '';
    if (config.useActions) {
      // Prompt for process inputs.  Prompted command will not run, it is just for user data collection.
      let command: string = '';
      const chosenAction = getHawkeyeAction(4); // DSPPRCU
      chosenAction.command = replaceCommandDefault(chosenAction.command, 'PRC', ww.name);
      command = await showCustomInputs(`Run Command`, chosenAction.command, chosenAction.name || `Command`);
      if (!command) {
        vscode.window.showInformationMessage(l10n.t(`Command HAWKEYE/${commandName}, canceled.`));
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
        // ww.objType = keywords.OBJTYPE;
        ww.searchTerm = keywords.SCAN || '';
        // howUsed = keywords.HOWUSED || '';
      }
    } else {
      const input = await vscode.window.showInputBox({
        prompt: l10n.t(`Find where procedure is used by. See the help for DSPPRCU for selectable input values`),
        title: l10n.t(`Display Procedure Where Used`),
        // value: preloadvalue,
        value: promptedValue,
        placeHolder: l10n.t(`Enter **ProcedureName** or **PROCEDURENAME**`),
        validateInput: (input) => {
          input = input.trim();
          const path = input.split('/\/./');
          if (path.length > 1) {
            return l10n.t(`Please enter value in any case without object qualifiers. `);
          }
        }
      });

      if (!input) { return undefined; } else {
        ww.path = input.trim().toUpperCase();
        ww.name = ww.path;
        ww.searchTerm = '';
      }
    }

    // Hawkeye-Pathfinder
    if (ww.path) {

      if (ww.name !== ` `) {

        if (!ww.searchTerm) {
          ww.searchTerm = await vscode.window.showInputBox({
            prompt: l10n.t(`Select token to search within the results from ${commandName}`),
            value: `*NONE`,
            placeHolder: l10n.t(`Enter the search for term`),
          }) || 'searchCanceled';
        }

        if (ww.searchTerm === 'searchCanceled') { } else {
          // if (!howUsed) {
          //   howUsed = await vscode.window.showInputBox({
          //     prompt: l10n.t(`Select the HOW USED string from ${commandName}`),
          //     value: `*ALL`,
          //     placeHolder: l10n.t(`Enter the how used value. See Hawkeye product for values.`),
          //   }) || '';
          // }

          // if (howUsed) {
          try {
            ww.searchTerm = ww.searchTerm !== '*NONE' ? ww.searchTerm : '';
            searchMatch = await vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `Searching`,
            }, async progress => {
              progress.report({
                message: l10n.t(`Starting process to find where ${0} is used.`, ww.name)
              });
              // const memberCount = await getMemberCount({ library: ww.library });
              const memberCount = 0;
              let messageData = loadMessageData(ww, { commandName: commandName, memberCount: memberCount });
              const searchMessages = setProgressWindowLocalizedMessages(messageData, 8);

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
              let resultsDOU = await HawkeyeSearch.displayProcedureUsed(ww.library.toLocaleUpperCase(), ww.name.toLocaleUpperCase(), ww.searchTerm, ww.protected);

              if (resultsDOU && resultsDOU.length > 0) {
                searchMatch = {
                  command: `${commandName}`
                  , searchDescription: `${commandName} ${new Date().toLocaleString()}`
                  , searchItem: ww.name.toLocaleUpperCase()
                  , searchTerm: ww.searchTerm
                  , files: resultsDOU
                };
              } else {
                vscode.window.showInformationMessage(l10n.t(`No results found searching for '{0}' using HAWKEYE/${commandName} {1}.`
                  , ww.searchTerm, ww.path
                ));
              }
              return searchMatch;
            });

          } catch (e) {
            if (e instanceof Error) {
              vscode.window.showErrorMessage(l10n.t(`Error(5): {0}`, e.message));
              return undefined;
            }
          }
          // }
        }
      }

    } else {
      //Running from command.
    }
    return searchMatch.command ? searchMatch : undefined;
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