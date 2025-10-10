# vscode-ibmi-hawkeye

This extension provides functionality for the source cross reference tool Hawkeye Pathfinder.

## Features of note
* It has its own Activity Bar and search results. Several methods of activating cross reference commands.  
* Currently, if cross reference does not correspond to source member then results are not shown. 
* Hawkeye Pathfinder command interface through standard VS Code prompts or Code for IBM i action prompts.  
* Configuration option to choose between using standard VS Code prompts or Code for IBM i actions.
* Keep all your search results for the life of the VS Code session, or until you choose to dismiss them.
* Perform additional Hawkeye Pathfinder commands on search result items. 

## Hawkeye Pathfinder commands utilized:

* DSPFILSETU  - Display file sets used
* DSPSCNSRC - Display scanned source
* DSPOBJU - Display Object Usage
* DSPPGMOBJ - Display Program Objects
* DSPPRCU - Display Procedure Usage
* PRTRPGPRT - Spacing Charts - Print Files in RPG
* PRTDDSPRT - Spacing Charts - Print Files in DDS
* PRTDDSDSP - Spacing Charts - Display Files in DDS


## PICS
* Start up view
<img src="/images/Intro before connection.png">
* Once connected
<img src="/images/Intro after connection.png">
* Running commands from command palette without config set to use Code for IBM i actions
  <img src="/images/Inputs samples showing when configuration not set-1.png">
  <img src="/images/Inputs samples showing when configuration not set-2.png">
  <img src="/images/Supply a comma separated list of search terms-1.png">
  <img src="/images/Supply a comma separated list of search terms-2.png">
* Running commands from command palette *with* config set to use Code for IBM i actions
  <img src="/images/Inputs samples showing when configuration set-1.png">
  <img src="/images/Inputs samples showing when configuration set-2.png">
  <img src="/images/Inputs samples showing when configuration set-3.png">
* Running commands from Code for IBM i object browser
  <img src="/images/Activate command from right click.png">
* Command Results View
  <img src="/images/Results view.png">
* Running commands from Hawkeye Pathfinder search results
  <img src="/images/Additional Hawkeye commands from search results view.png">
* Viewing Report Spacing Chart
  <img src="/images/SpacingCharts.png">
