import vscode, { l10n, } from 'vscode';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface messageParms {
  path: string,
  protected: boolean,
  library: string,
  name: string,
  sourceFile: string,
  type: string,
  searchTerm: string,
  searchTerms: string[],
  memberCount: number,
  commandName: string,
  commandText: string
};
enum CommandText {
  dspobju = "to list object used details",
  dspfilsetu = "to search for file sets used",
  dsppgmobj = "to list program objects used",
  dspscnsrc = "to search source members"
}
const returnMessages = [
  `'{0}' in {1}.`,
  `How does one end up with {0} members?`,
  `Searching in '{1}' for uses of {0}.`,
  `Still getting uses for {0}...`,
  `Still searching '{0}' in {1}...`,
  `This is taking a while because there are {0} members. Searching '{1}' in {2} still.`,
  `Using Hawkeye Pathfinder's {0} {1}`,
  `What's so special about '{0} in {1}' anyway?`,
  `While you wait, why not get a snack?`,
  `While you wait, why not stretch your legs?`,
  `While you wait, your getting sleepy...`,
  `Why was six afraid of seven?`,
  `Wow. This really is taking a while. Let's hope you get the result you want.`,
];
export function returnProgressMessages(
  commandName: string,
  messages: string[],
  params: { [key: string]: any },
  maxMessages: number,
  ww: messageParms): string[] {
  if (messages.length === 0) {
    return []; // Return an empty array if no messages are provided
  }
  const commandText_: String = ``;
  const returnMessages = [
    `'{0}' in {1}.`, ww.searchTerm, ww.path,
    `How does one end up with {0} members?`, String(ww.memberCount),
    `Searching in '{1}' for uses of {0}.`, ww.searchTerm, ww.path,
    `Still getting uses for {0}...`, ww.path,
    `Still searching '{0}' in {1}...`, ww.searchTerm, ww.path,
    `This is taking a while because there are {0} members. Searching '{1}' in {2} still.`, String(ww.memberCount), ww.searchTerm, ww.path,
    `Using Hawkeye Pathfinder's ${commandName} ${commandText_}`,
    `What's so special about '{0} in {1}' anyway?`, ww.searchTerm, ww.path,
    `What's so special about '{0}' anyway?`, ww.searchTerm,
    `While you wait, why not get a snack?`,
    `While you wait, why not stretch your legs?`,
    `While you wait, your getting sleepy...`,
    `Why was six afraid of seven?`,
    `Wow. This really is taking a while. Let's hope you get the result you want.`,
  ];
  returnMessage = l10n.t(``);

  return returnMessages;

}