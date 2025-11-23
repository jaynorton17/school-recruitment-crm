import React, { useState, useMemo } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { Email, EmailTemplate, ManualAttachment, SharePointAttachment } from '../types';
import { isToday, isThisWeek } from '../utils';
import { EmailIcon, ResponseIcon, FollowUpIcon, SearchIcon, SendIcon } from './icons';
import EmailTemplateManager from './EmailTemplateManager';

interface EmailsPageProps {
  emails: Email[];
  emailTemplates: EmailTemplate[];
  onSaveTemplate: (template: EmailTemplate) => Promise<void>;
  onDeleteTemplate: (template: EmailTemplate) => void;
  onClearAllTemplates: () => void;
  onUpdateTemplateAttachments: (templateId: string, attachments: (ManualAttachment | SharePointAttachment)[]) => Promise<void>;
  msalInstance: PublicClientApplication;
  account: AccountInfo;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}> = ({ title, value, icon: Icon, color, onClick }) => (
    <div onClick={onClick} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 flex items-start gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="w-6 h-6 text-white"/>
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

type EmailFilter = 'all' | 'sentToday' | 'sentThisWeek' | 'receivedThisWeek' | 'followUps';

const EmailsPage: React.FC<EmailsPageProps> = ({ emails, emailTemplates, onSaveTemplate, onDeleteTemplate, onClearAllTemplates, onUpdateTemplateAttachments, msalInstance, account }) => {
    const [activeFilter, setActiveFilter] = useState<EmailFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const emailStats = useMemo(() => ({
        sentToday: emails.filter(e => e.direction === 'sent' && isToday(e.date)).length,
        sentThisWeek: emails.filter(e => e.direction === 'sent' && isThisWeek(e.date)).length,
        receivedThisWeek: emails.filter(e => e.direction === 'received' && isThisWeek(e.date)).length,
        followUps: emails.filter(e => e.subject.toLowerCase().includes('follow-up')).length,
    }), [emails]);

    const filteredEmails = useMemo(() => {
        let filtered = emails;

        switch (activeFilter) {
            case 'sentToday':
                filtered = emails.filter(e => e.direction === 'sent' && isToday(e.date));
                break;
            case 'sentThisWeek':
                filtered = emails.filter(e => e.direction === 'sent' && isThisWeek(e.date));
                break;
            case 'receivedThisWeek':
                filtered = emails.filter(e => e.direction === 'received' && isThisWeek(e.date));
                break;
            case 'followUps':
                filtered = emails.filter(e => e.subject.toLowerCase().includes('follow-up'));
                break;
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e => 
                e.schoolName.toLowerCase().includes(lowercasedTerm) ||
                e.coverManager.toLowerCase().includes(lowercasedTerm) ||
                e.subject.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return filtered;
    }, [emails, activeFilter, searchTerm]);


    return (
    <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Email</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard title="Sent Today" value={String(emailStats.sentToday)} icon={SendIcon} color="bg-sky-500" onClick={() => setActiveFilter('sentToday')} />
            <StatCard title="Sent This Week" value={String(emailStats.sentThisWeek)} icon={EmailIcon} color="bg-emerald-500" onClick={() => setActiveFilter('sentThisWeek')} />
            <StatCard title="Received This Week" value={String(emailStats.receivedThisWeek)} icon={ResponseIcon} color="bg-amber-500" onClick={() => setActiveFilter('receivedThisWeek')} />
            <StatCard title="Follow-ups" value={String(emailStats.followUps)} icon={FollowUpIcon} color="bg-rose-500" onClick={() => setActiveFilter('followUps')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-700/50 flex flex-col">
                <EmailTemplateManager 
                    templates={emailTemplates}
                    onSave={onSaveTemplate}
                    onDelete={onDeleteTemplate}
                    onClearAll={onClearAllTemplates}
                    onUpdateAttachments={onUpdateTemplateAttachments}
                    msalInstance={msalInstance}
                    account={account}
                />
            </div>
            
            <div className="lg:col-span-2 bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-700/50 flex flex-col">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-white">Email Log</h3>
                     <div className="relative w-full sm:w-auto">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                        <input 
                            type="text" 
                            placeholder="Search emails..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 w-full sm:w-48 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" 
                        />
                    </div>
                 </div>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {filteredEmails.map((email, index) => {
                        const isSent = email.direction === 'sent';
                        return (
                            <div key={index} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSent ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`}>
                                    {isSent ? <SendIcon className="w-5 h-5 text-sky-400" /> : <ResponseIcon className="w-5 h-5 text-emerald-400" />}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-200">{email.subject}</p>
                                    <p className="text-sm text-slate-400">
                                        {isSent ? `Sent to ${email.coverManager}` : `From ${email.coverManager}`} at {email.schoolName}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 flex-shrink-0">{email.date.split(' ')[0]}</p>
                            </div>
                        )
                    })}
                     {filteredEmails.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No emails match the current filters.
                            <button onClick={() => {setActiveFilter('all'); setSearchTerm('');}} className="ml-2 text-sky-400 hover:underline">
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default EmailsPage;