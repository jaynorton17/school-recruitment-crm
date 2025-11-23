import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons';

interface AddEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {subject: string, body: string}) => Promise<void>;
}

const AddEmailModal: React.FC<AddEmailModalProps> = ({isOpen, onClose, onSubmit}) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setBody('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !body.trim()) return;
        setIsSubmitting(true);
        await onSubmit({ subject, body });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Log New Email</h2>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Subject</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Body</label>
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} className="mt-1 w-full p-2 border border-slate-300 rounded-md" required></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Save Email Log'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmailModal;
