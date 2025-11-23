import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityNote, User } from '../types';
import { EditIcon, TrashIcon, SpinnerIcon, CheckIcon, AddIcon, NotesIcon } from './icons';

interface OpportunityDetailPageProps {
    opportunity: Opportunity;
    users: User[];
    currentUser: { name: string; email: string; };
    onUpdateOpportunity: (opp: Opportunity) => void;
    onDeleteOpportunity: (opp: Opportunity) => void;
    onAddNote: (opp: Opportunity, note: OpportunityNote) => void;
    onBack: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number; isEditing?: boolean; children?: React.ReactNode }> = ({ label, value, children, isEditing }) => (
    <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {children ? (
             <div className={`mt-1 ${isEditing ? '' : 'text-slate-200 font-medium'}`}>{children}</div>
        ) : (
            <p className="text-slate-200 font-medium truncate">{value || '—'}</p>
        )}
    </div>
);

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ opportunity, users, currentUser, onUpdateOpportunity, onDeleteOpportunity, onAddNote, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableOpp, setEditableOpp] = useState<Opportunity>(opportunity);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        setEditableOpp(opportunity);
        setIsEditing(false);
    }, [opportunity]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableOpp(prev => ({ ...prev, [name]: value }));
        setSaveState('idle');
    };

    const handleSaveChanges = async () => {
        setSaveState('saving');
        await onUpdateOpportunity(editableOpp);
        setSaveState('saved');
        setIsEditing(false);
        setTimeout(() => setSaveState('idle'), 2000);
    };

    const handleCancelEdit = () => {
        setEditableOpp(opportunity);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the opportunity "${opportunity.name}"?`)) {
            onDeleteOpportunity(opportunity);
        }
    };
    
    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note: OpportunityNote = {
            author: currentUser.name,
            date: new Date().toISOString(),
            note: newNote.trim()
        };
        onAddNote(opportunity, note);
        setNewNote('');
    };

    const progressPercentage = parseFloat(opportunity.progressStage.split('%')[0]);

    return (
        <div className="p-4 md:p-6 bg-slate-800 text-slate-200 h-full flex flex-col gap-6">
             <div className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-700 flex-shrink-0">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                         <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{opportunity.name}</h1>
                            <p className="text-slate-400 mt-1">{opportunity.schoolName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                         {isEditing ? (
                            <>
                                <button onClick={handleCancelEdit} className="flex items-center bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                                <button onClick={handleSaveChanges} disabled={saveState !== 'idle'} className="flex items-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-70 min-w-[140px] justify-center">
                                    {saveState === 'saving' && <SpinnerIcon className="w-5 h-5"/>}
                                    {saveState === 'saved' && <><CheckIcon className="w-5 h-5 mr-2"/> Saved!</>}
                                    {saveState === 'idle' && 'Save Changes'}
                                </button>
                            </>
                        ) : (
                             <>
                                <button onClick={handleDelete} className="flex items-center bg-red-500/10 text-red-400 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors">
                                    <TrashIcon className="w-5 h-5 mr-2" />Delete
                                </button>
                                <button onClick={() => setIsEditing(true)} className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                                    <EditIcon className="w-5 h-5 mr-2" />Edit
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4 border-t border-slate-700 pt-4">
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                        <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold text-white">{opportunity.progressStage}</span>
                    </div>
                </div>
                
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mt-4 border-t border-slate-700 pt-4">
                    <DetailItem label="Created On" value={opportunity.dateCreated} />
                    <DetailItem label="Account Manager" isEditing={isEditing}>
                        {isEditing ? (
                             <select name="accountManager" value={editableOpp.accountManager} onChange={handleFieldChange} className="w-full bg-slate-700 p-1 rounded-md text-sm">
                                {users.map(u => <option key={u.email} value={u.name}>{u.name}</option>)}
                             </select>
                        ) : opportunity.accountManager}
                    </DetailItem>
                </div>
            </div>

            {/* Notes Section */}
            <div className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-700 flex-grow flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><NotesIcon className="w-5 h-5"/> Notes Chain</h2>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4">
                    {opportunity.notes && opportunity.notes.length > 0 ? (
                        opportunity.notes.map((note, index) => (
                            <div key={index} className="p-3 bg-slate-800 rounded-lg">
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="font-semibold text-slate-300">{note.author}</p>
                                    <p className="text-xs text-slate-500">{new Date(note.date).toLocaleString('en-GB')}</p>
                                </div>
                                <p className="text-sm text-slate-400 whitespace-pre-wrap">{note.note}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 pt-8">No notes for this opportunity yet.</p>
                    )}
                </div>
                 <div className="flex-shrink-0 flex items-start gap-2 pt-4 border-t border-slate-700">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a new note..." rows={2} className="w-full p-2 border border-slate-600 rounded-md bg-slate-800 text-white focus:ring-sky-500 focus:border-sky-500"></textarea>
                    <button onClick={handleAddNote} className="flex items-center justify-center bg-sky-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                        <AddIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default OpportunityDetailPage;
