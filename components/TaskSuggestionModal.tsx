import React, { useState, useEffect, useRef } from 'react';
import { SuggestedTask, AiEmailDraft } from '../types';
import { TaskIcon, CheckIcon, CloseIcon, AiIcon, SendIcon, SpinnerIcon, ExclamationIcon } from './icons';
import { autoformatDateInput } from '../utils';

interface TaskSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (editedNotes: string) => void;
    suggestions: SuggestedTask[];
    schoolName: string;
    notes: string;
    onAccept: (task: SuggestedTask) => void;
    onDecline: (taskId: string) => void;
    email: AiEmailDraft | null;
    onSendEmail: (subject: string, body: string) => Promise<boolean>;
}

const TaskSuggestionModal: React.FC<TaskSuggestionModalProps> = ({ isOpen, onClose, onSave, suggestions, schoolName, notes, onAccept, onDecline, email, onSendEmail }) => {
    const [editedNotes, setEditedNotes] = useState(notes);
    const [editableSuggestions, setEditableSuggestions] = useState<SuggestedTask[]>([]);
    const [editedSubject, setEditedSubject] = useState('');
    const [editedBody, setEditedBody] = useState('');
    const bodyRef = useRef<HTMLDivElement>(null);
    const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        if (isOpen) {
            setEditedNotes(notes);
            // Create a deep copy to allow for local edits without affecting parent state until 'Accept'
            setEditableSuggestions(JSON.parse(JSON.stringify(suggestions)));
            setEditedSubject(email?.subject || '');
            setEditedBody(email?.body || '');
            setEmailSendStatus('idle');
        }
    }, [isOpen, notes, suggestions, email]);

    useEffect(() => {
        // This effect manages the content of the editable div.
        // It prevents the cursor from jumping by only updating the innerHTML
        // if the state (`editedBody`) is different from the DOM content.
        if (bodyRef.current && bodyRef.current.innerHTML !== editedBody) {
            bodyRef.current.innerHTML = editedBody;
        }
    }, [editedBody]);


    if (!isOpen) {
        return null;
    }
    
    const handleSaveAndClose = () => {
        onSave(editedNotes);
    };
    
    const handleTaskChange = (taskId: string, field: 'description' | 'dueDate' | 'dueTime', value: string) => {
        setEditableSuggestions(prev => 
            prev.map(task => {
                if (task.id === taskId) {
                    const newValue = field === 'dueDate' ? autoformatDateInput(value) : value;
                    return { ...task, [field]: newValue };
                }
                return task;
            })
        );
    };

    const handleAcceptTask = (taskToAccept: SuggestedTask) => {
        onAccept(taskToAccept);
        // Remove from local state to reflect it's been handled
        setEditableSuggestions(prev => prev.filter(t => t.id !== taskToAccept.id));
    };

    const handleDeclineTask = (taskId: string) => {
        onDecline(taskId);
        // Remove from local state
        setEditableSuggestions(prev => prev.filter(t => t.id !== taskId));
    };

    const handleSend = async () => {
        setEmailSendStatus('sending');
        const currentBody = bodyRef.current?.innerHTML || '';
        const success = await onSendEmail(editedSubject, currentBody);
        if (success) {
            setEmailSendStatus('sent');
        } else {
            setEmailSendStatus('error');
            // Reset after a delay so user can try again
            setTimeout(() => setEmailSendStatus('idle'), 3000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-start flex-shrink-0">
                    <div className="mr-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                            <AiIcon className="h-6 w-6 text-sky-600" aria-hidden="true" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">AI Suggestions</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Generated from your call with {schoolName}. Review, edit, and action the suggestions below.
                        </p>
                    </div>
                </div>
                
                <div className="my-4 flex-grow overflow-y-auto space-y-4 pr-2">
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-2">Generated Notes (Editable)</h3>
                        <div className="p-1 bg-slate-50 border border-slate-200 rounded-lg">
                           <textarea
                                value={editedNotes}
                                onChange={(e) => setEditedNotes(e.target.value)}
                                className="w-full h-24 p-2 text-sm text-slate-800 bg-transparent border-none focus:ring-1 focus:ring-sky-500 resize-y rounded-md"
                            />
                        </div>
                    </div>

                    {email && (
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2">Draft Email</h3>
                            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <input
                                    type="text"
                                    value={editedSubject}
                                    onChange={(e) => setEditedSubject(e.target.value)}
                                    placeholder="Email Subject"
                                    className="font-semibold text-slate-800 bg-white border border-slate-300 focus:border-sky-500 outline-none w-full p-2 rounded-md"
                                />
                                <div
                                    ref={bodyRef}
                                    onInput={e => setEditedBody(e.currentTarget.innerHTML)}
                                    contentEditable={true}
                                    className="w-full h-40 p-2 text-sm text-slate-800 bg-white border border-slate-300 focus:ring-1 focus:ring-sky-500 resize-y rounded-md overflow-y-auto"
                                />
                                <button 
                                    type="button"
                                    onClick={handleSend}
                                    disabled={emailSendStatus !== 'idle'}
                                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-70 disabled:cursor-wait transition-colors"
                                >
                                    {emailSendStatus === 'sending' && <SpinnerIcon className="w-4 h-4 mr-2" />}
                                    {emailSendStatus === 'sent' && <CheckIcon className="w-4 h-4 mr-2" />}
                                    {emailSendStatus === 'error' && <ExclamationIcon className="w-4 h-4 mr-2" />}
                                    {emailSendStatus === 'idle' && <SendIcon className="w-4 h-4 mr-2" />}
                                    {emailSendStatus === 'idle' && 'Send Email'}
                                    {emailSendStatus === 'sending' && 'Sending...'}
                                    {emailSendStatus === 'sent' && 'Email Sent!'}
                                    {emailSendStatus === 'error' && 'Send Failed'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-2">Suggested Tasks ({editableSuggestions.length})</h3>
                        {editableSuggestions.length > 0 ? (
                            <div className="space-y-2">
                                {editableSuggestions.map(task => (
                                    <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <input
                                                type="text"
                                                value={task.description}
                                                onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                                                className="font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-sky-500 outline-none w-full"
                                            />
                                            <div className="flex space-x-2 self-center flex-shrink-0">
                                                <button
                                                    onClick={() => handleDeclineTask(task.id)}
                                                    className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200"
                                                    aria-label="Decline Task"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptTask(task)}
                                                    className="p-2 text-emerald-600 bg-emerald-100 rounded-full hover:bg-emerald-200"
                                                    aria-label="Accept Task"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Due Date (DD/MM/YYYY)"
                                                value={task.dueDate || ''}
                                                onChange={(e) => handleTaskChange(task.id, 'dueDate', e.target.value)}
                                                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 w-full"
                                            />
                                            <input
                                                type="time"
                                                value={task.dueTime || ''}
                                                onChange={(e) => handleTaskChange(task.id, 'dueTime', e.target.value)}
                                                className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 w-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No remaining tasks to review.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t flex-shrink-0">
                    <button 
                        onClick={handleSaveAndClose} 
                        className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        Save Notes & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskSuggestionModal;