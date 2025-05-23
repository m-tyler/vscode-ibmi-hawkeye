import { HawkeyeSearchMatches } from '../types/types';

export async function fetchSearchResultsFromServer(): Promise<HawkeyeSearchMatches[]> {
    // Simulate fetching data from a server
    return [
        {
            command: 'HAWKEYE',
            searchDescription: `HAWKEYE ${new Date().toLocaleString()}`,
            searchItem: '',
            searchTerm: '',
            files: [
                {
                    fileName: 'DSPSCNSRC',
                    fileText: 'Display Scan Source Members',
                    howUsed: '',
                    protected: true,
                    matchCount: 1,
                    matches: [
                        { lineNumber: 10, content: 'Double click to run command' }
                    ]
                },
                {
                    fileName: 'DSPOBJU',
                    fileText: 'Display Object Use',
                    howUsed: '',
                    protected: true,
                    matchCount: 1,
                    matches: [
                        { lineNumber: 10, content: 'Double click to run command' }
                    ]
                },
                {
                    fileName: 'DSPPGMOBJ',
                    fileText: 'Display Program Objects',
                    howUsed: '',
                    protected: true,
                    matchCount: 1,
                    matches: [
                        { lineNumber: 10, content: 'Double click to run command' }
                    ]
                },
                {
                    fileName: 'DSPFILSET',
                    fileText: 'Display File Set Used',
                    howUsed: '',
                    protected: true,
                    matchCount: 1,
                    matches: [
                        { lineNumber: 10, content: 'Double click to run command' }
                    ]
                },
            ]
        }    
    ];
}
