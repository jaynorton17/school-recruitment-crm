
import React from 'react';
import { SchoolIcon, TaskIcon, NotesIcon, CallIcon, OpportunitiesIcon, UsersIcon, JobAlertsIcon } from './icons';
import { SearchResult, School, Task, Note, CallLog, Opportunity, Candidate, JobAlert } from '../types';

interface GlobalSearchResultsProps {
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
    query: string;
}

const ResultItem: React.FC<{ result: SearchResult; onClick: () => void }> = ({ result, onClick }) => {
    let Icon: React.ElementType;
    let title: string = '';
    let subtitle: string = '';

    switch (result.type) {
        case 'school':
            Icon = SchoolIcon;
            title = result.data.name;
            subtitle = result.data.location;
            break;
        case 'task':
            Icon = TaskIcon;
            title = result.data.taskDescription;
            subtitle = `Task for ${result.data.schoolName}`;
            break;
        case 'note':
            Icon = NotesIcon;
            title = result.data.note;
            subtitle = `Note for ${result.data.schoolName}`;
            break;
        case 'call':
            Icon = CallIcon;
            title = result.data.notes;
            subtitle = `Call with ${result.data.schoolName}`;
            break;
        case 'opportunity':
            Icon = OpportunitiesIcon;
            title = result.data.name;
            subtitle = `Opportunity at ${result.data.schoolName}`;
            break;
        case 'candidate':
            Icon = UsersIcon;
            title = result.data.name;
            subtitle = result.data.email;
            break;
        case 'job':
            Icon = JobAlertsIcon;
            title = (result.data as JobAlert).jobTitle;
            subtitle = `Job at ${(result.data as JobAlert).schoolName}`;
            break;
        default:
            return null;
    }

    return (
        <li onClick={onClick}>
            <div className="flex items-center p-3 hover:bg-slate-700 cursor-pointer rounded-lg">
                <Icon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{title}</p>
                    <p className="text-sm text-slate-400 truncate">{subtitle}</p>
                </div>
            </div>
        </li>
    );
};

const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ results, onResultClick, query }) => {
    if (!query) {
        return null;
    }
    
    return (
        <div className="absolute top-full mt-2 w-80 md:w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-2 z-50">
            {results.length > 0 ? (
                <ul className="max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                        <ResultItem key={`${result.type}-${(result.data as any).excelRowIndex || (result.data as any).id || index}`} result={result} onClick={() => onResultClick(result)} />
                    ))}
                </ul>
            ) : (
                <p className="text-center text-slate-400 p-4">No results for "{query}"</p>
            )}
        </div>
    );
};

export default GlobalSearchResults;
