

import React, { useState, useMemo, useEffect } from 'react';
import { School, Task, Note, Email, CallLog, Opportunity, User, JobAlert } from '../types';
import { PhoneOutgoingIcon, EmailIcon as SendIcon, CheckIcon, TaskIcon, NotesIcon, EmailIcon, CallIcon, OpportunitiesIcon, TranscriptIcon, EditIcon, SpinnerIcon, AddIcon, AiIcon, TrashIcon, JobAlertsIcon, RefreshIcon, GlobeIcon, StarIcon } from './icons';
import { isOverdue, parseUKDate, parseUKDateTimeString } from '../utils';

interface SchoolProfilePageProps {
  school: School;
  schools: School[];
  users: User[];
  currentUser: { name: string, email: string };
  tasks: Task[];
  notes: Note[];
  emails: Email[];
  callLogs: CallLog[];
  opportunities: Opportunity[];
  jobAlerts: JobAlert[];
  onStartCall: (school: School) => void;
  onOpenLogCallModal: (schoolName: string, duration?: string) => void;
  onOpenAddNoteModal: (school?: School, note?: Note) => void;
  onOpenAddTaskModal: (school?: School, task?: Partial<Task>) => void;
  onOpenSendEmailModal: (school: School) => void;
  onOpenUploadTranscriptModal: (school: School) => void;
  onAddOpportunity: (opp: Omit<Opportunity, 'excelRowIndex' | 'id' | 'dateCreated' | 'notes'>) => void;
  onUpdateSchool: (updatedSchool: School) => Promise<void>;
  onToggleSpokenStatus: (schoolToUpdate: School) => void;
  onToggleTaskStatus: (taskToToggle: Task) => void;
  onDeleteNote: (noteToDelete: Note) => void;
  onDeleteTask: (taskToDelete: Task) => void;
  onDeleteCallLog: (callLogToDelete: CallLog) => void;
  onUpdateCallLog: (callLog: CallLog) => void;
  onGenerateAiNotes: (callLog: CallLog) => void;
  isGeneratingForTranscript: number | null;
  onBack: () => void;
  onUpdateContactDetails: (school: School) => void;
  onUpdateJobs: (school: School) => void;
}

type ActiveTab = 'Tasks' | 'Emails' | 'Call Logs' | 'Opportunities' | 'Job Alerts' | 'Notes' | 'Transcriptions';

const EditableField: React.FC<{ label: string; name: keyof School; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isEditing: boolean; type?: string; }> = ({ label, name, value, onChange, isEditing, type = 'text' }) => (
    <div>
        <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
        {isEditing ? (
            <input type={type} name={name} value={value} onChange={onChange} className="mt-1 w-full p-1 border border-slate-300 rounded-md bg-slate-50" />
        ) : (
            <p className="font-semibold text-slate-800 mt-1 truncate">{value || 'N/A'}</p>
        )}
    </div>
);

