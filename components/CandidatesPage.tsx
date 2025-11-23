import React, { useState, useMemo } from 'react';
import { Candidate } from '../types';
import { SearchIcon, CarIcon, CheckDocumentIcon, DocumentTextIcon, EmailIcon, CallIcon, UpdateServiceIcon, AddIcon } from './icons';
import { getInitials, getInitialsColor } from '../utils';

interface CandidatesPageProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenAddCandidateModal: () => void;
}

const AvailabilityIndicator: React.FC<{ availability: Candidate['availability'] }> = ({ availability }) => {
    const days = [
        { key: 'monday', label: 'M' },
        { key: 'tuesday', label: 'T' },
        { key: 'wednesday', label: 'W' },
        { key: 'thursday', label: 'T' },
        { key: 'friday', label: 'F' },
    ];
    return (
        <div className="flex space-x-1">
            {days.map(day => (
                <span key={day.key} className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${availability[day.key as keyof typeof availability] ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {day.label}
                </span>
            ))}
        </div>
    );
};

const CandidatesPage: React.FC<CandidatesPageProps> = ({ candidates, onSelectCandidate, onOpenAddCandidateModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [drivesFilter, setDrivesFilter] = useState<'any' | 'yes' | 'no'>('any');
    const [dbsFilter, setDbsFilter] = useState<'any' | 'yes' | 'no'>('any');
    const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Candidate; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    const locations = useMemo(() => [...new Set(candidates.map(c => c.location).filter(Boolean))].sort(), [candidates]);

    const filteredAndSortedCandidates = useMemo(() => {
        let filtered = candidates;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(lowercasedTerm) ||
                c.email.toLowerCase().includes(lowercasedTerm) ||
                c.location.toLowerCase().includes(lowercasedTerm)
            );
        }
        if (locationFilter) {
            filtered = filtered.filter(c => c.location === locationFilter);
        }
        if (drivesFilter !== 'any') {
            filtered = filtered.filter(c => c.drives === (drivesFilter === 'yes'));
        }
        if (dbsFilter !== 'any') {
            filtered = filtered.filter(c => c.dbs === (dbsFilter === 'yes'));
        }
        if (availabilityFilter.length > 0) {
            filtered = filtered.filter(c => 
                availabilityFilter.every(day => c.availability[day as keyof typeof c.availability])
            );
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
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
    }, [candidates, searchTerm, locationFilter, drivesFilter, dbsFilter, availabilityFilter, sortConfig]);

    const handleSort = (key: keyof Candidate) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleAvailabilityFilterChange = (day: string) => {
        setAvailabilityFilter(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const SortableHeader: React.FC<{ label: string; sortKey: keyof Candidate; }> = ({ label, sortKey }) => {
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

    const availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Candidates ({filteredAndSortedCandidates.length})</h1>
                    <button onClick={onOpenAddCandidateModal} className="flex items-center justify-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                        <AddIcon className="w-5 h-5 mr-2" />
                        Add Candidate
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 flex-shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 items-center">
                <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                    <input type="text" placeholder="Search candidates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-slate-800 border border-slate-700 text-white rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                </div>
                <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="">All Locations</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select value={drivesFilter} onChange={e => setDrivesFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="any">Drives?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
                <select value={dbsFilter} onChange={e => setDbsFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="any">DBS?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                    {availabilityDays.map(day => (
                        <button key={day} onClick={() => handleAvailabilityFilterChange(day)} className={`px-2 py-1 text-xs font-semibold rounded-md uppercase ${availabilityFilter.includes(day) ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                            {day.charAt(0)}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-grow bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-auto h-full">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="bg-slate-800 text-xs text-slate-300 uppercase sticky top-0">
                                <tr>
                                    <SortableHeader label="Name" sortKey="name" />
                                    <SortableHeader label="Location" sortKey="location" />
                                    <th scope="col" className="px-6 py-3">Contact</th>
                                    <th scope="col" className="px-6 py-3">Checks</th>
                                    <th scope="col" className="px-6 py-3">Availability</th>
                                    <th scope="col" className="px-6 py-3">Documents</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredAndSortedCandidates.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-800/50 group">
                                        <td scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${getInitialsColor(c.name)} flex items-center justify-center font-bold text-xs text-white flex-shrink-0`}>
                                                    {getInitials(c.name)}
                                                </div>
                                                <button onClick={() => onSelectCandidate(c)} className="text-sky-400 hover:underline">{c.name}</button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{c.location}</td>
                                        <td className="px-6 py-4">
                                            <p className="truncate" title={c.email}>{c.email}</p>
                                            <p className="text-slate-500 truncate">{c.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span title={c.drives ? "Drives" : "Doesn't drive"} className={c.drives ? 'text-emerald-400' : 'text-slate-600'}><CarIcon className="w-5 h-5"/></span>
                                                <span title={c.dbs ? "Has DBS" : "No DBS"} className={c.dbs ? 'text-emerald-400' : 'text-slate-600'}><CheckDocumentIcon className="w-5 h-5"/></span>
                                                <span title={c.onUpdateService ? "On Update Service" : "Not on Update Service"} className={c.onUpdateService ? 'text-emerald-400' : 'text-slate-600'}><UpdateServiceIcon className="w-5 h-5"/></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><AvailabilityIndicator availability={c.availability} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {c.cvUrl && <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300" title="View CV"><DocumentTextIcon className="w-5 h-5"/></a>}
                                                {c.dbsCertificateUrl && <a href={c.dbsCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300" title="View DBS Certificate"><DocumentTextIcon className="w-5 h-5"/></a>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 p-2">
                         {filteredAndSortedCandidates.map(c => (
                            <div key={c.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full ${getInitialsColor(c.name)} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`}>
                                            {getInitials(c.name)}
                                        </div>
                                        <div>
                                            <button onClick={() => onSelectCandidate(c)} className="font-bold text-sky-400 text-lg text-left hover:underline">{c.name}</button>
                                            <p className="text-sm text-slate-400">{c.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                         {c.cvUrl && <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300" title="View CV"><DocumentTextIcon className="w-5 h-5"/></a>}
                                         {c.dbsCertificateUrl && <a href={c.dbsCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300" title="View DBS Certificate"><DocumentTextIcon className="w-5 h-5"/></a>}
                                    </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <EmailIcon className="w-4 h-4 text-slate-500"/>
                                        <span className="text-sm text-slate-300 truncate">{c.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CallIcon className="w-4 h-4 text-slate-500"/>
                                        <span className="text-sm text-slate-300 truncate">{c.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CarIcon className={`w-4 h-4 ${c.drives ? 'text-emerald-400' : 'text-slate-600'}`}/>
                                        <span className="text-sm text-slate-300">Drives</span>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <CheckDocumentIcon className={`w-4 h-4 ${c.dbs ? 'text-emerald-400' : 'text-slate-600'}`}/>
                                        <span className="text-sm text-slate-300">DBS</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UpdateServiceIcon className={`w-4 h-4 ${c.onUpdateService ? 'text-emerald-400' : 'text-slate-600'}`}/>
                                        <span className="text-sm text-slate-300">Update Service</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <AvailabilityIndicator availability={c.availability} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredAndSortedCandidates.length === 0 && (
                        <div className="text-center p-8 text-slate-500">No candidates match the current filters.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidatesPage;