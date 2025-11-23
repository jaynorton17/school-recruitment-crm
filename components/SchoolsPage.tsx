

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { School } from '../types';
import { AddIcon, SearchIcon, SpinnerIcon, PhoneOutgoingIcon, RefreshIcon, CheckIcon, StarIcon } from './icons';
import { parseUKDate } from '../utils';

interface SchoolsPageProps {
  schools: School[];
  onAddSchool: (school: Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>) => void;
  onBulkAddSchools: (schools: Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>[]) => Promise<{success: number, failed: number}>;
  onSelectSchool: (school: School) => void;
  onStartCall: (school: School) => void;
  onToggleSpokenStatus: (school: School) => void;
  onAddToPriorityQueue: (schoolName: string) => void; // This prop is kept but not used in the UI per the design
}

const AddSchoolModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddSchool: (school: Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>) => void;
}> = ({ isOpen, onClose, onAddSchool }) => {
    const [formData, setFormData] = useState<Partial<School>>({});

    useEffect(() => {
        if (!isOpen) {
            setFormData({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.accountManager) {
            alert("School Name and Account Manager are required.");
            return;
        }
        onAddSchool(formData as Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>);
    };

    const fields: (keyof School)[] = ['name', 'location', 'contactNumber', 'accountManager', 'coverManager', 'email', 'contact2', 'contact2Email', 'emailName', 'switchboard'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">Add New School</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                             <div key={field}>
                                <label htmlFor={field} className="block text-sm font-medium text-slate-400 capitalize">
                                    {String(field).replace(/([A-Z])/g, ' $1')}
                                </label>
                                <input
                                    type="text"
                                    id={field}
                                    name={field}
                                    value={(formData[field] as string) || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-white
                                        focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-slate-800">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 min-w-[100px]">
                            Add School
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const BulkUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBulkAddSchools: (schools: Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>[]) => Promise<{success: number, failed: number}>;
}> = ({ isOpen, onClose, onBulkAddSchools }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<{success: number, failed: number} | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setError(null);
            setIsSubmitting(false);
            setUploadResult(null);
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a CSV file to upload.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setUploadResult(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split('\n').map(row => row.trim()).filter(row => row);
                if (rows.length < 2) throw new Error("CSV file is empty or contains only a header.");

                const header = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
                const requiredHeaders = ['school name', 'location', 'account manager'];
                const missingHeaders = requiredHeaders.filter(rh => !header.includes(rh));
                if (missingHeaders.length > 0) throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}.`);
                
                const colMap: { [key in keyof Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>]?: number } = {
                    name: header.indexOf('school name'),
                    location: header.indexOf('location'),
                    accountManager: header.indexOf('account manager'),
                    contactNumber: header.indexOf('contact number'),
                    coverManager: header.indexOf('cover manager'),
                    email: header.indexOf('email'),
                    contact2: header.indexOf('contact 2'),
                    contact2Email: header.indexOf('contact 2 email'),
                    emailName: header.indexOf('email name'),
                    switchboard: header.indexOf('switchboard'),
                };

                const schoolsToAdd: Omit<School, 'excelRowIndex' | 'spokeToCoverManager'>[] = [];
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
                    const name = values[colMap.name!];
                    const location = values[colMap.location!];
                    const accountManager = values[colMap.accountManager!];
                    
                    if (name && location && accountManager) {
                         schoolsToAdd.push({
                            name, location, accountManager,
                            contactNumber: values[colMap.contactNumber!] || '',
                            coverManager: values[colMap.coverManager!] || '',
                            email: values[colMap.email!] || '',
                            contact2: values[colMap.contact2!] || '',
                            contact2Email: values[colMap.contact2Email!] || '',
                            emailName: values[colMap.emailName!] || '',
                            switchboard: values[colMap.switchboard!] || '',
                        });
                    }
                }
                if (schoolsToAdd.length === 0) throw new Error("No valid school entries found in the file.");

                const result = await onBulkAddSchools(schoolsToAdd);
                setUploadResult(result);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsSubmitting(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Bulk Upload Schools</h2>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Upload a CSV file. Required: <strong>School name</strong>, <strong>Location</strong>, <strong>Account manager</strong>. Other columns: contact number, cover manager, email, email name, switchboard, etc.
                    </p>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500/10 file:text-sky-300 hover:file:bg-sky-500/20" />
                    {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md">{error}</p>}
                    {uploadResult && <p className="text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-md">Successfully added {uploadResult.success} schools. {uploadResult.failed > 0 ? `${uploadResult.failed} failed.` : ''}</p>}
                </div>
                <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">
                        {uploadResult ? 'Close' : 'Cancel'}
                    </button>
                    <button type="button" disabled={isSubmitting || !!uploadResult} onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[100px] justify-center">
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EngagementBadge: React.FC<{ score?: School['engagementScore'] }> = ({ score }) => {
    if (!score) return null;
    const styles: { [key in Exclude<School['engagementScore'], undefined | ''>]: string } = {
        'CM Not Known': 'bg-slate-700 text-slate-300',
        'CM Confirmed': 'bg-sky-500/20 text-sky-300',
        'CM Spoken To': 'bg-emerald-500/20 text-emerald-300',
    };
    const styleClass = styles[score as keyof typeof styles];
    if (!styleClass) return null;

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styleClass}`}>
            {score}
        </span>
    );
};

const SchoolsPage: React.FC<SchoolsPageProps> = ({ schools, onAddSchool, onBulkAddSchools, onSelectSchool, onStartCall, onToggleSpokenStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [spokenFilter, setSpokenFilter] = useState<'any' | 'yes' | 'no'>('any');
    const [engagementFilter, setEngagementFilter] = useState<'any' | '' | 'CM Not Known' | 'CM Confirmed' | 'CM Spoken To'>('any');
    const [sortConfig, setSortConfig] = useState<{ key: keyof School; direction: 'asc' | 'desc' } | null>({ key: 'lastCalledDate', direction: 'desc' });

    const locations = useMemo(() => [...new Set(schools.map(s => s.location).filter(Boolean))].sort(), [schools]);

    const filteredAndSortedSchools = useMemo(() => {
        let filtered = schools;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(school => 
                (school.name || '').toLowerCase().includes(lowercasedTerm) ||
                (school.location || '').toLowerCase().includes(lowercasedTerm) ||
                (school.contactNumber || '').toLowerCase().includes(lowercasedTerm) ||
                (school.switchboard || '').toLowerCase().includes(lowercasedTerm) ||
                (school.coverManager || '').toLowerCase().includes(lowercasedTerm) ||
                (school.contact2 || '').toLowerCase().includes(lowercasedTerm) ||
                (school.email || '').toLowerCase().includes(lowercasedTerm) ||
                (school.contact2Email || '').toLowerCase().includes(lowercasedTerm)
            );
        }
        if (locationFilter) {
            filtered = filtered.filter(school => school.location === locationFilter);
        }
    
        if (spokenFilter !== 'any') {
            const spokenValue = spokenFilter === 'yes';
            filtered = filtered.filter(school => school.spokeToCoverManager === spokenValue);
        }

        if (engagementFilter !== 'any') {
            filtered = filtered.filter(school => (school.engagementScore || '') === engagementFilter);
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                if (sortConfig.key === 'lastCalledDate') {
                    const dateA = a.lastCalledDate ? parseUKDate(a.lastCalledDate)?.getTime() || 0 : 0;
                    const dateB = b.lastCalledDate ? parseUKDate(b.lastCalledDate)?.getTime() || 0 : 0;
                    if (dateA === 0 && dateB === 0) return 0;
                    if (dateA === 0) return 1;
                    if (dateB === 0) return -1;
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - a;
                }

                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    if (aValue === bValue) return 0;
                    if (sortConfig.direction === 'asc') {
                        return aValue ? 1 : -1;
                    }
                    return bValue ? 1 : -1;
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
    }, [schools, searchTerm, locationFilter, spokenFilter, engagementFilter, sortConfig]);

    const handleSort = (key: keyof School) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ label: string; sortKey: keyof School; }> = ({ label, sortKey }) => {
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
            <AddSchoolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddSchool={onAddSchool} />
            <BulkUploadModal isOpen={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} onBulkAddSchools={onBulkAddSchools} />

            <div className="flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Schools ({filteredAndSortedSchools.length})</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsBulkUploadModalOpen(true)} className="flex items-center text-sm bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                            Bulk Upload
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                            <AddIcon className="w-5 h-5 mr-2"/>
                            Add School
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 flex-shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 items-center">
                <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                    <input type="text" placeholder="Search schools or contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-slate-800 border border-slate-700 text-white rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                </div>
                <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="">All Locations</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select value={spokenFilter} onChange={e => setSpokenFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="any">Spoken Status</option>
                    <option value="yes">Spoken To</option>
                    <option value="no">Not Spoken To</option>
                </select>
                <select value={engagementFilter} onChange={e => setEngagementFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                    <option value="any">All Engagement</option>
                    <option value="">Blank</option>
                    <option value="CM Not Known">CM Not Known</option>
                    <option value="CM Confirmed">CM Confirmed</option>
                    <option value="CM Spoken To">CM Spoken To</option>
                </select>
            </div>
            
            <div className="flex-grow bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-auto h-full">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="bg-slate-800 text-xs text-slate-300 uppercase sticky top-0">
                                <tr>
                                    <SortableHeader label="School Name" sortKey="name" />
                                    <SortableHeader label="Location" sortKey="location" />
                                    <SortableHeader label="Account Manager" sortKey="accountManager" />
                                    <SortableHeader label="Cover Manager" sortKey="coverManager" />
                                    <SortableHeader label="Last Called" sortKey="lastCalledDate" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Spoken To" sortKey="spokeToCoverManager" />
                                    <th scope="col" className="px-6 py-3">Engagement</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredAndSortedSchools.map(school => (
                                    <tr key={school.excelRowIndex} className="hover:bg-slate-800/50 group">
                                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <button onClick={() => onSelectSchool(school)} className="text-sky-400 hover:underline">{school.name}</button>
                                        </th>
                                        <td className="px-6 py-4">{school.location}</td>
                                        <td className="px-6 py-4">{school.accountManager}</td>
                                        <td className="px-6 py-4">{school.coverManager || 'N/A'}</td>
                                        <td className="px-6 py-4">{school.lastCalledDate?.split(' ')[0] || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            {school.status && school.status.toLowerCase().includes('client') ? (
                                                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 font-semibold px-2 py-1 rounded-full text-xs">
                                                    <StarIcon className="w-3 h-3 text-amber-400" />
                                                    Client
                                                </span>
                                            ) : (
                                                <span>{school.status}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => onToggleSpokenStatus(school)} className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${school.spokeToCoverManager ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-700 border-slate-600'}`}>
                                                {school.spokeToCoverManager && <CheckIcon className="w-4 h-4 text-white" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4"><EngagementBadge score={school.engagementScore} /></td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => onStartCall(school)} className="p-2 rounded-full hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Start Call">
                                                <PhoneOutgoingIcon className="w-5 h-5 text-emerald-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 p-2">
                        {filteredAndSortedSchools.map(school => (
                            <div key={school.excelRowIndex} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <button onClick={() => onSelectSchool(school)} className="font-bold text-sky-400 text-lg text-left hover:underline">{school.name}</button>
                                        <p className="text-sm text-slate-400">{school.location}</p>
                                    </div>
                                    <button onClick={() => onStartCall(school)} className="p-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors flex-shrink-0 ml-2" title="Start Call">
                                        <PhoneOutgoingIcon className="w-5 h-5 text-emerald-400" />
                                    </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500">Cover Manager</p>
                                        <p className="text-slate-200 truncate">{school.coverManager || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => onToggleSpokenStatus(school)} className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${school.spokeToCoverManager ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-700 border-slate-600'}`}>
                                            {school.spokeToCoverManager && <CheckIcon className="w-4 h-4 text-white" />}
                                        </button>
                                        <span className="text-sm text-slate-300">Spoken To</span>
                                    </div>
                                </div>
                                {(school.lastCalledDate || school.engagementScore || (school.status && school.status.toLowerCase().includes('client'))) && (
                                     <div className="mt-2 text-xs text-slate-500 flex items-center flex-wrap gap-x-4 gap-y-2">
                                        {school.status && school.status.toLowerCase().includes('client') && (
                                            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 font-semibold px-2 py-1 rounded-full text-xs">
                                                <StarIcon className="w-3 h-3 text-amber-400" />
                                                Client
                                            </span>
                                        )}
                                        {school.lastCalledDate && <span>Last Called: {school.lastCalledDate.split(' ')[0]}</span>}
                                        {school.engagementScore && <EngagementBadge score={school.engagementScore} />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredAndSortedSchools.length === 0 && (
                        <div className="text-center p-8 text-slate-500">No schools match the current filters.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolsPage;