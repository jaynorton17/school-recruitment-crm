import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { School, CallLog } from '../types';
import { SpinnerIcon, AddIcon, TrashIcon, MicIcon, StopIcon, ExportIcon } from './icons';
import { formatDateTimeUK, fileToBase64, autoformatDateInput } from '../utils';
import { getGeminiModel } from '../services/gemini';

interface AddCallLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { 
        duration: string; 
        dateCalled: string;
        manualNotes: string;
        contactCalled: string; 
        spokeToCoverManager: boolean;
        transcript?: string;
        tasks: { description: string; dueDate: string; dueTime: string; }[];
        callLogToUpdateId?: number;
    }) => Promise<void>;
    school: School;
    initialData?: { duration?: string; notes?: string; transcript?: string };
    callLogsForSchool: CallLog[];
}

interface TaskItem {
    id: number;
    description: string;
    dueDate: string;
    dueTime: string;
}


const AddCallLogModal: React.FC<AddCallLogModalProps> = ({ isOpen, onClose, onSubmit, school, initialData, callLogsForSchool }) => {
    const [contactCalled, setContactCalled] = useState('');
    const [spokeToCoverManager, setSpokeToCoverManager] = useState(false);
    const [manualNotes, setManualNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskDueTime, setNewTaskDueTime] = useState('');
    const [editableTranscript, setEditableTranscript] = useState('');
    const [duration, setDuration] = useState('00:00');
    const [dateCalled, setDateCalled] = useState('');
    const [selectedCallLogId, setSelectedCallLogId] = useState<number | 'new'>('new');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const contactOptions = useMemo(() => 
        [school.coverManager, school.contact2].filter(c => c && c.trim() !== '') as string[],
        [school.coverManager, school.contact2]
    );
    
    useEffect(() => {
        if (isOpen) {
            setManualNotes(initialData?.notes || '');
            setEditableTranscript(initialData?.transcript || '');
            setDuration(initialData?.duration || '00:00');
            setDateCalled(formatDateTimeUK(new Date().toISOString()));
            setContactCalled(school?.coverManager || (contactOptions.length > 0 ? contactOptions[0] : ''));
            setSpokeToCoverManager(false);
            setIsSaving(false);
            setTasks([]);
            setNewTaskDesc('');
            setNewTaskDueDate('');
            setNewTaskDueTime('');
            setSelectedCallLogId('new');
        }
    }, [isOpen, school, contactOptions, initialData]);

    const handleCallLogSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'new') {
            setSelectedCallLogId('new');
            // Reset form to initial state for a new log
            setManualNotes(initialData?.notes || '');
            setDuration(initialData?.duration || '00:00');
            setDateCalled(formatDateTimeUK(new Date().toISOString()));
            setContactCalled(school?.coverManager || (contactOptions.length > 0 ? contactOptions[0] : ''));
            setSpokeToCoverManager(false);
            setEditableTranscript(initialData?.transcript || ''); // Keep uploaded transcript
        } else {
            const logId = parseInt(value, 10);
            setSelectedCallLogId(logId);
            const selectedLog = callLogsForSchool.find(log => log.excelRowIndex === logId);
            if (selectedLog) {
                // Pre-fill form with data from existing log
                setDateCalled(selectedLog.dateCalled);
                setDuration(selectedLog.duration);
                setContactCalled(selectedLog.contactCalled);
                setSpokeToCoverManager(selectedLog.spokeToCoverManager);
                setManualNotes(selectedLog.notes || ''); 
                setEditableTranscript(initialData?.transcript || ''); // Keep the new transcript
            }
        }
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const target = event.target; 

        setIsTranscribing(true);
        setEditableTranscript('Transcribing audio, please wait...');

        try {
            if (file.type.startsWith('audio/')) {
                const model = getGeminiModel('gemini-1.5-flash');
                const audioBytes = await fileToBase64(file);
                const prompt = `Transcribe this audio of a phone call for a school recruitment CRM. The audio is base64 encoded with mime type ${file.type}: ${audioBytes}`;

                const result = await model.generateContent({ prompt });

                const transcript = result.response.text();
                if (transcript) {
                    setEditableTranscript(transcript);
                } else {
                    setEditableTranscript('Transcription failed. The audio might be silent or unclear.');
                }
            } else if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        setEditableTranscript(text);
                    } else {
                        setEditableTranscript('Failed to read text file.');
                    }
                };
                reader.readAsText(file);
            } else {
                setEditableTranscript(`Unsupported file type: ${file.type}. Please upload a .txt or audio file.`);
            }
        } catch (error) {
            console.error("Transcription/upload failed:", error);
            setEditableTranscript("An error occurred during transcription. Please try again.");
        } finally {
            setIsTranscribing(false);
            if (target) target.value = ''; // Reset file input to allow re-uploading the same file
        }
    };

    const handleAddTask = () => {
        if (newTaskDesc.trim()) {
            setTasks(prev => [...prev, { id: Date.now(), description: newTaskDesc.trim(), dueDate: newTaskDueDate, dueTime: newTaskDueTime }]);
            setNewTaskDesc('');
            setNewTaskDueDate('');
            setNewTaskDueTime('');
        }
    };

    const handleRemoveTask = (taskId: number) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSubmit({
                duration,
                dateCalled,
                manualNotes,
                contactCalled,
                spokeToCoverManager,
                transcript: editableTranscript,
                tasks: tasks.map(({id, ...rest}) => rest),
                callLogToUpdateId: selectedCallLogId === 'new' ? undefined : selectedCallLogId,
            });
            onClose();
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to save log.");
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-white">Log Call</h2>
                    <p className="text-slate-400">For <span className="font-semibold text-white">{school.name}</span></p>
                </div>
                
                <form onSubmit={handleSave} className="flex flex-col gap-4 flex-grow overflow-y-auto pr-2">
                    {initialData?.transcript && callLogsForSchool.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Link to Existing Call (Optional)</label>
                            <select value={selectedCallLogId} onChange={handleCallLogSelectionChange} className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                                <option value="new">-- Log as New Call --</option>
                                {callLogsForSchool.map(log => (
                                    <option key={log.excelRowIndex} value={log.excelRowIndex}>
                                        Call on {log.dateCalled} with {log.contactCalled}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Transcript UI */}
                    <div className="bg-slate-700 p-4 rounded-xl border-2 border-slate-600 shadow-lg">
                        <div className="flex gap-4 items-center">
                            <div className="w-24 h-24 bg-slate-800 rounded-lg grid grid-cols-6 grid-rows-6 p-2 gap-1 flex-shrink-0">
                                {Array.from({ length: 36 }).map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>)}
                            </div>
                            <div className="flex-1 flex flex-col justify-center h-24">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-white font-mono tracking-widest">CALL TRANSCRIPT</h4>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isTranscribing}
                                        className="flex items-center text-sm bg-slate-600 text-slate-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        {isTranscribing ? (
                                            <SpinnerIcon className="w-4 h-4 mr-2"/>
                                        ) : (
                                            <ExportIcon className="w-4 h-4 mr-2"/>
                                        )}
                                        {isTranscribing ? 'Processing...' : 'Upload Audio'}
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".txt,text/plain,audio/*,.m4a,.mp3,.wav" className="hidden" />
                                </div>
                                <p className="text-slate-400 text-sm">From live call or upload. Editable below.</p>
                            </div>
                        </div>
                         <textarea
                            value={editableTranscript}
                            onChange={(e) => setEditableTranscript(e.target.value)}
                            className="mt-4 bg-slate-900 p-3 rounded-md w-full min-h-[100px] border border-slate-600 max-h-48 overflow-y-auto text-slate-200 whitespace-pre-wrap text-sm placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            placeholder="Transcript from live call will appear here. You can edit it before saving."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Date & Time of Call</label>
                            <input type="text" value={dateCalled} onChange={(e) => setDateCalled(autoformatDateInput(e.target.value))} placeholder="DD/MM/YYYY HH:mm" className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-white focus:ring-sky-500 focus:border-sky-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Duration (mm:ss)</label>
                            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 02:35" className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-white focus:ring-sky-500 focus:border-sky-500 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="manualContactCalled" className="block text-sm font-medium text-slate-300">Contact Spoken To</label>
                            <select id="manualContactCalled" value={contactCalled} onChange={(e) => setContactCalled(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-white focus:ring-sky-500 focus:border-sky-500 outline-none">
                                {contactOptions.map(contact => <option key={contact} value={contact}>{contact}</option>)}
                                {contactOptions.length === 0 && <option value="">No contacts found</option>}
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <input id="manualSpokeToCoverManager" type="checkbox" checked={spokeToCoverManager} onChange={(e) => setSpokeToCoverManager(e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500" />
                            <label htmlFor="manualSpokeToCoverManager" className="ml-2 block text-sm text-white">Spoke to Cover Manager</label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="manualNotes" className="block text-sm font-medium text-slate-300">Manual Notes (Optional)</label>
                        <textarea id="manualNotes" value={manualNotes} onChange={e => setManualNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-white" placeholder="Add a summary or key points..." />
                    </div>
                    
                    <div className="border-t border-slate-700 pt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Create Follow-up Tasks</h3>
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-2 bg-slate-700 rounded-md">
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{task.description}</p>
                                        {(task.dueDate || task.dueTime) && <p className="text-xs text-slate-400">Due: {task.dueDate} {task.dueTime}</p>}
                                    </div>
                                    <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-1 text-slate-400 hover:text-red-400 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 mt-3">
                            <div className="flex-grow w-full sm:w-auto"><label htmlFor="newTaskDesc" className="text-xs font-medium text-slate-400">Task Description</label><input id="newTaskDesc" type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="e.g., Follow up..." className="mt-1 block w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-sm text-white" /></div>
                            <div className="flex-grow sm:flex-grow-0 sm:w-36"><label htmlFor="newTaskDueDate" className="text-xs font-medium text-slate-400">Due Date</label><input id="newTaskDueDate" type="text" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} placeholder="DD/MM/YYYY" className="mt-1 block w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-sm text-white" /></div>
                            <div className="flex-grow sm:flex-grow-0 sm:w-28"><label htmlFor="newTaskDueTime" className="text-xs font-medium text-slate-400">Due Time</label><input id="newTaskDueTime" type="time" value={newTaskDueTime} onChange={e => setNewTaskDueTime(e.target.value)} className="mt-1 block w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-sm text-white" /></div>
                            <button type="button" onClick={handleAddTask} className="px-3 py-1.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-sm font-semibold rounded-md flex-shrink-0"><AddIcon className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <footer className="w-full flex-shrink-0 border-t border-slate-700 pt-4 mt-auto">
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                            <button type="submit" disabled={isSaving} className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                                {isSaving ? <SpinnerIcon className="w-5 h-5"/> : 'Save Log'}
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddCallLogModal;