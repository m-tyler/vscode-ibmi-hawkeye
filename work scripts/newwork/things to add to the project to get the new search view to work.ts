async function searchSourceFiles() {
  // Your existing code to execute the DSPSCNSRC command
  
  // Instead of replacing the tree data:
  // searchTreeProvider.setResults(results);
  
  // Add a new session:
  searchTreeProvider.addSearchSession('DSPSCNSRC', results);
  
  // Make sure the view is visible
  vscode.commands.executeCommand('setContext', 'Hawkeye-Pathfinder:searchViewVisible', true);
}
// Add a command to clear all sessions
context.subscriptions.push(
  vscode.commands.registerCommand('Hawkeye-Pathfinder.clearAllSessions', () => {
    searchTreeProvider.clearSessions();
  })
);

// Add a command to remove a specific session (for right-click menu)
context.subscriptions.push(
  vscode.commands.registerCommand('Hawkeye-Pathfinder.removeSession', (session: SearchSession) => {
    searchTreeProvider.removeSession(session.id);
  })
);
// In package.json, add to the "menus" section:
"view/item/context": [
  {
    "command": "Hawkeye-Pathfinder.removeSession",
    "when": "viewItem == 'searchSession'",
    "group": "inline"
  }
]
// In package.json, add to the "commands" section:
{
  "command": "Hawkeye-Pathfinder.clearAllSessions",
  "enablement": "code-for-ibmi:connected == true",
  "title": "Clear All Search Sessions",
  "category": "Hawkeye",
  "icon": "$(clear-all)"
},
{
  "command": "Hawkeye-Pathfinder.removeSession",
  "enablement": "code-for-ibmi:connected == true",
  "title": "Remove Search Session",
  "category": "Hawkeye"
}
