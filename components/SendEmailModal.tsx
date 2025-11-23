import React, { useState, useEffect, useRef } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { School, EmailTemplate, ManualAttachment, SharePointAttachment } from '../types';
import { SpinnerIcon, SendIcon, PaperclipIcon, CloseIcon, SharePointIcon } from './icons';
import SharePointFilePickerModal from './SharePointFilePickerModal';

type Attachment = ManualAttachment | SharePointAttachment;

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { to: string, subject: string, body: string, attachments: Attachment[], templateName?: string, templateId?: string }) => Promise<void>;
    school: School;
    currentUser: { name: string; email: string; };
    templates: EmailTemplate[];
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

const SendEmailModal: React.FC<SendEmailModalProps> = ({ isOpen, onClose, onSubmit, school, currentUser, templates, msalInstance, account }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');


    useEffect(() => {
        if (isOpen) {
            let initialBody = '';
            let initialSubject = '';

            const aiDraftJson = sessionStorage.getItem('aiEmailDraft');
            if (aiDraftJson) {
                try {
                    const draft = JSON.parse(aiDraftJson);
                    initialSubject = draft.subject || '';
                    initialBody = draft.body || '';
                } catch (e) { console.error(e); }
                sessionStorage.removeItem('aiEmailDraft');
            }
            
            setTo(school.email || '');
            setSubject(initialSubject);
            setBody(initialBody);

            setAttachments([]);
            setSelectedTemplateId('');
        }
    }, [isOpen, school]);

    useEffect(() => {
        // This effect manages the content of the editable div.
        // It prevents the cursor from jumping by only updating the innerHTML
        // if the state (`body`) is different from the DOM content. This happens
        // when a template is applied, but not on every user keystroke.
        if (bodyRef.current && bodyRef.current.innerHTML !== body) {
            bodyRef.current.innerHTML = body;
        }
    }, [body]);

    if (!isOpen) return null;

    const applyTemplate = (template: EmailTemplate) => {
        const contactName = school.emailName || school.coverManager || '';
        
        const currentHour = new Date().getHours();
        const greeting = currentHour < 12 ? "Good Morning" : "Good Afternoon";

        let newSubject = template.subject
            .replace(/{{school_name}}/gi, school.name)
            .replace(/{{contact_name}}/gi, contactName)
            .replace(/{{account_manager_name}}/gi, currentUser.name)
            .replace(/{{greeting}}/gi, greeting);

        let newBody = template.body
            .replace(/{{school_name}}/gi, school.name)
            .replace(/{{contact_name}}/gi, contactName)
            .replace(/{{account_manager_name}}/gi, currentUser.name)
            .replace(/{{greeting}}/gi, greeting);

        setSubject(newSubject);
        setBody(newBody);
        setAttachments(template.attachments);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            applyTemplate(template);
        } else {
            // Reset if they select "Select a template..."
            setSubject('');
            setBody('');
            setAttachments([]);
        }
    };

    const handleSharePointFilesSelect = (files: any[]) => {
        const newAttachments: SharePointAttachment[] = files.map(file => ({
            type: 'sharepoint',
            name: file.name,
            fileId: file.id,
            driveId: file.parentReference.driveId,
            contentType: file.file?.mimeType || 'application/octet-stream',
            size: file.size,
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!to.trim() || !subject.trim()) {
            alert("Recipient and Subject are required.");
            return;
        }
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        
        // Fire the onSubmit but don't wait for it.
        onSubmit({ to, subject, body, attachments, templateName: selectedTemplate?.name, templateId: selectedTemplateId });
        
        // Close the modal immediately.
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            {isPickerOpen && <SharePointFilePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={handleSharePointFilesSelect} msalInstance={msalInstance} account={account} />}
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Send Email</h2>
                        <p className="text-slate-400">To: <span className="font-semibold text-white">{school.name}</span></p>
                    </div>
                     <select 
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="p-2 border border-slate-600 rounded-md bg-slate-900 text-white text-sm"
                     >
                        <option value="">Select a template...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2 text-slate-300">
                    <div>
                        <label className="block text-sm font-medium">To</label>
                        <input type="email" value={to} onChange={e => setTo(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Subject</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Body</label>
                        <div
                            ref={bodyRef}
                            onInput={e => setBody(e.currentTarget.innerHTML)}
                            contentEditable={true}
                            className="mt-1 w-full p-3 h-60 overflow-y-auto border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Attachments</label>
                         <div className="mt-2 space-y-2">
                             {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
                                    <div className="flex items-center text-sm overflow-hidden">
                                        {file.type === 'sharepoint' ? <SharePointIcon className="w-4 h-4 mr-2 flex-shrink-0" /> : <PaperclipIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                                        <span className="truncate mr-2">{file.name}</span>
                                        {file.type === 'sharepoint' && file.size && (
                                            <span className="text-xs text-slate-400 flex-shrink-0">({formatBytes(file.size)})</span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(index)} className="p-1 text-slate-400 hover:text-red-400 flex-shrink-0">
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setIsPickerOpen(true)} className="mt-2 text-sm text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-md">Add from SharePoint</button>
                    </div>
                </form>
                <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                        <SendIcon className="w-5 h-5 mr-2" /> Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendEmailModal;