import vscode, { l10n, } from 'vscode';
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface MessageParmsO {
  path: string,
  library: string,
  name: string,
  sourceFile: string,
  type: string,
  searchTerm: string,
  memberCount: number,
  commandName: string,
  commandText: string,
};
export interface MessageParms {
  [key: string]: string | number;
};
export enum CommandText {
  dspobju = "to list object used details",
  dspfilsetu = "to search for file sets used",
  dsppgmobj = "to list program objects used",
  dspscnsrc = "to search source members"
}
export const myMessages = [
  `'{searchTerm}' in {path}.`,
  `How does one end up with {memberCount} members?`,
  `Searching in '{path}' for uses of '{searchTerm}'.`,
  `Still getting uses for {path}...`,
  `Still searching '{searchTerm}' in {path}...`,
  `This is taking a while because there are {memberCount} members. Searching '{searchTerm}' in {path} still.`,
  `Using Hawkeye Pathfinder's {commandName} {commandText}`,
  `What's so special about '{searchTerm} in {path}' anyway?`,
  `What's so special about '{searchTerm}' anyway?`,
  `While you wait, why not get a snack?`,
  `While you wait, why not stretch your legs?`,
  `While you wait, your getting sleepy...`,
  `Why was six afraid of seven?`,
  `Wow. This really is taking a while. Let's hope you get the result you want.`,
];

export function setProgressWindowLocalizedMessages(
  params: { [key: string]: any},
  maxMessages: number,
  messages: string[] = myMessages
): string[] {
  if (messages.length === 0) {
    return []; // Return an empty array if no messages are provided
  }
  const messageCount = Math.min(maxMessages, messages.length);
  const shuffledMessages = [...messages].sort(() => Math.random() - 0.5);
  const selectedMessages: string[] = [];

  for (let i = 0; i < messageCount; i++) {
    let message = shuffledMessages[i];
    if (message) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          message = message.replace(regex, String(params[key] === `` ? params[key] : `*NA`));
        }
      }
      selectedMessages.push(l10n.t(message, params));
    }
  }

  return selectedMessages;
}
export function loadMessageData<T>(ww: T, additional: Partial<MessageParms> ): T {
  const commandText = getCommandText(String(additional!.commandName).toLocaleLowerCase());
  return {...ww, ...additional, ...{commandText}  };
}

export function getCommandText(commandName: string): string {
  return String(CommandText[commandName as keyof typeof CommandText]);
}