import React, { useState, useEffect } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { SpinnerIcon, SharePointIcon, CloseIcon } from './icons';
import SharePointFilePickerModal from './SharePointFilePickerModal';
import { createShareLink } from '../graph';

interface AttachDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAttach: (docType: 'cv' | 'dbs', url: string) => void;
    msalInstance: PublicClientApplication;
    account: AccountInfo;
}

const AttachDocumentModal: React.FC<AttachDocumentModalProps> = ({ isOpen, onClose, onAttach, msalInstance, account }) => {
    const [docType, setDocType] = useState<'cv' | 'dbs'>('cv');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDocType('cv');
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = async (files: any[]) => {
        setIsPickerOpen(false);
        if (files.length === 0) return;

        const file = files[0];
        setIsProcessing(true);

        try {
            const shareUrl = await createShareLink(msalInstance, account, file.parentReference.driveId, file.id);
            if (shareUrl) {
                onAttach(docType, shareUrl);
                onClose();
            } else {
                throw new Error("Could not create a shareable link for the selected document.");
            }
        } catch (error: any) {
            alert(`Failed to attach document: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <SharePointFilePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleFileSelect}
                msalInstance={msalInstance}
                account={account}
            />
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Attach Document</h2>
                        <button onClick={onClose} disabled={isProcessing} className="p-1 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                            <SpinnerIcon className="w-8 h-8 mb-4" />
                            <p>Attaching document...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">1. Select Document Type</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${docType === 'cv' ? 'bg-sky-500/20 border-sky-500' : 'border-slate-600 hover:bg-slate-700'}`}>
                                        <input type="radio" name="docType" value="cv" checked={docType === 'cv'} onChange={() => setDocType('cv')} className="sr-only" />
                                        <span className={`font-semibold ${docType === 'cv' ? 'text-sky-300' : 'text-slate-300'}`}>CV / Resume</span>
                                    </label>
                                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${docType === 'dbs' ? 'bg-sky-500/20 border-sky-500' : 'border-slate-600 hover:bg-slate-700'}`}>
                                        <input type="radio" name="docType" value="dbs" checked={docType === 'dbs'} onChange={() => setDocType('dbs')} className="sr-only" />
                                        <span className={`font-semibold ${docType === 'dbs' ? 'text-sky-300' : 'text-slate-300'}`}>DBS Certificate</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">2. Choose File</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPickerOpen(true)}
                                    className="w-full flex items-center justify-center gap-3 bg-slate-700 text-white font-semibold px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    <SharePointIcon className="w-6 h-6" />
                                    Select from SharePoint Drive
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AttachDocumentModal;