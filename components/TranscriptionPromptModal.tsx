import React from 'react';

interface TranscriptionPromptModalProps {
    isOpen: boolean;
    onResponse: (transcribe: boolean) => void;
    schoolName: string;
}

const TranscriptionPromptModal: React.FC<TranscriptionPromptModalProps> = ({ isOpen, onResponse, schoolName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Transcribe Call?</h2>
                <p className="text-slate-600 mb-6">
                    Would you like to transcribe your side of the conversation for this call to {schoolName}?
                </p>
                <div className="flex justify-center space-x-4">
                    <button onClick={() => onResponse(false)} className="px-8 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        No
                    </button>
                    <button onClick={() => onResponse(true)} className="px-8 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TranscriptionPromptModal;