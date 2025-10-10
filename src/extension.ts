// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Code4i, showExtensionVersion } from './tools/tools';
import { initializeHawkeyePathfinder } from "./HawkeyePathfinder";
import { TempFileManager } from './tools/tempFileManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let tempFileManager: TempFileManager;
let globalContext: vscode.ExtensionContext;
export async function activate(context: vscode.ExtensionContext) {
	tempFileManager = new TempFileManager();
	Code4i.initialize(context);
	globalContext = context; // Assign the context during activation
	const extensionId = context.extension.id;

	initializeHawkeyePathfinder(context);
	vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, true);
	context.subscriptions.push(
		vscode.commands.registerCommand('Hawkeye-Pathfinder.showVersion', () => {
			showExtensionVersion(context.extension.id);
		})
	);

	console.log(`Congratulations, extension "${context.extension.packageJSON.description}" "Version" :"${context.extension.packageJSON.version}" is now active!`);
}

// this method is called when your extension is deactivated
export function deactivate() {
	// Clean up temporary files when the extension deactivates
	if (tempFileManager) {
		tempFileManager.cleanUpTempFiles();
	}
}