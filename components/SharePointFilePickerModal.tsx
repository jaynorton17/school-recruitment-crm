
import React, { useState, useEffect } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
// FIX: Added missing import for listDriveItems to resolve function not found error.
import { listDriveItems } from '../graph';
import { SpinnerIcon, FolderIcon, FileIcon, CloseIcon } from './icons';

interface SharePointFilePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (files: any[]) => void;
    msalInstance: PublicClientApplication;
    account: AccountInfo;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SharePointFilePickerModal: React.FC<SharePointFilePickerModalProps> = ({ isOpen, onClose, onSelect, msalInstance, account }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Files' }]);

    useEffect(() => {
        if (isOpen) {
            const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
            fetchItems(currentFolderId === 'root' ? undefined : currentFolderId);
        } else {
            // Reset state on close
            setBreadcrumbs([{ id: 'root', name: 'My Files' }]);
            setSelectedFiles([]);
            setItems([]);
        }
    }, [isOpen, breadcrumbs]);

    const fetchItems = async (itemId?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const driveItems = await listDriveItems(msalInstance, account, itemId);
            setItems(driveItems);
        } catch (err) {
            setError('Failed to load files from SharePoint. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemClick = (item: any) => {
        if (item.folder) {
            setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
        } else {
            // Toggle file selection
            setSelectedFiles(prev =>
                prev.some(f => f.id === item.id)
                    ? prev.filter(f => f.id !== item.id)
                    : [...prev, item]
            );
        }
    };
    
    const handleBreadcrumbClick = (index: number) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const handleConfirm = () => {
        onSelect(selectedFiles);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Select Attachments from SharePoint</h2>
                     <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 flex-shrink-0">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`hover:text-sky-400 ${index === breadcrumbs.length - 1 ? 'font-semibold text-white' : ''}`}
                            >
                                {crumb.name}
                            </button>
                            {index < breadcrumbs.length - 1 && <span className="text-slate-500">/</span>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <SpinnerIcon className="w-8 h-8 mr-2"/> Loading...
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 p-8">{error}</div>
                    ) : (
                        <ul className="space-y-1">
                            {items.map(item => {
                                const isSelected = selectedFiles.some(f => f.id === item.id);
                                return (
                                <li
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`flex items-center p-2 rounded-md cursor-pointer ${isSelected ? 'bg-sky-500/20' : 'hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex-shrink-0 w-8">
                                        {item.folder ? <FolderIcon className="w-5 h-5 text-amber-400" /> : <FileIcon className="w-5 h-5 text-slate-400" />}
                                    </div>
                                    <span className={`flex-grow truncate ${isSelected ? 'text-sky-300 font-semibold' : 'text-slate-300'}`}>{item.name}</span>
                                    {item.file && item.size > 0 && (
                                        <span className="text-xs text-slate-500 w-24 text-right pr-2 flex-shrink-0">
                                            {formatBytes(item.size)}
                                        </span>
                                    )}
                                    {!item.folder && (
                                        <input type="checkbox" readOnly checked={isSelected} className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500" />
                                    )}
                                </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-slate-700 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                    <button onClick={handleConfirm} disabled={selectedFiles.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50">
                        Attach ({selectedFiles.length}) Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePointFilePickerModal;
