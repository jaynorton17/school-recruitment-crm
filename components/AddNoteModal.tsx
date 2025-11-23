import React, { useState, useEffect } from 'react';
import { School, Note } from '../types';
import { SpinnerIcon } from './icons';

interface AddNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {note: string, schoolName?: string}) => Promise<void>;
    school?: School | null;
    schools?: School[];
    noteToEdit?: Note | null;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({isOpen, onClose, onSubmit, school, schools, noteToEdit}) => {
    const [note, setNote] = useState('');
    const [selectedSchoolName, setSelectedSchoolName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!noteToEdit;

    useEffect(() => {
        if (isOpen) {
            setNote(noteToEdit?.note || '');
            setSelectedSchoolName(noteToEdit?.schoolName || school?.name || '');
            setIsSubmitting(false);
        }
    }, [isOpen, school, noteToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim() || (!school && !selectedSchoolName && !isEditMode)) {
            alert("A note and school selection are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ note, schoolName: selectedSchoolName });
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">{isEditMode ? 'Edit Note' : 'Add New Note'}</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">School</label>
                        {(school || isEditMode) ? (
                             <input type="text" value={selectedSchoolName} disabled className="w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-slate-400 cursor-not-allowed" />
                        ) : (
                            <select value={selectedSchoolName} onChange={(e) => setSelectedSchoolName(e.target.value)} className="w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required>
                                <option value="" disabled>Select a school</option>
                                {schools?.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Note</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={5} className="w-full p-2 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-slate-900 text-white" placeholder="Type your note here..." required></textarea>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !note.trim() || (!school && !selectedSchoolName && !isEditMode)} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : (isEditMode ? 'Save Changes' : 'Save Note')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNoteModal;