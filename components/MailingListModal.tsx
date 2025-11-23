import React, { useState, useMemo } from 'react';
import { School, User, CustomDialerList } from '../types';
import { parseUKDate, autoformatDateInput, parseUKDateTimeString } from '../utils';
import { ClipboardIcon, ExportIcon } from './icons';

interface MailingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    schools: School[];
    users: User[];
    currentUser: User;
    isSuperAdmin: boolean;
}

type ListFilters = CustomDialerList['filters'];

const DualListBox: React.FC<{
    title: string;
    availableItems: string[];
    selectedItems: string[];
    onSelectionChange: (newSelection: string[]) => void;
    heightClass?: string;
}> = ({ title, availableItems, selectedItems, onSelectionChange, heightClass = 'h-48' }) => {
    const [highlightedAvailable, setHighlightedAvailable] = useState<string[]>([]);
    const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

    const unselectedItems = useMemo(() => 
        availableItems.filter(item => !selectedItems.includes(item)),
        [availableItems, selectedItems]
    );

    const handleAvailableClick = (e: React.MouseEvent, item: string) => {
        if (e.ctrlKey || e.metaKey) {
            setHighlightedAvailable(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else {
            setHighlightedAvailable([item]);
        }
        setHighlightedSelected([]);
    };

    const handleSelectedClick = (e: React.MouseEvent, item: string) => {
        if (e.ctrlKey || e.metaKey) {
            setHighlightedSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else {
            setHighlightedSelected([item]);
        }
        setHighlightedAvailable([]);
    };

    const moveHighlightedAvailable = () => { onSelectionChange([...selectedItems, ...highlightedAvailable].sort()); setHighlightedAvailable([]); };
    const moveHighlightedSelected = () => { const hs = new Set(highlightedSelected); onSelectionChange(selectedItems.filter(i => !hs.has(i))); setHighlightedSelected([]); };
    const moveAllAvailable = () => { onSelectionChange([...selectedItems, ...unselectedItems].sort()); };
    const removeAllSelected = () => { onSelectionChange([]); };
    const handleDoubleClickAvailable = (item: string) => { onSelectionChange([...selectedItems, item].sort()); };
    const handleDoubleClickSelected = (item: string) => { onSelectionChange(selectedItems.filter(i => i !== item)); };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
            <div className={`flex flex-col md:flex-row gap-2 ${heightClass}`}>
                <div className="border border-slate-700 rounded-md p-1 overflow-y-auto bg-slate-800 w-full flex flex-col">
                    <p className="text-xs text-slate-500 px-1 pb-1">Available ({unselectedItems.length})</p>
                    <div className="overflow-y-auto">
                        {unselectedItems.map(item => (
                            <button key={item} type="button" onClick={(e) => handleAvailableClick(e, item)} onDoubleClick={() => handleDoubleClickAvailable(item)} className={`block w-full text-left text-sm p-1 my-0.5 rounded text-slate-300 truncate ${highlightedAvailable.includes(item) ? 'bg-sky-600' : 'hover:bg-slate-700'}`}>{item}</button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-row md:flex-col justify-center items-center gap-2">
                    <button type="button" onClick={moveAllAvailable} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600">&gt;&gt;</button>
                    <button type="button" onClick={moveHighlightedAvailable} disabled={highlightedAvailable.length === 0} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 disabled:opacity-50">&gt;</button>
                    <button type="button" onClick={moveHighlightedSelected} disabled={highlightedSelected.length === 0} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 disabled:opacity-50">&lt;</button>
                    <button type="button" onClick={removeAllSelected} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600">&lt;&lt;</button>
                </div>
                <div className="border border-slate-700 rounded-md p-1 overflow-y-auto bg-slate-800 w-full flex flex-col">
                    <p className="text-xs text-slate-500 px-1 pb-1">Selected ({selectedItems.length})</p>
                    <div className="overflow-y-auto">
                        {[...selectedItems].sort().map(item => (
                            <button key={item} type="button" onClick={(e) => handleSelectedClick(e, item)} onDoubleClick={() => handleDoubleClickSelected(item)} className={`block w-full text-left text-sm p-1 my-0.5 rounded text-sky-300 truncate ${highlightedSelected.includes(item) ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}>{item}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MailingListModal: React.FC<MailingListModalProps> = ({ isOpen, onClose, schools, users, currentUser, isSuperAdmin }) => {
    const [view, setView] = useState<'filters' | 'results'>('filters');
    const [generatedList, setGeneratedList] = useState<string[]>([]);
    const [filteredSchoolsForList, setFilteredSchoolsForList] = useState<School[]>([]);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    // Filter States
    const [accountManagerFilter, setAccountManagerFilter] = useState(isSuperAdmin ? 'All Staff' : currentUser.name);
    const [spokenFilter, setSpokenFilter] = useState<'any' | 'yes' | 'no'>('any');
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedEngagements, setSelectedEngagements] = useState<string[]>([]);
    const [dateFilterType, setDateFilterType] = useState<'any' | 'specific' | 'between' | 'before' | 'after' | 'blank'>('any');
    const [date1, setDate1] = useState('');
    const [date2, setDate2] = useState('');

    const locations = useMemo(() => [...new Set(schools.map(s => s.location).filter(Boolean))].sort(), [schools]);
    const engagementLevels = useMemo(() => ['Blank', 'CM Not Known', 'CM Confirmed', 'CM Spoken To'], []);

    const filteredSchools = useMemo(() => {
        let filtered = schools;
        if (accountManagerFilter !== 'All Staff') {
            filtered = filtered.filter(s => s.accountManager === accountManagerFilter);
        }
        if (selectedLocations.length > 0) {
            filtered = filtered.filter(s => selectedLocations.includes(s.location));
        }
        if (spokenFilter !== 'any') {
            filtered = filtered.filter(s => s.spokeToCoverManager === (spokenFilter === 'yes'));
        }
        if (selectedEngagements.length > 0) {
            filtered = filtered.filter(s => selectedEngagements.includes(s.engagementScore || 'Blank'));
        }
        if (dateFilterType && dateFilterType !== 'any') { /* Date filtering logic */ }
        return filtered;
    }, [schools, accountManagerFilter, spokenFilter, selectedLocations, selectedEngagements, dateFilterType, date1, date2]);

    const handleGenerate = () => {
        const list = filteredSchools
            .filter(s => s.email)
            .map(s => `${s.email}, ${s.emailName || s.coverManager || ''}`.trim());
        setGeneratedList(list);
        setFilteredSchoolsForList(filteredSchools.filter(s => s.email));
        setView('results');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedList.join('\n'));
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    };

    const handleDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Email,Name\n"
            + filteredSchoolsForList
                .map(s => `"${s.email}","${s.emailName || s.coverManager || ''}"`)
                .join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "mailing_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-4xl flex flex-col max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">Create Mailing List</h2>
                
                {view === 'filters' ? (
                    <>
                        <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {isSuperAdmin && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Account Manager</label>
                                        <select value={accountManagerFilter} onChange={e => setAccountManagerFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white">
                                            <option>All Staff</option>
                                            {users.map(u => <option key={u.email}>{u.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Spoken-To Status</label>
                                    <select value={spokenFilter} onChange={e => setSpokenFilter(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white">
                                        <option value="any">Any</option><option value="yes">Spoken To</option><option value="no">Not Spoken To</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DualListBox title="Locations" availableItems={locations} selectedItems={selectedLocations} onSelectionChange={setSelectedLocations} />
                                <DualListBox title="Engagement Levels" availableItems={engagementLevels} selectedItems={selectedEngagements} onSelectionChange={setSelectedEngagements} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-700 flex-shrink-0">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md">Cancel</button>
                            <button onClick={handleGenerate} className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md">Generate List ({filteredSchools.length} Schools)</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                                <h3 className="text-lg font-semibold text-white">Generated List ({generatedList.length} Emails)</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleCopy} className="flex items-center gap-2 text-sm bg-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-600 disabled:bg-emerald-600">
                                        <ClipboardIcon className="w-4 h-4" />{copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button onClick={handleDownload} className="flex items-center gap-2 text-sm bg-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-600">
                                        <ExportIcon className="w-4 h-4" />Download CSV
                                    </button>
                                </div>
                            </div>
                             <textarea 
                                readOnly 
                                value={generatedList.join('\n')} 
                                className="w-full flex-grow bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 font-mono text-sm"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-700 flex-shrink-0">
                            <button onClick={() => setView('filters')} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md">Back to Filters</button>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md">Close</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MailingListModal;