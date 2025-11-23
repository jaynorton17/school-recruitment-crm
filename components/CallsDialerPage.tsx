import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { School, Note, CallLog, User, CustomDialerList } from '../types';
import { PhoneOutgoingIcon, SearchIcon, CheckIcon, StopIcon, CallIcon, ShuffleIcon, SendIcon, SpinnerIcon, MicIcon, AddIcon, EmailIcon, EditIcon, SchoolIcon, FolderIcon, TrashIcon, CloseIcon, GlobeIcon } from './icons';
import { parseUKDate, parseUKDateTimeString, autoformatDateInput } from '../utils';

// --- Types ---
interface CallsDialerPageProps {
    schools: School[];
    notes: Note[];
    callLogs: CallLog[];
    onStartCall: (school: School) => void;
    activeCall: { school: School; startTime: Date; } | null;
    elapsedTime: number;
    onEndAndLogCall: () => void;
    activeCallNotes: string;
    setActiveCallNotes: (notes: string) => void;
    onSelectSchool: (school: School) => void;
    onUpdateSchool: (school: School) => Promise<void>;
    onOpenSendEmailModal: (school: School) => void;
    currentUser: User;
    transcription: string;
    isTranscribing: boolean;
    startTranscription: () => void;
    stopTranscription: () => void;
}
type DialerStage = 'menu' | 'createList' | 'loadList' | 'cardView';
type AugmentedSchool = School & { latestNote?: string; lastCalledDate?: string; };
type ListFilters = CustomDialerList['filters'];

// --- Helper Components & Functions ---
const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const applyFilters = (schools: AugmentedSchool[], filters: ListFilters): AugmentedSchool[] => {
    let filtered = schools;
    const { searchTerm, spokenFilter, selectedLocations, selectedEngagements, dateFilterType, date1, date2 } = filters;

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(school => 
            (school.name || '').toLowerCase().includes(lowercasedTerm) ||
            (school.coverManager || '').toLowerCase().includes(lowercasedTerm)
        );
    }
    if (selectedLocations && selectedLocations.length > 0) {
        filtered = filtered.filter(school => selectedLocations.includes(school.location));
    }
    if (spokenFilter && spokenFilter !== 'any') {
        filtered = filtered.filter(school => school.spokeToCoverManager === (spokenFilter === 'yes'));
    }
    if (selectedEngagements && selectedEngagements.length > 0) {
        filtered = filtered.filter(school => {
            const score = school.engagementScore || 'Blank';
            return selectedEngagements.includes(score);
        });
    }
    
    if (dateFilterType && dateFilterType !== 'any') {
        if (dateFilterType === 'blank') {
            filtered = filtered.filter(school => !school.lastCalledDate);
        } else {
            let d1 = parseUKDate(date1);
            if (d1) {
                if (dateFilterType === 'specific') {
                    d1.setHours(0, 0, 0, 0);
                    const d1_end = new Date(d1);
                    d1_end.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(school => {
                        const schoolDate = parseUKDateTimeString(school.lastCalledDate);
                        return schoolDate && schoolDate.getTime() >= d1.getTime() && schoolDate.getTime() <= d1_end.getTime();
                    });
                } else if (dateFilterType === 'before') {
                    d1.setHours(0, 0, 0, 0);
                    filtered = filtered.filter(school => {
                        const schoolDate = parseUKDateTimeString(school.lastCalledDate);
                        return schoolDate && schoolDate.getTime() < d1.getTime();
                    });
                } else if (dateFilterType === 'after') {
                    d1.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(school => {
                        const schoolDate = parseUKDateTimeString(school.lastCalledDate);
                        return schoolDate && schoolDate.getTime() > d1.getTime();
                    });
                } else if (dateFilterType === 'between') {
                    let d2 = parseUKDate(date2);
                    if (d2) {
                        d1.setHours(0, 0, 0, 0);
                        d2.setHours(23, 59, 59, 999);
                        if (d1.getTime() > d2.getTime()) {
                            [d1, d2] = [d2, d1];
                        }
                        filtered = filtered.filter(school => {
                            const schoolDate = parseUKDateTimeString(school.lastCalledDate);
                            return schoolDate && schoolDate.getTime() >= d1.getTime() && schoolDate.getTime() <= d2.getTime();
                        });
                    }
                }
            }
        }
    }
    
    return filtered;
};

const MenuButton: React.FC<{ title: string; icon: React.ElementType; onClick: () => void; disabled?: boolean; }> = ({ title, icon: Icon, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="bg-slate-800 p-4 md:p-6 max-h-[160px] rounded-2xl border border-slate-700 hover:border-sky-500 transition-all text-center flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-700"
    >
        <Icon className="w-8 h-8 text-slate-300 mb-2" />
        <h3 className="text-base md:text-lg font-semibold text-white">{title}</h3>
    </button>
);

const DualListBox: React.FC<{
    title: string;
    availableItems: string[];
    selectedItems: string[];
    onSelectionChange: (newSelection: string[]) => void;
    heightClass?: string;
}> = ({ title, availableItems, selectedItems, onSelectionChange, heightClass = 'h-64 md:h-48' }) => {
    const [highlightedAvailable, setHighlightedAvailable] = useState<string[]>([]);
    const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

    const unselectedItems = useMemo(() => 
        availableItems.filter(item => !selectedItems.includes(item)),
        [availableItems, selectedItems]
    );

    // Click handlers for highlighting items
    const handleAvailableClick = (e: React.MouseEvent, item: string) => {
        if (e.ctrlKey || e.metaKey) {
            setHighlightedAvailable(prev => 
                prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
            );
        } else {
            setHighlightedAvailable([item]);
        }
        setHighlightedSelected([]); // Clear other list's highlight
    };

    const handleSelectedClick = (e: React.MouseEvent, item: string) => {
        if (e.ctrlKey || e.metaKey) {
            setHighlightedSelected(prev => 
                prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
            );
        } else {
            setHighlightedSelected([item]);
        }
        setHighlightedAvailable([]); // Clear other list's highlight
    };

    // Handlers for moving items
    const moveHighlightedAvailable = () => {
        onSelectionChange([...selectedItems, ...highlightedAvailable].sort());
        setHighlightedAvailable([]);
    };

    const moveHighlightedSelected = () => {
        const highlightedSet = new Set(highlightedSelected);
        onSelectionChange(selectedItems.filter(i => !highlightedSet.has(i)));
        setHighlightedSelected([]);
    };
    
    const moveAllAvailable = () => {
        onSelectionChange([...selectedItems, ...unselectedItems].sort());
    };

    const removeAllSelected = () => {
        onSelectionChange([]);
    };

    // Double-click handlers
    const handleDoubleClickAvailable = (item: string) => {
        onSelectionChange([...selectedItems, item].sort());
    };

    const handleDoubleClickSelected = (item: string) => {
        onSelectionChange(selectedItems.filter(i => i !== item));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
            <div className={`flex flex-col md:flex-row gap-2 ${heightClass}`}>
                {/* Available Items Box */}
                <div className="border border-slate-700 rounded-md p-1 overflow-y-auto bg-slate-800 w-full flex flex-col">
                    <p className="text-xs text-slate-500 px-1 pb-1 flex-shrink-0">Available ({unselectedItems.length})</p>
                    <div className="overflow-y-auto">
                        {unselectedItems.map(item => (
                            <button
                                key={item} 
                                type="button"
                                onClick={(e) => handleAvailableClick(e, item)}
                                onDoubleClick={() => handleDoubleClickAvailable(item)} 
                                className={`block w-full text-left text-sm p-1 my-0.5 rounded text-slate-300 truncate transition-colors ${highlightedAvailable.includes(item) ? 'bg-sky-600' : 'hover:bg-slate-700'}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex flex-row md:flex-col justify-center items-center gap-2">
                    <button type="button" onClick={moveAllAvailable} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 hover:text-white transition-colors" aria-label="Move all to right" title="Move all">&gt;&gt;</button>
                    <button type="button" onClick={moveHighlightedAvailable} disabled={highlightedAvailable.length === 0} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 hover:text-white disabled:opacity-50 transition-colors" aria-label="Move selected to right" title="Move selected">&gt;</button>
                    <button type="button" onClick={moveHighlightedSelected} disabled={highlightedSelected.length === 0} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 hover:text-white disabled:opacity-50 transition-colors" aria-label="Move selected to left" title="Remove selected">&lt;</button>
                    <button type="button" onClick={removeAllSelected} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-sky-600 hover:text-white transition-colors" aria-label="Move all to left" title="Remove all">&lt;&lt;</button>
                </div>

                {/* Selected Items Box */}
                <div className="border border-slate-700 rounded-md p-1 overflow-y-auto bg-slate-800 w-full flex flex-col">
                     <p className="text-xs text-slate-500 px-1 pb-1 flex-shrink-0">Selected ({selectedItems.length})</p>
                    <div className="overflow-y-auto">
                        {/* FIX: Create a shallow copy of the selectedItems prop before sorting to prevent direct mutation. */}
                        {[...selectedItems].sort().map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={(e) => handleSelectedClick(e, item)}
                                onDoubleClick={() => handleDoubleClickSelected(item)} 
                                className={`block w-full text-left text-sm p-1 my-0.5 rounded text-sky-300 truncate transition-colors ${highlightedSelected.includes(item) ? 'bg-sky-600 text-white' : 'hover:bg-slate-700'}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Views ---
const DialerMenu: React.FC<{
    onNavigate: (stage: DialerStage) => void;
    onGenerateList: (list: AugmentedSchool[]) => void;
    allAugmentedSchools: AugmentedSchool[];
}> = ({ onNavigate, onGenerateList, allAugmentedSchools }) => {
    
    const handleSurpriseMe = () => {
        const shuffled = [...allAugmentedSchools].sort(() => 0.5 - Math.random());
        onGenerateList(shuffled.slice(0, 10)); // Get 10 random schools
        onNavigate('cardView');
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold text-white mb-6">Dialer</h1>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                <MenuButton title="View All Schools" icon={SchoolIcon} onClick={() => { onGenerateList(allAugmentedSchools); onNavigate('cardView'); }} />
                <MenuButton title="Create Custom List" icon={EditIcon} onClick={() => onNavigate('createList')} />
                <MenuButton title="Load Custom List" icon={FolderIcon} onClick={() => onNavigate('loadList')} />
                <MenuButton title="Surprise Me" icon={ShuffleIcon} onClick={handleSurpriseMe} />
            </div>
        </div>
    );
};

const CreateListView: React.FC<{
    onBack: () => void;
    onGenerate: (list: AugmentedSchool[]) => void;
    allAugmentedSchools: AugmentedSchool[];
    locations: string[];
    currentUser: User;
    initialFilters?: ListFilters;
}> = ({ onBack, onGenerate, allAugmentedSchools, locations, currentUser, initialFilters }) => {
    const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
    const [spokenFilter, setSpokenFilter] = useState<'any' | 'yes' | 'no'>(initialFilters?.spokenFilter || 'any');
    const [selectedLocations, setSelectedLocations] = useState<string[]>(initialFilters?.selectedLocations || []);
    const [selectedEngagements, setSelectedEngagements] = useState<string[]>(initialFilters?.selectedEngagements || []);
    const [dateFilterType, setDateFilterType] = useState<'any' | 'specific' | 'between' | 'before' | 'after' | 'blank'>(initialFilters?.dateFilterType || 'any');
    const [date1, setDate1] = useState(initialFilters?.date1 || '');
    const [date2, setDate2] = useState(initialFilters?.date2 || '');
    const [listName, setListName] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
    
    const engagementLevels = useMemo(() => [
        'Blank', 'CM Not Known', 'CM Confirmed', 'CM Spoken To'
    ], []);

    const filteredList = useMemo(() => {
        const currentFilters: ListFilters = { searchTerm, spokenFilter, selectedLocations, selectedEngagements, dateFilterType, date1, date2 };
        return applyFilters(allAugmentedSchools, currentFilters);
    }, [allAugmentedSchools, searchTerm, selectedLocations, spokenFilter, selectedEngagements, dateFilterType, date1, date2]);

    const listToGenerate = useMemo(() => {
        if (selectedSchools.length > 0) {
            const selectedSchoolSet = new Set(selectedSchools);
            return allAugmentedSchools.filter(s => selectedSchoolSet.has(s.name));
        }
        return filteredList;
    }, [selectedSchools, filteredList, allAugmentedSchools]);

    const handleGenerate = () => {
        onGenerate(listToGenerate);
    };

    const handleSaveList = () => {
        if (!listName.trim()) {
            alert("Please enter a name for the list.");
            return;
        }
        try {
            const storageKey = `customDialerLists_${currentUser.email}`;
            const savedLists: CustomDialerList[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            let staticSchoolIndices: number[] | undefined = undefined;
            if (selectedSchools.length > 0) {
                const selectedSchoolSet = new Set(selectedSchools);
                staticSchoolIndices = allAugmentedSchools
                    .filter(s => selectedSchoolSet.has(s.name))
                    .map(s => s.excelRowIndex);
            }

            const newList: CustomDialerList = {
                id: Date.now(),
                name: listName.trim(),
                filters: { searchTerm, spokenFilter, selectedLocations, selectedEngagements, dateFilterType, date1, date2 },
                staticSchoolIndices,
            };

            const existingIndex = savedLists.findIndex(l => l.name.toLowerCase() === newList.name.toLowerCase());
            if (existingIndex > -1) {
                if(window.confirm(`A list named "${newList.name}" already exists. Overwrite it?`)) {
                    savedLists[existingIndex] = { ...savedLists[existingIndex], filters: newList.filters, staticSchoolIndices: newList.staticSchoolIndices };
                } else {
                    return;
                }
            } else {
                savedLists.push(newList);
            }
            localStorage.setItem(storageKey, JSON.stringify(savedLists));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            console.error("Failed to save list:", e);
        }
    };


    return (
        <div className="p-4 md:p-6 h-full flex flex-col text-white">
            <h1 className="text-2xl font-bold mb-2">Create Custom List</h1>
            <p className="text-slate-400 mb-6 text-sm md:text-base">Use the filters to create a pool of available schools, then move individual schools to the selected list if needed.</p>
            
            <div className="space-y-4 bg-slate-900/50 p-4 md:p-6 rounded-xl border border-slate-700/50 flex-grow overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Search Term (filters available schools)</label>
                        <input type="text" placeholder="Search school or contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-4 pr-4 py-2 w-full bg-slate-800 border border-slate-700 text-white rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Spoken-To Status</label>
                        <select value={spokenFilter} onChange={e => setSpokenFilter(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                            <option value="any">Any</option>
                            <option value="yes">Spoken To</option>
                            <option value="no">Not Spoken To</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Last Called Date</label>
                    <div className="flex flex-wrap items-center gap-2">
                        <select value={dateFilterType} onChange={e => setDateFilterType(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none flex-shrink-0">
                            <option value="any">Any Date</option>
                            <option value="specific">On Date</option>
                            <option value="between">Between</option>
                            <option value="before">Before</option>
                            <option value="after">After</option>
                            <option value="blank">Never Called</option>
                        </select>
                        {['specific', 'before', 'after', 'between'].includes(dateFilterType) && (
                            <input type="text" value={date1} onChange={e => setDate1(autoformatDateInput(e.target.value))} placeholder="DD/MM/YYYY" className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white placeholder-slate-500 flex-grow w-36" />
                        )}
                        {dateFilterType === 'between' && (
                            <>
                                <span className="text-slate-400">and</span>
                                <input type="text" value={date2} onChange={e => setDate2(autoformatDateInput(e.target.value))} placeholder="DD/MM/YYYY" className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white placeholder-slate-500 flex-grow w-36" />
                            </>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DualListBox title="Locations" availableItems={locations} selectedItems={selectedLocations} onSelectionChange={setSelectedLocations} />
                    <DualListBox title="Engagement Levels" availableItems={engagementLevels} selectedItems={selectedEngagements} onSelectionChange={setSelectedEngagements} />
                </div>
                <div className="pt-4 border-t border-slate-700">
                    <DualListBox
                        title="Schools"
                        availableItems={filteredList.map(s => s.name)}
                        selectedItems={selectedSchools}
                        onSelectionChange={setSelectedSchools}
                        heightClass="h-96 md:h-64"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t border-slate-700">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-slate-300 mb-1">List Name</label>
                        <input type="text" placeholder="e.g., 'South London Follow-ups'" value={listName} onChange={e => setListName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none" />
                    </div>
                    <button onClick={handleSaveList} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 min-w-[80px]">
                        {saveStatus === 'saved' ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>
            
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-end justify-between mt-6 gap-4">
                <button onClick={onBack} className="w-full sm:w-auto px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">Back to Menu</button>
                <button onClick={handleGenerate} className="w-full sm:w-auto px-8 py-3 text-lg font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700">
                    Generate List ({listToGenerate.length} Schools)
                </button>
            </div>
        </div>
    );
};

const LoadListView: React.FC<{
    onBack: () => void;
    onLoadList: (list: CustomDialerList) => void;
    currentUser: User;
}> = ({ onBack, onLoadList, currentUser }) => {
    const [savedLists, setSavedLists] = useState<CustomDialerList[]>([]);
    const storageKey = `customDialerLists_${currentUser.email}`;

    useEffect(() => {
        const lists = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setSavedLists(lists);
    }, [storageKey]);

    const handleDelete = (listId: number) => {
        if (window.confirm("Are you sure you want to delete this list?")) {
            const updatedLists = savedLists.filter(l => l.id !== listId);
            localStorage.setItem(storageKey, JSON.stringify(updatedLists));
            setSavedLists(updatedLists);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col text-white max-w-2xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-6">Load Custom List</h1>
            <div className="flex-grow bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 overflow-y-auto">
                {savedLists.length > 0 ? (
                    <ul className="space-y-2">
                        {savedLists.map(list => (
                            <li key={list.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center group">
                                <span className="font-semibold">{list.name}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDelete(list.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onLoadList(list)} className="px-4 py-1.5 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">
                                        Load
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-8">No saved lists found.</p>
                )}
            </div>
            <div className="flex-shrink-0 mt-6">
                 <button onClick={onBack} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">Back to Menu</button>
            </div>
        </div>
    );
};

const EditableField: React.FC<{
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: keyof School;
}> = ({ label, value, isEditing, onChange, name }) => (
    <div className="text-sm">
        <p className="font-semibold text-slate-400">{label}</p>
        {isEditing ? (
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-slate-700 text-white p-1 rounded-md border border-slate-600 focus:ring-sky-500 focus:border-sky-500"
            />
        ) : (
            <p className="text-white truncate">{value || 'N/A'}</p>
        )}
    </div>
);

const SchoolCard: React.FC<{
    school: AugmentedSchool;
    onStartCall: (school: School) => void;
    onOpenSendEmailModal: (school: School) => void;
    onSelectSchool: (school: School) => void;
    onUpdateSchool: (school: School) => Promise<void>;
}> = ({ school, onStartCall, onOpenSendEmailModal, onSelectSchool, onUpdateSchool }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableSchool, setEditableSchool] = useState<AugmentedSchool>(school);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditableSchool(school);
    }, [school]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableSchool(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateSchool(editableSchool);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableSchool(school);
        setIsEditing(false);
    };

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 flex flex-col justify-between h-full text-white">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-white">{school.name}</h2>
                        <p className="text-sm text-slate-400">{school.location}</p>
                    </div>
                    <button onClick={() => onSelectSchool(school)} className="text-xs bg-slate-800 text-slate-300 font-semibold px-3 py-1 rounded-full hover:bg-slate-700 transition-colors">View Profile</button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-3">
                    <EditableField label="Cover Manager" name="coverManager" value={editableSchool.coverManager || ''} isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Contact Number" name="contactNumber" value={editableSchool.contactNumber || ''} isEditing={isEditing} onChange={handleFieldChange} />
                    <div className="col-span-2">
                        <EditableField label="Email Name" name="emailName" value={editableSchool.emailName || ''} isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold text-slate-400">Last Called</p>
                        <p className="text-white truncate">{school.lastCalledDate?.split(' ')[0] || 'Never'}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold text-slate-400">Spoken To</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${school.spokeToCoverManager ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            {school.spokeToCoverManager ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                     <p className="text-sm text-slate-300 line-clamp-2" title={school.latestNote}>
                        <span className="font-semibold text-slate-400">Last Note: </span>
                        {school.latestNote || 'No notes yet.'}
                    </p>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="w-full text-sm bg-slate-700 text-slate-300 font-bold py-2 rounded-lg hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                            {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Save'}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors" title="Edit School Details">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onOpenSendEmailModal(school)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors" title="Send Email">
                            <EmailIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onStartCall(school)} className="w-full flex items-center justify-center bg-sky-600 text-white font-bold py-2 rounded-lg hover:bg-sky-700 transition-colors">
                            <PhoneOutgoingIcon className="w-5 h-5 mr-2" /> Call
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const CallListView: React.FC<{
    list: AugmentedSchool[];
    onBack: () => void;
    onSaveList: () => void;
    onStartCall: (school: School) => void;
    onOpenSendEmailModal: (school: School) => void;
    onSelectSchool: (school: School) => void;
    onUpdateSchool: (school: School) => Promise<void>;
}> = ({ list, onBack, onSaveList, ...props }) => {
    if (list.length === 0) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                 <h1 className="text-2xl font-bold text-white mb-2">No Schools Found</h1>
                 <p className="text-slate-400 mb-6">Your filter criteria did not match any schools.</p>
                 <button onClick={onBack} className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">Back to List Creation</button>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <button onClick={onBack} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">Back</button>
                 <p className="font-bold text-white">Viewing {list.length} Schools</p>
                 <button onClick={onSaveList} className="px-4 py-2 text-sm font-semibold text-sky-300 bg-sky-500/20 rounded-lg hover:bg-sky-500/30">Save List</button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map(school => (
                        <SchoolCard key={school.excelRowIndex} school={school} {...props} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ActiveCallView: React.FC<Omit<CallsDialerPageProps, 'schools' | 'notes' | 'callLogs' | 'currentUser'>> = (props) => {
    const { activeCall, elapsedTime, onEndAndLogCall, activeCallNotes, setActiveCallNotes, onOpenSendEmailModal, onUpdateSchool, transcription, isTranscribing, startTranscription, stopTranscription } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [editableSchool, setEditableSchool] = useState(activeCall?.school);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (activeCall) {
            setEditableSchool(activeCall.school);
        }
    }, [activeCall]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editableSchool) return;
        setEditableSchool(prev => ({ ...prev!, [e.target.name]: e.target.value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editableSchool) return;
        setEditableSchool(prev => ({ ...prev!, [e.target.name]: e.target.checked }));
    };

    const handleSave = async () => {
        if (!editableSchool) return;
        setIsSaving(true);
        await onUpdateSchool(editableSchool);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (activeCall) setEditableSchool(activeCall.school);
        setIsEditing(false);
    };

    if (!activeCall || !editableSchool) return null;

    return (
         <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4 flex flex-col flex-grow overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
                    {/* Left Column: Call Controls */}
                    <div className="flex flex-col gap-4 h-full overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="text-left">
                                <h2 className="text-2xl font-bold text-white">{activeCall.school.name}</h2>
                                <p className="text-slate-400">In call with {activeCall.school.coverManager || 'contact'}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-7xl font-mono font-bold text-sky-400">{formatTime(elapsedTime)}</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg flex flex-col flex-grow overflow-hidden">
                            <label className="text-sm font-semibold text-slate-300 flex-shrink-0">Notes</label>
                            <textarea value={activeCallNotes} onChange={(e) => setActiveCallNotes(e.target.value)} className="w-full h-full bg-transparent text-slate-200 resize-none outline-none mt-2 flex-grow" placeholder="Start typing..."/>
                        </div>
                         <div className="bg-slate-800 p-3 rounded-lg flex flex-col flex-grow overflow-hidden">
                            <label className="text-sm font-semibold text-slate-300 flex-shrink-0">Live Transcript</label>
                            <div className="w-full h-full bg-transparent text-slate-200 overflow-y-auto mt-2 text-sm flex-grow">{transcription || 'Transcription will appear here...'}</div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                             <button
                                type="button"
                                onClick={isTranscribing ? stopTranscription : startTranscription}
                                className={`w-full flex items-center justify-center py-2.5 rounded-lg font-semibold transition-colors ${
                                    isTranscribing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {isTranscribing ? <StopIcon className="w-5 h-5 mr-2"/> : <MicIcon className="w-5 h-5 mr-2"/>}
                                {isTranscribing ? 'Stop' : 'Start'}
                            </button>
                            <button onClick={onEndAndLogCall} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600">
                                End & Log Call
                            </button>
                        </div>
                    </div>

                    {/* Right Column: School Details */}
                    <div className="bg-slate-800 rounded-lg p-4 flex flex-col gap-3 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">School Details</h3>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={handleCancel} className="text-xs font-semibold bg-slate-600 text-slate-200 px-3 py-1 rounded-md">Cancel</button>
                                    <button onClick={handleSave} disabled={isSaving} className="text-xs font-semibold bg-emerald-500 text-white px-3 py-1 rounded-md">{isSaving ? <SpinnerIcon className="w-4 h-4" /> : 'Save'}</button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="text-xs font-semibold bg-slate-700 text-slate-300 px-3 py-1 rounded-md">Edit</button>
                            )}
                        </div>
                        <EditableField label="Cover Manager" name="coverManager" value={editableSchool.coverManager || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Contact Number" name="contactNumber" value={editableSchool.contactNumber || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Primary Email" name="email" value={editableSchool.email || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Contact 2 Name" name="contact2" value={editableSchool.contact2 || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Contact 2 Email" name="contact2Email" value={editableSchool.contact2Email || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Email Name" name="emailName" value={editableSchool.emailName || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Switchboard" name="switchboard" value={editableSchool.switchboard || ''} isEditing={isEditing} onChange={handleFieldChange} />
                        <EditableField label="Website" name="website" value={editableSchool.website || ''} isEditing={isEditing} onChange={handleFieldChange} />
                         <div className="flex items-center gap-2">
                            <input id="spokeToManager" name="spokeToCoverManager" type="checkbox" checked={editableSchool.spokeToCoverManager} onChange={handleCheckboxChange} disabled={!isEditing} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="spokeToManager" className="text-sm">Spoke to Cover Manager</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SaveListModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName?: string;
}> = ({ isOpen, onClose, onSave, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [status, setStatus] = useState<'idle' | 'saving'>('idle');

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setStatus('idle');
        }
    }, [isOpen, initialName]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            alert("Please provide a name for the list.");
            return;
        }
        setStatus('saving');
        onSave(name.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-white mb-4">Save List</h2>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">List Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" 
                        placeholder="e.g., 'Random Monday Calls'" 
                        required 
                    />
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSave} disabled={status === 'saving'} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[80px] justify-center">
                        {status === 'saving' ? <SpinnerIcon className="w-5 h-5"/> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CallsDialerPage: React.FC<CallsDialerPageProps> = (props) => {
    const [stage, setStage] = useState<DialerStage>('menu');
    const [currentList, setCurrentList] = useState<AugmentedSchool[]>([]);
    const [filtersForCreateList, setFiltersForCreateList] = useState<ListFilters | undefined>();
    const [isSaveListModalOpen, setIsSaveListModalOpen] = useState(false);

    const { schools, notes, callLogs, activeCall, currentUser } = props;

    const allAugmentedSchools = useMemo(() => {
        const lastCallMap: { [key: string]: string } = {};
        const sortedCallLogs = [...callLogs].sort((a,b) => (parseUKDateTimeString(b.dateCalled)?.getTime() || 0) - (parseUKDateTimeString(a.dateCalled)?.getTime() || 0));
        sortedCallLogs.forEach(log => {
            if (!lastCallMap[log.schoolName]) lastCallMap[log.schoolName] = log.dateCalled;
        });

        const latestNoteMap: { [key: string]: string } = {};
        const sortedNotes = [...notes].sort((a,b) => (parseUKDateTimeString(b.date)?.getTime() || 0) - (parseUKDateTimeString(a.date)?.getTime() || 0));
        sortedNotes.forEach(note => {
            if (!latestNoteMap[note.schoolName]) latestNoteMap[note.schoolName] = note.note;
        });

        return schools.map(school => ({
            ...school,
            lastCalledDate: lastCallMap[school.name],
            latestNote: latestNoteMap[school.name],
        }));
    }, [schools, callLogs, notes]);
    
    useEffect(() => {
        setCurrentList(prevList => {
            return prevList.map(oldSchool => {
                const newSchoolData = allAugmentedSchools.find(s => s.excelRowIndex === oldSchool.excelRowIndex);
                return newSchoolData ? newSchoolData : oldSchool;
            });
        });
    }, [allAugmentedSchools]);

    const handleLocalUpdateSchool = async (updatedSchool: School) => {
        await props.onUpdateSchool(updatedSchool);
    };

    const locations = useMemo(() => [...new Set(schools.map(s => s.location).filter(Boolean))].sort(), [schools]);

    const handleGenerateList = (list: AugmentedSchool[]) => {
        setCurrentList(list);
        setFiltersForCreateList(undefined); // Clear filters after generating
        setStage('cardView');
    };

    const handleSaveStaticList = (listName: string) => {
        try {
            const storageKey = `customDialerLists_${currentUser.email}`;
            const savedLists: CustomDialerList[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newList: CustomDialerList = {
                id: Date.now(),
                name: listName.trim(),
                staticSchoolIndices: currentList.map(s => s.excelRowIndex),
                filters: { 
                    searchTerm: '',
                    spokenFilter: 'any',
                    selectedLocations: [],
                    selectedEngagements: [],
                }
            };
    
            const existingIndex = savedLists.findIndex(l => l.name.toLowerCase() === newList.name.toLowerCase());
            if (existingIndex > -1) {
                if (window.confirm(`A list named "${newList.name}" already exists. Overwrite it?`)) {
                    savedLists[existingIndex] = { ...savedLists[existingIndex], ...newList, id: savedLists[existingIndex].id };
                } else {
                    return;
                }
            } else {
                savedLists.push(newList);
            }
    
            localStorage.setItem(storageKey, JSON.stringify(savedLists));
            setIsSaveListModalOpen(false);
        } catch (e) {
            console.error("Failed to save static list:", e);
            alert("Failed to save the list.");
        }
    };

    const handleLoadList = (list: CustomDialerList) => {
        if (list.staticSchoolIndices && list.staticSchoolIndices.length > 0) {
            const staticListSchools = allAugmentedSchools.filter(s => list.staticSchoolIndices!.includes(s.excelRowIndex));
            handleGenerateList(staticListSchools);
        } else if (list.filters) {
            const dynamicListSchools = applyFilters(allAugmentedSchools, list.filters);
            handleGenerateList(dynamicListSchools);
        } else {
            console.warn("Loaded list has no static indices or filters.");
            setStage('menu');
        }
    };

    const handleBackToMenu = () => {
        setFiltersForCreateList(undefined);
        setStage('menu');
    }

    if (activeCall) {
        return <ActiveCallView {...props} onUpdateSchool={handleLocalUpdateSchool} />;
    }

    return (
        <>
            {isSaveListModalOpen && (
                <SaveListModal 
                    isOpen={isSaveListModalOpen} 
                    onClose={() => setIsSaveListModalOpen(false)}
                    onSave={handleSaveStaticList}
                />
            )}
            {(() => {
                switch (stage) {
                    case 'createList':
                        return <CreateListView onBack={handleBackToMenu} onGenerate={handleGenerateList} allAugmentedSchools={allAugmentedSchools} locations={locations} currentUser={currentUser} initialFilters={filtersForCreateList} />;
                    case 'loadList':
                        return <LoadListView onBack={handleBackToMenu} onLoadList={handleLoadList} currentUser={currentUser} />;
                    case 'cardView':
                        return <CallListView list={currentList} onBack={() => setStage('menu')} onSaveList={() => setIsSaveListModalOpen(true)} {...props} onUpdateSchool={handleLocalUpdateSchool} />;
                    case 'menu':
                    default:
                        return <DialerMenu onNavigate={setStage} onGenerateList={handleGenerateList} allAugmentedSchools={allAugmentedSchools} />;
                }
            })()}
        </>
    );
};

export default CallsDialerPage;