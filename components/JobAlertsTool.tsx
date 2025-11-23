import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CrmData, JobAlert, School } from '../types';
import { RefreshIcon, SearchIcon, SpinnerIcon, TrashIcon } from './icons';
import { parseUKDate } from '../utils';

interface JobAlertsToolProps {
    crmData: CrmData;
    onBack: () => void;
    onAddNewJobAlert: (job: Omit<JobAlert, 'excelRowIndex'>) => Promise<void>;
    isSearching: boolean;
    log: string[];
    summary: { found: number, duplicates: number, added: number, schoolsChecked: number } | null;
    onStartSearch: () => void;
    onStopSearch: () => void;
    onSelectSchool: (school: School) => void;
    onPruneJobAlerts: () => void;
}

const JobAlertsTool: React.FC<JobAlertsToolProps> = ({ crmData, onBack, onAddNewJobAlert, isSearching, log, summary, onStartSearch, onStopSearch, onSelectSchool, onPruneJobAlerts }) => {
    const [lastUpdated, setLastUpdated] = useState<string | null>(localStorage.getItem('jobAlertsLastRun'));
    const [localSearch, setLocalSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof JobAlert; direction: 'asc' | 'desc' } | null>({ key: 'excelRowIndex', direction: 'desc' });
    const logContainerRef = useRef<HTMLDivElement>(null);
    const prevIsSearching = useRef(isSearching);

    const locations = useMemo(() => [...new Set(crmData.jobAlerts.map(j => j.location).filter(Boolean))].sort(), [crmData.jobAlerts]);
    const subjects = useMemo(() => [...new Set(crmData.jobAlerts.map(j => j.subject).filter(Boolean))].sort(), [crmData.jobAlerts]);

    useEffect(() => {
        // Auto-scroll the log container
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    useEffect(() => {
        // When a search finishes (isSearching goes from true to false), update the timestamp display.
        if (!isSearching && prevIsSearching.current) {
            setLastUpdated(localStorage.getItem('jobAlertsLastRun'));
        }
        prevIsSearching.current = isSearching;
    }, [isSearching]);

    const handleSort = (key: keyof JobAlert) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedJobs = useMemo(() => {
        let filtered = [...crmData.jobAlerts];

        if (localSearch) {
            const lowerSearch = localSearch.toLowerCase();
            filtered = filtered.filter(job =>
                job.schoolName.toLowerCase().includes(lowerSearch) ||
                job.jobTitle.toLowerCase().includes(lowerSearch) ||
                (job.subject && job.subject.toLowerCase().includes(lowerSearch)) ||
                job.location.toLowerCase().includes(lowerSearch)
            );
        }
        if (locationFilter) {
            filtered = filtered.filter(job => job.location === locationFilter);
        }
        if (subjectFilter) {
            filtered = filtered.filter(job => job.subject === subjectFilter);
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (sortConfig.key === 'closeDate') {
                    const dateA = parseUKDate(a.closeDate)?.getTime() || 0;
                    const dateB = parseUKDate(b.closeDate)?.getTime() || 0;
                    if (dateA === 0 && dateB === 0) return 0;
                    if (dateA === 0) return 1;
                    if (dateB === 0) return -1;
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                
                if (sortConfig.key === 'excelRowIndex') {
                    return sortConfig.direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
                }

                if (aValue == null) return 1;
                if (bValue == null) return -1;

                if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [crmData.jobAlerts, localSearch, locationFilter, subjectFilter, sortConfig]);

    const handleSchoolClick = (schoolName: string) => {
        const school = crmData.schools.find(s => s.name === schoolName);
        if (school) {
            onSelectSchool(school);
        }
    };

    const SortableHeader: React.FC<{ label: string; sortKey: keyof JobAlert; }> = ({ label, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const directionIcon = sortConfig?.direction === 'asc' ? '▲' : '▼';
        return (
            <th scope="col" className="px-6 py-3">
                <button className="flex items-center space-x-1 uppercase text-xs font-medium" onClick={() => handleSort(sortKey)}>
                    <span>{label}</span>
                    {isSorted && <span className="text-xs">{directionIcon}</span>}
                </button>
            </th>
        );
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">Job Alerts</h1>
                </div>
                <p className="text-slate-400 max-w-2xl mt-2 ml-14">Automatically finds new job vacancies from your schools' websites and public job boards.</p>
            </div>
            
             <div className="flex-shrink-0 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 flex-grow w-full sm:w-auto">
                    <div className="relative flex-grow min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                        <input type="text" placeholder="Search found jobs..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-slate-800 border border-slate-700 text-white rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                    <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                        <option value="">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                        <option value="">All Subjects</option>
                        {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <p className="text-sm text-slate-400 text-center flex-grow">Last scan: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}</p>
                    <button onClick={onPruneJobAlerts} disabled={isSearching} className="flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors bg-amber-500/80 text-white hover:bg-amber-600/80 disabled:opacity-50">
                        <TrashIcon className="w-5 h-5" /> Prune
                    </button>
                    <button onClick={isSearching ? onStopSearch : onStartSearch} className={`flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors w-32 ${isSearching ? 'bg-red-500/80 text-white hover:bg-red-600/80' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                        {isSearching ? <><SpinnerIcon className="w-5 h-5"/> Stop</> : <><RefreshIcon className="w-5 h-5"/> Refresh</>}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                {/* Job List */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                     <div className="overflow-auto h-full">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="bg-slate-800 text-xs text-slate-300 uppercase sticky top-0">
                                <tr>
                                    <SortableHeader label="School" sortKey="schoolName" />
                                    <SortableHeader label="Job Title" sortKey="jobTitle" />
                                    <SortableHeader label="Salary" sortKey="salary" />
                                    <SortableHeader label="Closing Date" sortKey="closeDate" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredAndSortedJobs.map(job => (
                                    <tr key={job.excelRowIndex} className="hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium text-white">
                                            <button onClick={() => handleSchoolClick(job.schoolName)} className="text-sky-400 hover:underline text-left">
                                                {job.schoolName}
                                            </button>
                                            <br/>
                                            <span className="text-xs text-slate-500 font-normal">{job.location}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {job.sourceUrl ? (
                                                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-sky-400">
                                                    {job.jobTitle}
                                                </a>
                                            ) : (
                                                job.jobTitle
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{job.salary}</td>
                                        <td className="px-6 py-4">{job.closeDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAndSortedJobs.length === 0 && !isSearching && (
                            <div className="text-center p-8 text-slate-500">No job alerts found. Try refreshing the list.</div>
                        )}
                    </div>
                </div>
                {/* Log and Summary */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col p-4 gap-4 overflow-hidden">
                    <h3 className="text-lg font-semibold text-white flex-shrink-0">Live Log</h3>
                    <div ref={logContainerRef} className="flex-grow bg-black/50 p-2 rounded-md overflow-y-auto text-xs text-slate-400 font-mono space-y-1">
                        {log.map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                    {summary && (
                        <div className="flex-shrink-0 bg-slate-800 p-3 rounded-lg border border-slate-700">
                             <h4 className="text-md font-semibold text-white mb-2">Scan Summary</h4>
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                <p>Schools Checked:</p><p className="font-bold text-white text-right">{summary.schoolsChecked} / {crmData.schools.length}</p>
                                <p>Jobs Found:</p><p className="font-bold text-white text-right">{summary.found}</p>
                                <p>Duplicates Ignored:</p><p className="font-bold text-white text-right">{summary.duplicates}</p>
                                <p className="text-emerald-400">New Jobs Added:</p><p className="font-bold text-emerald-400 text-right">{summary.added}</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobAlertsTool;