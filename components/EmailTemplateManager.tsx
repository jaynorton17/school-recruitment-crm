import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { EmailTemplate, ManualAttachment, SharePointAttachment } from '../types';
import { AddIcon, EditIcon, TrashIcon, SpinnerIcon, PaperclipIcon, CloseIcon, SharePointIcon, CheckIcon, ExclamationIcon } from './icons';
import { fileToBase64 } from '../utils';
import SharePointFilePickerModal from './SharePointFilePickerModal';

type Attachment = ManualAttachment | SharePointAttachment;
type AttachmentWithStatus = Attachment & { status: 'new' | 'saving' | 'saved' | 'error' };


interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: EmailTemplate) => Promise<void>;
    onUpdateAttachments: (templateId: string, attachments: Attachment[]) => Promise<void>;
    templateToEdit?: EmailTemplate | null;
    msalInstance: PublicClientApplication;
    account: AccountInfo;
}


const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSave, onUpdateAttachments, templateToEdit, msalInstance, account }) => {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<AttachmentWithStatus[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const isEditMode = !!templateToEdit;
    const smartTagsHelperText = "Use smart tags: `{{greeting}}`, `{{school_name}}`, `{{contact_name}}`, `{{account_manager_name}}`";
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initialBody = templateToEdit?.body || '';
            setName(templateToEdit?.name || '');
            setSubject(templateToEdit?.subject || '');
            setBody(initialBody);
            if (bodyRef.current) {
                bodyRef.current.innerHTML = initialBody;
            }
            setAttachments(templateToEdit?.attachments.map(a => ({ ...a, status: 'saved' })) || []);
            setIsSaving(false);
        }
    }, [isOpen, templateToEdit]);

    if (!isOpen) return null;
    
    const handleAttachmentsChanged = async (newAttachmentList: Attachment[]) => {
        if (isEditMode && templateToEdit) {
            // For existing templates, save immediately. Mark as 'saving'.
            const attachmentsWithStatus = newAttachmentList.map(att => {
                const existing = attachments.find(a => (a.type === 'sharepoint' && att.type === 'sharepoint' && a.fileId === att.fileId) || (a.type === 'manual' && att.type === 'manual' && a.name === att.name));
                return existing || { ...att, status: 'saving' as const };
            });
            setAttachments(attachmentsWithStatus);

            try {
                await onUpdateAttachments(templateToEdit.id, newAttachmentList);
                // On success, mark all as saved.
                setAttachments(prev => prev.map(att => ({ ...att, status: 'saved' })));
            } catch (e) {
                // On failure, mark any 'saving' attachments as 'error'.
                setAttachments(prev => prev.map(att => att.status === 'saving' ? { ...att, status: 'error' } : att));
            }
        } else {
            // For new templates, just update the state. They will be saved with the template.
            const newAttachmentsWithStatus = newAttachmentList.map(att => ({...att, status: 'new' as const}));
            setAttachments(newAttachmentsWithStatus);
        }
    };

    const handleSharePointFilesSelect = (files: any[]) => {
        const newSharePointAttachments: SharePointAttachment[] = files.map(file => ({
            type: 'sharepoint',
            name: file.name,
            fileId: file.id,
            driveId: file.parentReference.driveId,
            contentType: file.file?.mimeType || 'application/octet-stream'
        }));
        const rawAttachments = attachments.map(({ status, ...rest }) => rest);
        handleAttachmentsChanged([...rawAttachments, ...newSharePointAttachments]);
    };

    const removeAttachment = (index: number) => {
        const rawAttachments = attachments.map(({ status, ...rest }) => rest);
        const newAttachmentList = rawAttachments.filter((_, i) => i !== index);
        handleAttachmentsChanged(newAttachmentList);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !subject.trim()) {
            alert("Template Name and Subject are required.");
            return;
        }

        setIsSaving(true);
        try {
            const rawAttachments = attachments.map(({ status, ...rest }) => rest);
            await onSave({
                id: templateToEdit?.id || '',
                name,
                subject,
                body,
                attachments: rawAttachments,
                excelRowIndex: templateToEdit?.excelRowIndex
            });
            onClose();
        } catch (error) {
            console.error("Failed to save template from modal:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const AttachmentStatusIcon: React.FC<{ status: AttachmentWithStatus['status'] }> = ({ status }) => {
        switch (status) {
            case 'saving': return <SpinnerIcon className="w-4 h-4 text-sky-500" />;
            case 'saved': return <CheckIcon className="w-4 h-4 text-emerald-500" />;
            case 'error': return <ExclamationIcon className="w-4 h-4 text-red-500" />;
            default: return null; // 'new' has no icon
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            {isPickerOpen && <SharePointFilePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={handleSharePointFilesSelect} msalInstance={msalInstance} account={account} />}
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{isEditMode ? 'Edit Template' : 'Create New Template'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Template Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Subject</label>
                         <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md" required />
                        <p className="text-xs text-slate-500 mt-1">{smartTagsHelperText}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Body</label>
                        <div
                            ref={bodyRef}
                            onInput={e => setBody(e.currentTarget.innerHTML)}
                            contentEditable={true}
                            className="mt-1 w-full p-2 h-48 overflow-y-auto border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Attachments</label>
                        <div className="mt-2 space-y-2">
                             {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                                    <div className="flex items-center text-sm text-slate-700 min-w-0">
                                        {file.type === 'sharepoint' ? <SharePointIcon className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" /> : <PaperclipIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                                        <span className="truncate mr-2">{file.name}</span>
                                        <div className="w-4 h-4 flex-shrink-0">
                                            <AttachmentStatusIcon status={file.status} />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(index)} className="p-1 text-slate-400 hover:text-red-600">
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setIsPickerOpen(true)} className="mt-2 flex items-center text-sm font-semibold text-sky-700 bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-md transition-colors">
                            <SharePointIcon className="w-5 h-5 mr-2" /> Add from SharePoint
                        </button>
                    </div>
                </form>
                <div className="flex justify-end space-x-4 pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                    <button type="button" onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[100px] justify-center">
                        {isSaving ? <SpinnerIcon className="w-5 h-5"/> : 'Save Template'}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface EmailTemplateManagerProps {
    templates: EmailTemplate[];
    onSave: (template: EmailTemplate) => Promise<void>;
    onDelete: (template: EmailTemplate) => void;
    onClearAll: () => void;
    onUpdateAttachments: (templateId: string, attachments: Attachment[]) => Promise<void>;
    msalInstance: PublicClientApplication;
    account: AccountInfo;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({ templates, onSave, onDelete, onClearAll, onUpdateAttachments, msalInstance, account }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);

    const handleOpenModal = (template?: EmailTemplate) => {
        setTemplateToEdit(template || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTemplateToEdit(null);
    };
    
    const handleDelete = (template: EmailTemplate) => {
        onDelete(template);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            {isModalOpen && <TemplateModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={onSave} templateToEdit={templateToEdit} msalInstance={msalInstance} account={account} onUpdateAttachments={onUpdateAttachments} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">My Templates ({templates.length})</h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onClearAll}
                        className="flex items-center bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        title="Delete all templates and clear storage"
                    >
                        <TrashIcon className="w-5 h-5 mr-2"/>
                        Clear All
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm">
                        <AddIcon className="w-5 h-5 mr-2"/>
                        Add Template
                    </button>
                </div>
            </div>
            {templates.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col">
                            <div className="flex-grow">
                                <h4 className="font-bold text-slate-800">{template.name}</h4>
                                <p className="text-sm text-slate-500 mt-1 truncate" title={template.subject}>{template.subject}</p>
                                {template.attachments.length > 0 && (
                                    <div className="flex items-center text-xs text-slate-600 mt-2">
                                        {template.attachments[0].type === 'sharepoint' ? <SharePointIcon className="w-3 h-3 mr-1 text-blue-600" /> : <PaperclipIcon className="w-3 h-3 mr-1" />}
                                        <span>{template.attachments.length} attachment(s)</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 mt-4 self-end">
                                <button onClick={() => handleOpenModal(template)} className="p-2 text-slate-500 hover:text-sky-600"><EditIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(template)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-500 py-8">No templates created yet. Click "Add Template" to get started.</p>
            )}
        </div>
    );
};

export default EmailTemplateManager;