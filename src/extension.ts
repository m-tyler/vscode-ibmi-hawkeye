// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Code4i } from './tools';
import { initializeHawkeyePathfinder } from "./HawkeyePathfinder";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	Code4i.initialize(context);

	initializeHawkeyePathfinder(context);
	vscode.commands.executeCommand(`setContext`, `Hawkeye-Pathfinder:searchViewVisible`, true);

	console.log(`Congratulations, extension "${context.extension.packageJSON.description}" "Version" :"${context.extension.packageJSON.version}" is now active!`);
}

// this method is called when your extension is deactivated
export function deactivate() { }