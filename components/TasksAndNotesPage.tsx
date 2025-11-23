import React, { useMemo, useState } from 'react';
import { Task, Note, School, User, Email } from '../types';
import { AddIcon, CheckIcon, ExclamationIcon, CheckDocumentIcon, DocumentTextIcon, SearchIcon, AiIcon, EditIcon, TrashIcon, SendIcon, ResponseIcon } from './icons';
import { isOverdue, isToday, isThisWeek, parseUKDate, parseUKDateTimeString, getInitials, getInitialsColor } from '../utils';

interface TasksAndNotesPageProps {
  tasks: Task[];
  notes: Note[];
  emails: Email[];
  schools: School[];
  user: { name: string; email: string; };
  onToggleTask: (task: Task) => void;
  // FIX: Changed 'task' parameter from 'Task' to 'Partial<Task>' to match the handler function signature in App.tsx and ensure type compatibility across the app.
  onOpenAddTaskModal: (task?: Partial<Task>) => void;
  onOpenAddNoteModal: (school?: School, note?: Note) => void;
  onSelectSchool: (school: School) => void;
  onDeleteTask: (task: Task) => void;
  onDeleteNote: (note: Note) => void;
  isSuperAdmin: boolean;
}

const KpiCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string; onClick?: () => void; }> = ({ title, value, icon: Icon, color, onClick }) => (
    <div onClick={onClick} className={`p-4 rounded-xl flex items-start text-white ${color} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}>
        <div className="p-3 rounded-lg bg-black/20 mr-4">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium">{title}</p>
        </div>
    </div>
);

const getTaskDueDateClassName = (dueDate?: string): string => {
    if (isOverdue(dueDate)) return 'text-amber-400 font-semibold';
    if (isToday(dueDate)) return 'text-sky-400 font-semibold';
    return 'text-slate-400';
};

type TaskFilter = 'All' | 'Today' | 'Overdue' | 'Completed';

const TasksAndNotesPage: React.FC<TasksAndNotesPageProps> = ({ tasks, notes, emails, schools, user, onToggleTask, onOpenAddTaskModal, onOpenAddNoteModal, onSelectSchool, onDeleteTask, onDeleteNote, isSuperAdmin }) => {
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('All');
    const [noteSearch, setNoteSearch] = useState('');
    const [emailSearch, setEmailSearch] = useState('');
    
    const kpiData = useMemo(() => {
        const tasksDueToday = tasks.filter(t => !t.isCompleted && isToday(t.dueDate)).length;
        const overdueTasks = tasks.filter(t => !t.isCompleted && isOverdue(t.dueDate)).length;
        const completedThisWeek = tasks.filter(t => {
            return t.isCompleted && isThisWeek(t.dateCreated);
        }).length;
        const totalNotes = notes.length;
        return { tasksDueToday, overdueTasks, completedThisWeek, totalNotes };
    }, [tasks, notes]);

    const filteredTasks = useMemo(() => {
        switch(taskFilter) {
            case 'Today':
                return tasks.filter(t => !t.isCompleted && isToday(t.dueDate));
            case 'Overdue':
                return tasks.filter(t => !t.isCompleted && isOverdue(t.dueDate));
            case 'Completed':
                return tasks.filter(t => t.isCompleted).sort((a,b) => (parseUKDateTimeString(b.dateCreated)?.getTime() || 0) - (parseUKDateTimeString(a.dateCreated)?.getTime() || 0));
            case 'All':
            default:
                const openTasks = tasks.filter(t => !t.isCompleted);
                return openTasks.sort((a,b) => (parseUKDate(a.dueDate)?.getTime() || Infinity) - (parseUKDate(b.dueDate)?.getTime() || Infinity));
        }
    }, [tasks, taskFilter]);

    const filteredNotes = useMemo(() => {
        const sortedNotes = [...notes].sort((a, b) => (parseUKDateTimeString(b.date)?.getTime() || 0) - (parseUKDateTimeString(a.date)?.getTime() || 0));

        if (!noteSearch.trim()) return sortedNotes;
        const lowerSearch = noteSearch.toLowerCase();
        return sortedNotes.filter(n => 
            n.note.toLowerCase().includes(lowerSearch) ||
            n.schoolName.toLowerCase().includes(lowerSearch) ||
            n.accountManager.toLowerCase().includes(lowerSearch)
        );
    }, [notes, noteSearch]);

    const filteredEmails = useMemo(() => {
        const sortedEmails = [...emails].sort((a, b) => (parseUKDateTimeString(b.date)?.getTime() || 0) - (parseUKDateTimeString(a.date)?.getTime() || 0));

        if (!emailSearch.trim()) return sortedEmails;
        const lowerSearch = emailSearch.toLowerCase();
        return sortedEmails.filter(e =>
            e.schoolName.toLowerCase().includes(lowerSearch) ||
            e.coverManager.toLowerCase().includes(lowerSearch) ||
            e.subject.toLowerCase().includes(lowerSearch) ||
            (e.body || '').toLowerCase().includes(lowerSearch)
        );
    }, [emails, emailSearch]);

    const handleSchoolClick = (schoolName: string) => {
        const school = schools.find(s => s.name === schoolName);
        if (school) onSelectSchool(school);
    };

    return (
        <div className="p-4 md:p-6 bg-slate-800 text-slate-200">
            <h1 className="text-2xl font-bold text-white mb-6">Tasks, Notes & Emails</h1>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Due Today" value={kpiData.tasksDueToday} icon={CheckIcon} color="bg-gradient-to-br from-amber-500 to-amber-600" onClick={() => setTaskFilter('Today')} />
                <KpiCard title="Overdue" value={kpiData.overdueTasks} icon={ExclamationIcon} color="bg-gradient-to-br from-red-500 to-red-600" onClick={() => setTaskFilter('Overdue')} />
                <KpiCard title="Completed (Wk)" value={kpiData.completedThisWeek} icon={CheckDocumentIcon} color="bg-gradient-to-br from-emerald-500 to-emerald-600" onClick={() => setTaskFilter('Completed')} />
                <KpiCard title="Total Notes" value={kpiData.totalNotes} icon={DocumentTextIcon} color="bg-gradient-to-br from-sky-500 to-sky-600" />
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tasks Column */}
                    <div className="bg-slate-900 rounded-xl p-4 flex flex-col border border-slate-700 h-[60vh]">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
                            <h2 className="text-lg font-semibold text-white">Tasks</h2>
                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs sm:text-sm">
                                    {(['All', 'Today', 'Overdue', 'Completed'] as TaskFilter[]).map(filter => (
                                        <button key={filter} onClick={() => setTaskFilter(filter)} className={`px-2 sm:px-3 py-1 font-semibold rounded-md transition-colors text-center ${taskFilter === filter ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{filter}</button>
                                    ))}
                                </div>
                                <button onClick={() => onOpenAddTaskModal()} className="flex items-center bg-sky-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors text-sm">
                                    <AddIcon className="w-4 h-4 mr-2"/>
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                            {filteredTasks.map(task => (
                                <div key={task.excelRowIndex} className={`p-3 rounded-lg flex items-start gap-3 transition-colors group ${task.isCompleted ? 'bg-slate-800/50' : 'bg-slate-800 hover:bg-slate-700/50'}`}>
                                    <input type="checkbox" checked={task.isCompleted} onChange={() => onToggleTask(task)} className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer mt-0.5"/>
                                    <div className="flex-grow">
                                        <p className={`font-medium ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.taskDescription}</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <p onClick={() => handleSchoolClick(task.schoolName)} className="cursor-pointer hover:underline">{task.schoolName}</p>
                                            {isSuperAdmin && (
                                                <>
                                                    <span className="text-slate-600">&middot;</span>
                                                    <span>{task.accountManager}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onOpenAddTaskModal(task)} className="p-1 text-slate-500 hover:text-sky-400">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDeleteTask(task)} className="p-1 text-slate-500 hover:text-red-400">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <span className={`text-sm ${getTaskDueDateClassName(task.dueDate)}`}>{task.dueDate}</span>
                                    </div>
                                </div>
                            ))}
                             {filteredTasks.length === 0 && <p className="text-center text-slate-500 pt-8">No tasks found for this filter.</p>}
                        </div>
                    </div>

                    {/* Notes Column */}
                    <div className="bg-slate-900 rounded-xl p-4 flex flex-col border border-slate-700 h-[60vh]">
                         <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
                            <h2 className="text-lg font-semibold text-white">Notes</h2>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                 <div className="relative flex-grow">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                    <input type="text" placeholder="Search..." value={noteSearch} onChange={e => setNoteSearch(e.target.value)} className="pl-9 pr-3 py-1.5 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                                </div>
                                <button onClick={() => onOpenAddNoteModal()} className="flex items-center bg-sky-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors text-sm">
                                    <AddIcon className="w-4 h-4 mr-2"/>
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                             {filteredNotes.map(note => (
                                <div key={note.excelRowIndex} className="p-3 rounded-lg bg-slate-800 flex items-start gap-3 group">
                                    {note.source === 'ai' ? (
                                        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <AiIcon className="w-5 h-5 text-sky-400" />
                                        </div>
                                    ) : (
                                        <div className={`w-8 h-8 rounded-full ${getInitialsColor(note.accountManager)} flex items-center justify-center font-bold text-xs text-white flex-shrink-0 mt-0.5`}>
                                            {getInitials(note.accountManager)}
                                        </div>
                                    )}
                                    
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-semibold text-white">{note.source === 'ai' ? `${user.name} (AI-generated)` : note.accountManager}</p>
                                            <div className="flex items-center">
                                                <p className="text-xs text-slate-500">{note.date.split(' ')[0]}</p>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                    <button onClick={() => onOpenAddNoteModal(undefined, note)} className="p-1 text-slate-500 hover:text-sky-400">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onDeleteNote(note)} className="p-1 text-slate-500 hover:text-red-400">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300 mt-1">{note.note}</p>
                                        <p onClick={() => handleSchoolClick(note.schoolName)} className="text-xs text-sky-400 mt-1 cursor-pointer hover:underline">{note.schoolName}</p>
                                    </div>
                                </div>
                             ))}
                             {filteredNotes.length === 0 && <p className="text-center text-slate-500 pt-8">No notes found.</p>}
                        </div>
                    </div>
                </div>

                {/* Emails Section */}
                <div className="bg-slate-900 rounded-xl p-4 flex flex-col border border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-white">Emails</h2>
                        <div className="relative flex-grow sm:flex-grow-0">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                            <input type="text" placeholder="Search emails..." value={emailSearch} onChange={e => setEmailSearch(e.target.value)} className="pl-9 pr-3 py-1.5 w-full sm:w-64 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {filteredEmails.length > 0 ? filteredEmails.map((email, index) => {
                            const isSent = email.direction === 'sent';
                            return (
                                <details key={index} className="p-3 rounded-lg bg-slate-800 group">
                                    <summary className="list-none cursor-pointer">
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${isSent ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`}>
                                                {isSent ? <SendIcon className="w-5 h-5 text-sky-400" /> : <ResponseIcon className="w-5 h-5 text-emerald-400" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <p className="font-semibold text-slate-300 truncate" title={email.subject}>{email.subject}</p>
                                                    <p className="text-xs text-slate-500 flex-shrink-0 ml-4">{email.date.split(' ')[0]}</p>
                                                </div>
                                                <p className="text-sm text-slate-400 truncate">
                                                    <span className="font-semibold">{isSent ? 'To: ' : 'From: '}</span>
                                                    {email.coverManager} ({email.schoolName})
                                                </p>
                                            </div>
                                        </div>
                                    </summary>
                                    <div className="mt-2 pl-12">
                                        <div className="mt-2 p-3 bg-slate-900 rounded max-h-60 overflow-y-auto text-sm text-slate-300 email-body" dangerouslySetInnerHTML={{ __html: email.body }}></div>
                                    </div>
                                </details>
                            );
                        }) : (
                            <div className="text-center py-8 text-slate-500">
                                <p>No emails match your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .email-body * { all: revert; color: inherit; }
                .email-body a { color: #38bdf8; text-decoration: underline; }
            `}</style>
        </div>
    );
};

export default TasksAndNotesPage;