const ClickableInfoCard: React.FC<{ title: string; color: { bg: string; border: string; text: string; }; icon: React.ElementType; items: {key: any, content: React.ReactNode}[]; isActive: boolean; onClick: () => void; }> = ({ title, color, icon: Icon, items, isActive, onClick }) => (
    <button onClick={onClick} className={`bg-white rounded-lg shadow-sm border-2 text-left flex flex-col transition-all ${isActive ? color.border : 'border-transparent hover:border-slate-300'}`}>
        <div className={`${color.bg} p-3 rounded-t-lg text-white flex justify-between items-center`}>
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5"/>
                <h3 className="font-bold text-sm uppercase">{title}</h3>
            </div>
            <span className="font-bold text-lg">{items.length}</span>
        </div>
        <div className="p-3 flex-grow min-h-[80px]">
            {items.slice(0, 3).length > 0 ? (
                <ul className="space-y-1">
                    {items.slice(0, 3).map(item => (
                        <li key={item.key} className="text-xs text-slate-600 truncate flex items-start">
                           <span className="mr-1.5 mt-1 text-slate-400 text-[8px]">●</span>
                           <span className="flex-1">{item.content}</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-slate-500 italic">No items.</p>}
        </div>
    </button>
);


const SchoolProfilePage: React.FC<SchoolProfilePageProps> = (props) => {
    const {
      school, tasks, notes, emails, callLogs, opportunities, jobAlerts,
      onStartCall, onOpenSendEmailModal, onAddOpportunity, onToggleSpokenStatus, onUpdateSchool,
      onToggleTaskStatus, onOpenAddNoteModal, onOpenAddTaskModal, onGenerateAiNotes, isGeneratingForTranscript, onBack,
      onDeleteCallLog, onUpdateCallLog, onDeleteNote, onDeleteTask, onOpenUploadTranscriptModal, onUpdateContactDetails, onUpdateJobs
    } = props;
    
    const [isEditing, setIsEditing] = useState(false);
    const [editableSchool, setEditableSchool] = useState<School>(school);
    const [activeTab, setActiveTab] = useState<ActiveTab>('Notes');
    const [viewingTranscriptText, setViewingTranscriptText] = useState<string | null>(null);
    const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
    const [isUpdatingJobs, setIsUpdatingJobs] = useState(false);

    useEffect(() => {
        setEditableSchool(school);
        setIsEditing(false); 
    }, [school]);
    
    // Memoize filtered data for performance
    const schoolTasks = useMemo(() => tasks.filter(t => t.schoolName === school.name), [tasks, school.name]);
    const schoolNotes = useMemo(() => notes.filter(n => n.schoolName === school.name).sort((a, b) => (parseUKDateTimeString(b.date)?.getTime() || 0) - (parseUKDateTimeString(a.date)?.getTime() || 0)), [notes, school.name]);
    const schoolEmails = useMemo(() => emails.filter(e => e.schoolName === school.name), [emails, school.name]);
    const schoolCallLogs = useMemo(() => callLogs.filter(c => c.schoolName === school.name).sort((a, b) => (parseUKDateTimeString(b.dateCalled)?.getTime() || 0) - (parseUKDateTimeString(a.dateCalled)?.getTime() || 0)), [callLogs, school.name]);
    const schoolTranscripts = useMemo(() => callLogs.filter(c => c.schoolName === school.name && c.transcript && c.transcript.trim() !== '').sort((a, b) => (parseUKDateTimeString(b.dateCalled)?.getTime() || 0) - (parseUKDateTimeString(a.dateCalled)?.getTime() || 0)), [callLogs, school.name]);
    const schoolOpportunities = useMemo(() => opportunities.filter(o => o.schoolName === school.name), [opportunities, school.name]);
    const schoolJobAlerts = useMemo(() => jobAlerts.filter(j => j.schoolName === school.name), [jobAlerts, school.name]);
    const openTasks = useMemo(() => schoolTasks.filter(t => !t.isCompleted).sort((a,b) => (parseUKDate(a.dueDate)?.getTime() || Infinity) - (parseUKDate(b.dueDate)?.getTime() || Infinity)), [schoolTasks]);
    
    const isClient = useMemo(() => school.status && school.status.toLowerCase().includes('client'), [school.status]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableSchool(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        await onUpdateSchool(editableSchool);
        setIsEditing(false);
    };

    const handleUpdateContacts = async () => {
        setIsUpdatingContacts(true);
        await onUpdateContactDetails(school);
        setIsUpdatingContacts(false);
    };

    const handleUpdateJobs = async () => {
        setIsUpdatingJobs(true);
        await onUpdateJobs(school);
        setIsUpdatingJobs(false);
    }

    const colors = {
        Tasks: { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-sky-700' },
        Emails: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-700' },
        'Call Logs': { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-700' },
        Opportunities: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-700' },
        'Job Alerts': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-700' },
        Notes: { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-700' },
        Transcriptions: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-700' },
    };

    return (
        <div className="p-4 md:p-6 bg-slate-100 text-slate-800 min-h-full">
            {viewingTranscriptText && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setViewingTranscriptText(null)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Call Transcript</h3>
                        <pre className="flex-grow bg-slate-900 p-3 rounded-md overflow-y-auto text-sm whitespace-pre-wrap font-mono text-slate-300">{viewingTranscriptText}</pre>
                        <button onClick={() => setViewingTranscriptText(null)} className="mt-4 self-end px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">Close</button>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{school.name}</h1>
                            {isClient && (
                                <div className="flex items-center gap-1 bg-amber-100 text-amber-600 font-bold px-3 py-1 rounded-full text-sm">
                                    <StarIcon className="w-4 h-4 text-amber-500" />
                                    <span>Client</span>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 mt-1">{school.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleUpdateContacts} disabled={isUpdatingContacts} className="flex items-center bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-70">
                         {isUpdatingContacts ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <RefreshIcon className="w-5 h-5 mr-2"/>}
                         Update Contact Details
                    </button>
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="font-semibold px-4 py-2 rounded-lg bg-slate-200 text-slate-800">Cancel</button>
                            <button onClick={handleSave} className="flex items-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600">Save</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center font-semibold px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
                            <EditIcon className="w-5 h-5 mr-2" />Edit
                        </button>
                    )}
                    <button onClick={() => onOpenSendEmailModal(school)} className="flex items-center bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors">
                        <SendIcon className="w-5 h-5 mr-2" />Email
                    </button>
                    <button onClick={() => onStartCall(school)} className="flex items-center bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                        <PhoneOutgoingIcon className="w-5 h-5 mr-2" />Call
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditableField label="Account Manager" name="accountManager" value={editableSchool.accountManager || ''} onChange={handleFieldChange} isEditing={isEditing} />
                    <EditableField label="Status" name="status" value={editableSchool.status || ''} onChange={handleFieldChange} isEditing={isEditing} />
                    <EditableField label="Cover Manager" name="coverManager" value={editableSchool.coverManager || ''} onChange={handleFieldChange} isEditing={isEditing} />
                    <EditableField label="Email Name" name="emailName" value={editableSchool.emailName || ''} onChange={handleFieldChange} isEditing={isEditing} />
                    <EditableField label="Contact Number" name="contactNumber" value={editableSchool.contactNumber || ''} onChange={handleFieldChange} isEditing={isEditing} type="tel" />
                    <EditableField label="Switchboard" name="switchboard" value={editableSchool.switchboard || ''} onChange={handleFieldChange} isEditing={isEditing} type="tel" />
                    <EditableField label="Primary Email" name="email" value={editableSchool.email || ''} onChange={handleFieldChange} isEditing={isEditing} type="email" />
                    <EditableField label="Contact 2 Name" name="contact2" value={editableSchool.contact2 || ''} onChange={handleFieldChange} isEditing={isEditing} />
                    <EditableField label="Contact 2 Email" name="contact2Email" value={editableSchool.contact2Email || ''} onChange={handleFieldChange} isEditing={isEditing} type="email" />
                    <div className="md:col-span-2">
                         <div className="flex items-center gap-2">
                            <EditableField label="Website" name="website" value={editableSchool.website || ''} onChange={handleFieldChange} isEditing={isEditing} />
                            {school.website && !isEditing && <a href={school.website} target="_blank" rel="noopener noreferrer"><GlobeIcon className="w-5 h-5 text-sky-500 hover:text-sky-700"/></a>}
                        </div>
                    </div>
                     <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Last Called</p>
                        <p className="font-semibold text-slate-800 mt-1">{school.lastCalledDate?.split(' ')[0] || 'Never'}</p>
                    </div>
                     <div className="flex items-center gap-2 pt-5">
                        <input id="spokeToManager" type="checkbox" checked={editableSchool.spokeToCoverManager} onChange={(e) => setEditableSchool(prev => ({...prev, spokeToCoverManager: e.target.checked}))} disabled={!isEditing} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                        <label htmlFor="spokeToManager" className="font-semibold text-slate-800">Spoke to Manager</label>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <ClickableInfoCard
                    title="Notes"
                    color={colors.Notes}
                    icon={NotesIcon}
                    items={schoolNotes.map(n => ({ key: n.excelRowIndex, content: n.note }))}
                    isActive={activeTab === 'Notes'}
                    onClick={() => setActiveTab('Notes')}
                />
                <ClickableInfoCard
                    title="Tasks"
                    color={colors.Tasks}
                    icon={TaskIcon}
                    items={openTasks.map(t => ({ key: t.excelRowIndex, content: t.taskDescription }))}
                    isActive={activeTab === 'Tasks'}
                    onClick={() => setActiveTab('Tasks')}
                />
                <ClickableInfoCard
                    title="Emails"
                    color={colors.Emails}
                    icon={EmailIcon}
                    items={schoolEmails.map(e => ({ key: e.date + e.subject, content: e.subject }))}
                    isActive={activeTab === 'Emails'}
                    onClick={() => setActiveTab('Emails')}
                />
                <ClickableInfoCard
                    title="Call Logs"
                    color={colors['Call Logs']}
                    icon={CallIcon}
                    items={schoolCallLogs.map(c => ({ key: c.excelRowIndex, content: c.notes }))}
                    isActive={activeTab === 'Call Logs'}
                    onClick={() => setActiveTab('Call Logs')}
                />
                <ClickableInfoCard
                    title="Opportunities"
                    color={colors.Opportunities}
                    icon={OpportunitiesIcon}
                    items={schoolOpportunities.map(o => ({ key: o.id, content: o.name }))}
                    isActive={activeTab === 'Opportunities'}
                    onClick={() => setActiveTab('Opportunities')}
                />
                <ClickableInfoCard
                    title="Job Alerts"
                    color={colors['Job Alerts']}
                    icon={JobAlertsIcon}
                    items={schoolJobAlerts.map(j => ({ key: j.excelRowIndex, content: j.jobTitle }))}
                    isActive={activeTab === 'Job Alerts'}
                    onClick={() => setActiveTab('Job Alerts')}
                />
                 <ClickableInfoCard
                    title="Transcripts"
                    color={colors.Transcriptions}
                    icon={TranscriptIcon}
                    items={schoolTranscripts.map(c => ({ key: c.excelRowIndex, content: `Transcript from ${c.dateCalled}` }))}
                    isActive={activeTab === 'Transcriptions'}
                    onClick={() => setActiveTab('Transcriptions')}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-slate-800">{activeTab}</h3>
                    {activeTab === 'Notes' && <button onClick={() => onOpenAddNoteModal(school)} className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200"><AddIcon className="w-4 h-4 mr-2"/>Add Note</button>}
                    {activeTab === 'Tasks' && <button onClick={() => onOpenAddTaskModal(school, {})} className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200"><AddIcon className="w-4 h-4 mr-2"/>Add Task</button>}
                    {activeTab === 'Opportunities' && <button onClick={() => onAddOpportunity({ name: '', schoolName: school.name, progressStage: '5% - Opportunity identified', accountManager: school.accountManager })} className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200"><AddIcon className="w-4 h-4 mr-2"/>Add Opportunity</button>}
                    {activeTab === 'Transcriptions' && <button onClick={() => onOpenUploadTranscriptModal(school)} className="flex items-center text-sm bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700"><AddIcon className="w-5 h-5 mr-2"/>Upload & Link Transcript</button>}
                    {activeTab === 'Job Alerts' && <button onClick={() => onUpdateJobs(school)} disabled={isUpdatingJobs} className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-70">{isUpdatingJobs ? <SpinnerIcon className="w-4 h-4 mr-2"/> : <RefreshIcon className="w-4 h-4 mr-2"/>}Scan for Jobs</button>}
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {activeTab === 'Notes' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolNotes.map(note => (
                                <li key={note.excelRowIndex} className="p-3 hover:bg-slate-50 group">
                                    <p className="text-sm text-slate-700 mb-1">{note.note}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500">{note.accountManager} on {note.date}</p>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onOpenAddNoteModal(school, note)} className="p-1 text-slate-400 hover:text-sky-600"><EditIcon className="w-4 h-4"/></button>
                                            <button onClick={() => onDeleteNote(note)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Tasks' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolTasks.map(task => (
                                <li key={task.excelRowIndex} className={`p-3 group ${task.isCompleted ? 'opacity-60' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={task.isCompleted} onChange={() => onToggleTaskStatus(task)} className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer mt-0.5"/>
                                        <div className="flex-grow">
                                            <p className={`font-medium ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>{task.taskDescription}</p>
                                            <p className={`text-sm ${isOverdue(task.dueDate) && !task.isCompleted ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>Due: {task.dueDate || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onOpenAddTaskModal(school, task)} className="p-1 text-slate-400 hover:text-sky-600"><EditIcon className="w-4 h-4"/></button>
                                            <button onClick={() => onDeleteTask(task)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Emails' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolEmails.map((email, i) => (
                                <li key={i} className="p-3">
                                    <p className="font-semibold text-slate-800">{email.subject}</p>
                                    <p className="text-sm text-slate-500">{email.direction === 'sent' ? 'To' : 'From'}: {email.coverManager} on {email.date}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Call Logs' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolCallLogs.map(log => (
                                <li key={log.excelRowIndex} className="p-3 group hover:bg-slate-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-700">{log.notes}</p>
                                            <p className="text-xs text-slate-500 mt-1">With {log.contactCalled} for {log.duration} on {log.dateCalled}</p>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onDeleteCallLog(log)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Opportunities' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolOpportunities.map(opp => (
                                <li key={opp.id} className="p-3">
                                    <p className="font-semibold text-slate-800">{opp.name}</p>
                                    <p className="text-sm text-slate-500">{opp.progressStage}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Job Alerts' && (
                        <ul className="divide-y divide-slate-100">
                            {schoolJobAlerts.map(job => (
                                <li key={job.excelRowIndex} className="p-3 hover:bg-slate-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {job.sourceUrl ? (
                                                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-700 hover:underline">{job.jobTitle}</a>
                                            ) : (
                                                <p className="font-semibold text-slate-800">{job.jobTitle}</p>
                                            )}
                                            <p className="text-sm text-slate-600">{job.subject} - {job.salary}</p>
                                        </div>
                                        <p className="text-sm text-slate-500 flex-shrink-0 ml-4">Closes: {job.closeDate || 'N/A'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'Transcriptions' && (
                        <div>
                            {schoolTranscripts.length > 0 ? (
                                <ul className="divide-y divide-slate-100">
                                    {schoolTranscripts.map(log => (
                                        <li key={log.excelRowIndex} className="p-3 group hover:bg-slate-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">Transcript from {log.dateCalled}</p>
                                                    <p className="text-xs text-slate-500">With {log.contactCalled} for {log.duration}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setViewingTranscriptText(log.transcript!)} className="p-2 text-slate-400 hover:text-sky-600 rounded-md hover:bg-slate-100" title="View Transcript">
                                                        <TranscriptIcon className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => onGenerateAiNotes(log)} 
                                                        className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-md transition-colors bg-sky-500 text-white hover:bg-sky-600" 
                                                        title="Generate AI Notes, Email & Tasks"
                                                    >
                                                        {isGeneratingForTranscript === log.excelRowIndex ? <SpinnerIcon className="w-4 h-4"/> : <AiIcon className="w-4 h-4"/>}
                                                        <span>Generate AI Notes, Email & Tasks</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <TranscriptIcon className="mx-auto h-12 w-12 text-slate-300" />
                                    <h3 className="mt-2 text-sm font-semibold text-slate-700">No Transcripts Found</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Click the "Upload & Link Transcript" button above to add one.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolProfilePage;