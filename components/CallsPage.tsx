import React, { useState, useMemo } from 'react';
import { CallLog, School } from '../types';
import { TranscriptIcon, TrashIcon, CallIcon } from './icons';
import { parseUKDate, parseDurationToSeconds, parseUKDateTimeString } from '../utils';

interface CallsPageProps {
  callLogs: CallLog[];
  schools: School[];
  onSelectSchool: (school: School) => void;
  onDeleteCallLog: (callLog: CallLog) => void;
}

const SortableHeader: React.FC<{
    label: string;
    sortKey: keyof CallLog | 'durationNum';
    sortConfig: { key: keyof CallLog | 'durationNum'; direction: 'asc' | 'desc' } | null;
    onSort: (key: keyof CallLog | 'durationNum') => void;
}> = ({ label, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = sortConfig?.direction === 'asc' ? '▲' : '▼';

    return (
        <th scope="col" className="px-6 py-3">
            <button className="flex items-center space-x-1 uppercase text-xs font-medium" onClick={() => onSort(sortKey)}>
                <span>{label}</span>
                {isSorted && <span className="text-xs">{directionIcon}</span>}
            </button>
        </th>
    );
};

const CallsPage: React.FC<CallsPageProps> = ({ callLogs, schools, onSelectSchool, onDeleteCallLog }) => {
  const [viewingTranscript, setViewingTranscript] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof CallLog | 'durationNum'; direction: 'asc' | 'desc' } | null>({ key: 'dateCalled', direction: 'desc' });

  const handleSchoolClick = (schoolName: string) => {
    const school = schools.find(s => s.name === schoolName);
    if (school) {
        onSelectSchool(school);
    }
  };

  const handleSort = (key: keyof CallLog | 'durationNum') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCallLogs = useMemo(() => {
    let sortableItems = [...callLogs];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const { key, direction } = sortConfig;
            
            let aValue: any;
            let bValue: any;

            if (key === 'durationNum') {
                aValue = parseDurationToSeconds(a.duration);
                bValue = parseDurationToSeconds(b.duration);
            } else if (key === 'dateCalled') {
                aValue = parseUKDateTimeString(a.dateCalled)?.getTime() || 0;
                bValue = parseUKDateTimeString(b.dateCalled)?.getTime() || 0;
            } else {
                aValue = a[key as keyof CallLog];
                bValue = b[key as keyof CallLog];
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                 if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                 if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                 return 0;
            } else {
                const strA = String(aValue || '').toLowerCase();
                const strB = String(bValue || '').toLowerCase();
                if (strA < strB) return direction === 'asc' ? -1 : 1;
                if (strA > strB) return direction === 'asc' ? 1 : -1;
                return 0;
            }
        });
    }
    return sortableItems;
  }, [callLogs, sortConfig]);

  return (
    <div className="p-4 md:p-6">
      {viewingTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setViewingTranscript(null)}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Call Transcript</h3>
                <pre className="flex-grow bg-slate-900 p-3 rounded-md overflow-y-auto text-sm whitespace-pre-wrap font-mono text-slate-300">{viewingTranscript}</pre>
                <button onClick={() => setViewingTranscript(null)} className="mt-4 self-end px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">Close</button>
            </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Call Logs</h2>
      </div>
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left text-slate-400">
            <thead className="bg-slate-800 text-xs text-slate-300 uppercase">
                <tr>
                <SortableHeader label="Date" sortKey="dateCalled" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="School Name" sortKey="schoolName" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Cover Manager" sortKey="coverManager" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Account Manager" sortKey="accountManager" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Duration" sortKey="durationNum" sortConfig={sortConfig} onSort={handleSort} />
                <th scope="col" className="px-6 py-3 uppercase text-xs font-medium">Notes</th>
                <th scope="col" className="px-6 py-3 text-center uppercase text-xs font-medium">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {sortedCallLogs.map((log, index) => (
                <tr key={`${log.excelRowIndex}-${index}`} className="hover:bg-slate-800/50 group">
                    <td className="px-6 py-4 whitespace-nowrap">{log.dateCalled}</td>
                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                        <button 
                        onClick={() => handleSchoolClick(log.schoolName)} 
                        className="text-sky-400 hover:underline font-medium text-left"
                        disabled={!schools.find(s => s.name === log.schoolName)}
                        >
                            {log.schoolName}
                        </button>
                    </th>
                    <td className="px-6 py-4">{log.coverManager || 'N/A'}</td>
                    <td className="px-6 py-4">{log.accountManager}</td>
                    <td className="px-6 py-4">{log.duration}</td>
                    <td className="px-6 py-4">
                        <p className="max-w-xs truncate" title={log.notes}>{log.notes}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {log.transcript ? (
                                <button onClick={() => setViewingTranscript(log.transcript!)} className="p-2 rounded-full hover:bg-slate-700" title="View Transcript">
                                    <TranscriptIcon className="w-5 h-5 text-sky-400" />
                                </button>
                            ) : (
                                <span className="w-9 h-9 inline-block"></span>
                            )}
                            <button onClick={() => onDeleteCallLog(log)} className="p-2 rounded-full hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Call Log">
                                <TrashIcon className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden p-2 space-y-2">
            {sortedCallLogs.map((log, index) => (
                <div key={`${log.excelRowIndex}-${index}`} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                             <button onClick={() => handleSchoolClick(log.schoolName)} className="font-bold text-white text-left hover:underline disabled:no-underline disabled:text-white" disabled={!schools.find(s => s.name === log.schoolName)}>
                                {log.schoolName}
                            </button>
                            <p className="text-sm text-slate-400">{log.dateCalled}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {log.transcript && (
                                <button onClick={() => setViewingTranscript(log.transcript!)} className="p-2 rounded-full hover:bg-slate-700" title="View Transcript">
                                    <TranscriptIcon className="w-5 h-5 text-sky-400" />
                                </button>
                            )}
                            <button onClick={() => onDeleteCallLog(log)} className="p-2 rounded-full hover:bg-slate-700" title="Delete Call Log">
                                <TrashIcon className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-300 truncate" title={log.notes}>
                        <span className="font-semibold">Notes:</span> {log.notes}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="truncate"><span className="font-semibold text-slate-500">By:</span> {log.accountManager}</div>
                        <div className="truncate"><span className="font-semibold text-slate-500">With:</span> {log.coverManager || 'N/A'}</div>
                        <div className="col-span-2"><span className="font-semibold text-slate-500">Duration:</span> {log.duration}</div>
                    </div>
                </div>
            ))}
        </div>
        
        {sortedCallLogs.length === 0 && (
            <div className="text-center p-8 text-slate-500">No call logs found.</div>
        )}
      </div>
    </div>
  );
};

export default CallsPage;