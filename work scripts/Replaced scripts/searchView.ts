import * as vscode from 'vscode';
import {SearchResult} from './SearchProvider';

export async function fetchSearchResultsFromServer(): Promise<SearchResult[]> {
    // Simulate fetching data from a server
    return [
        {
            timestamp: `MATTSCMD ${new Date().toLocaleString()}`,
            files: [
                {
                    fileName: 'file1.txt',
                    matches: [
                        { line: 10, content: 'Match 1 in file1.txt' },
                        { line: 25, content: 'Match 2 in file1.txt' }
                    ]
                },
                {
                    fileName: 'file2.txt',
                    matches: [
                        { line: 5, content: 'Match 1 in file2.txt' }
                    ]
                }
            ]
        }    
    ];
}
