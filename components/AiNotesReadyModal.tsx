import React from 'react';
import { NotesIcon, SchoolIcon } from './icons';

interface AiNotesReadyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onView: () => void;
    notes: string;
    schoolName: string;
}

const AiNotesReadyModal: React.FC<AiNotesReadyModalProps> = ({ isOpen, onClose, onView, notes, schoolName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg m-4">
                <div className="flex items-start">
                    <div className="mr-4 flex-shrink-0">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                            <NotesIcon className="h-6 w-6 text-sky-600" aria-hidden="true" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">AI Notes Saved</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            A summary has been generated and saved for your call with {schoolName}.
                        </p>
                    </div>
                </div>
                
                <div className="my-4 max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{notes}</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                    >
                        OK
                    </button>
                    <button 
                        onClick={onView}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                       <SchoolIcon className="w-4 h-4 mr-2" />
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiNotesReadyModal;