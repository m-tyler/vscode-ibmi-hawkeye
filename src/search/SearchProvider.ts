import * as vscode from 'vscode';

export class SearchResultProvider implements vscode.TreeDataProvider<SearchResultItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SearchResultItem | undefined | null | void> = new vscode.EventEmitter<SearchResultItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SearchResultItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private searchResults: SearchResult[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addSearchResults(results: SearchResult[]): void {
        this.searchResults.push(...results);
        this.refresh();
    }

    clearSearchResults(): void {
        this.searchResults = [];
        this.refresh();
    }

    getTreeItem(element: SearchResultItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SearchResultItem): SearchResultItem[] {
        if (!element) {
            // Level 1: Search Run items (e.g., MATTSCMD with timestamp)
            return this.searchResults.map(result => new SearchResultItem(result.timestamp, vscode.TreeItemCollapsibleState.Collapsed, result));
        } else if (element.file) {
            // Level 3: Matches inside a file
            return element.file.matches.map(
                match => new SearchResultItem(`Line ${match.line}: ${match.content}`, vscode.TreeItemCollapsibleState.None)
            );
        } else if (element.result) {
            // Level 2: Files inside a Search Run
            return element.result.files.map(
                file => new SearchResultItem(file.fileName, vscode.TreeItemCollapsibleState.Collapsed, undefined, file)
            );
        }
        return [];
    }
}

class SearchResultItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly result?: SearchResult,
        public readonly file?: SearchFile
    ) {
        super(label, collapsibleState);
        if (!result && file) {
            // File Level (set the icon or description if needed)
            this.description = "File";
        }
    }
}

// Level 1: Search Run object
export interface SearchResult {
    timestamp: string; // e.g., "MATTSCMD 04/28/25 at 15:25"
    files: SearchFile[]; // List of files
}

// Level 2: File object
export interface SearchFile {
    fileName: string; // e.g., "file1.txt"
    matches: SearchMatch[]; // Matches within the file
}

// Level 3: Match object
export interface SearchMatch {
    line: number; // Line number of the match
    content: string; // Match content
}