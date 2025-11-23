import React, { useState } from 'react';
import { SpinnerIcon } from './icons';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string, message: string }) => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert("Title and message cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        onSubmit({ title, message });
        // Reset state after submission
        setTitle('');
        setMessage('');
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Create Announcement</h2>
                    
                    <div>
                        <label htmlFor="announcement-title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            id="announcement-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-2 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-slate-900 text-white"
                            placeholder="e.g., System Maintenance"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="announcement-message" className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                        <textarea 
                            id="announcement-message"
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            rows={6} 
                            className="w-full p-2 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-slate-900 text-white" 
                            placeholder="Type your announcement here..." 
                            required
                        ></textarea>
                        <p className="text-xs text-slate-500 mt-1">This message will be shown to all users when they next log in.</p>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !message.trim()} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Post Announcement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;