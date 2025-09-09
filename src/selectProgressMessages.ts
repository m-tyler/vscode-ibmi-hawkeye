import vscode, { l10n, } from 'vscode';
export interface MessageParams {
  path?: string,
  protected?: boolean,
  library?: string,
  name?: string,
  sourceFile?: string,
  type?: string,
  searchTerm?: string,
  searchTerms?: string[],
  memberCount?: string,
  commandName?: string,
  commandText?: string
};

// Define the interface for a single message object
interface TranslationMessage {
  key: string;
  params?: MessageParams;
}
function returnProgressMessages(commandName: string, maxMessages: number, ww: MessageParams): TranslationMessage[] {

  const theMessages = [
    { key: `'{searchTerm}' in {path}.`, params: { searchTerm: ww.searchTerm, path: ww.path } },
    { key: `How does one end up with {memberCount} members?`, params: { memberCount: ww.memberCount } },
    { key: `Searching in '{path}' for uses of {searchTerm}.`, params: { searchTerm: ww.searchTerm, path: ww.path } },
    { key: `Still getting uses for {path}...`, params: { path: ww.path } },
    { key: `Still searching '{searchTerm}' in {path}...`, params: { searchTerm: ww.searchTerm, path: ww.path } },
    { key: `This is taking a while because there are {memberCount} members. Searching '{searchTerm}' in {path} still.`, params: { memberCount: ww.memberCount, searchTerm: ww.searchTerm, path: ww.path } },
    { key: `Using Hawkeye Pathfinder's {commandName} - {commandText}`, params: { commandName: ww.commandName, commandText: ww.commandText }, },
    { key: `What's so special about '{searchTerm} in {path}' anyway?`, params: { searchTerm: ww.searchTerm, path: ww.path } },
    { key: `What's so special about '{searchTerm}' anyway?`, params: { searchTerm: ww.searchTerm } },
    { key: `While you wait, why not get a snack?`, },
    { key: `While you wait, why not stretch your legs?`, },
    { key: `While you wait, your getting sleepy...`, },
    { key: `Why was six afraid of seven?`, },
    { key: `Wow. This really is taking a while. Let's hope you get the result you want.`, },
  ];
  const progressMessages = <TranslationMessage[]>getRandomElements(theMessages, maxMessages);
  progressMessages.forEach(progressMessage => {
    let translatedMessage;
    // Use optional chaining for type safety with optional params
    if (progressMessage.params) {
      translatedMessage = l10n.t(
        progressMessage.key,
        progressMessage.params as Record<string, string>
      );
    } else {
      translatedMessage = l10n.t(
        progressMessage.key
      );
    }
    console.log(translatedMessage);
    progressMessage.key = translatedMessage;
  });
  return progressMessages;
}
function getRandomElements<T>(arr: T[], count: number): T[] {
  // Create a shallow copy of the array to avoid modifying the original
  const shuffledArray = [...arr];

  // Fisher-Yates (Knuth) shuffle algorithm
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  // Return the first 'count' elements
  return shuffledArray.slice(0, count);
}

// Create a mock l10n.t function for demonstration
const l10nn = {
  t: (key: string, params?: Record<string, string>): string => {
    let translatedString = key;
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        // Simple string replacement based on your format, e.g., {0}, {1}
        translatedString = translatedString.replace(`{${param}}`, value);
      }
    }
    return translatedString;
  }
};

export function initializeProgressMessageDemo(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`Hawkeye-Pathfinder.demoProgressMessages`, async () => {
      try {
        const ww = {
          path: '/wiasp/wfisrc/qclsrc',
          protected: true,
          library: 'WFISRC',
          name: 'ABL',
          sourceFile: 'QCLSRC',
          type: 'TXT',
          searchTerm: 'CPF2103',
          searchTerms: ['ABL', 'XYZ'],
          memberCount: `3397`,
          commandName: 'DSPOBJU',
          commandText: 'Display Object Used'
        } as MessageParams;
        const progressMessages = returnProgressMessages('DSPOBJU', 8, ww);
        const theString = progressMessages.map(progressMessage => progressMessage.key).join(' \n ');
        const message = `List of progress messages choosen \n ${theString}?`;
        const detail = undefined;
        let result = await vscode.window.showWarningMessage(message, { modal: true, detail }, l10n.t(`Yes`), l10n.t(`Cancel`));

      } catch (e: unknown) {
        if (e instanceof Error) {
          vscode.window.showErrorMessage(l10n.t(`Error searching source members: {0}`, e.message));
        }
      }
    })
  );
}