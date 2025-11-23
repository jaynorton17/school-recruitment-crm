import React from 'react';
import { Announcement } from '../types';
import { MegaphoneIcon } from './icons';

interface ViewAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: Announcement;
    onAcknowledge: () => void;
}

const ViewAnnouncementModal: React.FC<ViewAnnouncementModalProps> = ({ isOpen, onClose, announcement, onAcknowledge }) => {

    if (!isOpen) return null;

    const handleAcknowledge = () => {
        onAcknowledge();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <div className="flex items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <MegaphoneIcon className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{announcement.title}</h2>
                        <p className="text-sm text-slate-400">From {announcement.author} on {announcement.createdAt}</p>
                    </div>
                </div>

                <div className="my-4 max-h-64 overflow-y-auto p-4 bg-slate-900 rounded-md border border-slate-700">
                    <p className="text-slate-300 whitespace-pre-wrap">{announcement.message}</p>
                </div>
                
                <div className="flex justify-end items-center mt-6 space-x-3">
                     <button 
                        onClick={onClose} 
                        className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
                    >
                        See again
                    </button>
                    <button 
                        onClick={handleAcknowledge} 
                        className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewAnnouncementModal;