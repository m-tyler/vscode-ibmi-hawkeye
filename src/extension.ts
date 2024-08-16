// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Code4i } from './tools';
import { initializeHawkeyePathfinder } from "./HawkeyePathfinder";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	Code4i.initialize();

	initializeHawkeyePathfinder(context);

	console.log('Congratulations, extension "vscode-ibmi-hawkeye "version": "0.0.8"" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() { }
