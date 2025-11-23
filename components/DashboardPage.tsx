import React, { useMemo, useState, useRef, useEffect } from 'react';
import { School, Task, CallLog, Email, Note, CoachReportData, CoachChatMessage } from '../types';
import { SchoolIcon, TaskIcon, CallIcon, EmailIcon, NotesIcon } from './icons';
import { isOverdue, isDueInNext7Days, isToday, isThisWeek, parseUKDate, isInLast7Days, parseDurationToSeconds, parseUKDateTimeString, autoformatDateInput, safeArray } from '../utils';
import CoachDashboardWidget from './CoachDashboardWidget';
import PersonalPaDashboardWidget from './PersonalPaDashboardWidget';

interface DashboardPageProps {
  userName: string;
  schools: School[];
  tasks: Task[];
  notes: Note[];
  callLogs: CallLog[];
  emails: Email[];
  recentlyViewedSchools: School[];
  setActiveView: (view: string) => void;
  onSelectSchool: (school: School) => void;
  onUpdateTask: (task: Task) => void;
  coachReport: CoachReportData | null;
  coachChatHistory: CoachChatMessage[];
  onSendCoachMessage: (message: string) => void;
  isCoachResponding: boolean;
}

// Helper function to shuffle an array for the dynamic activity feed
const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; onClick?: () => void; }> = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
        className={`bg-slate-900 p-4 md:p-6 rounded-xl flex items-center ${onClick ? 'cursor-pointer hover:bg-slate-700 transition-all' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyPress={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const getTaskStatusClassName = (dueDate?: string): string => {
    if (isOverdue(dueDate)) {
        return 'border-l-4 border-red-500';
    }
    if (isDueInNext7Days(dueDate)) {
        return 'border-l-4 border-amber-500';
    }
    return 'border-l-4 border-emerald-500';
};

const getTaskDueDateClassName = (dueDate?: string): string => {
     if (isOverdue(dueDate)) {
        return 'text-red-500 font-semibold';
    }
    if (isDueInNext7Days(dueDate)) {
        return 'text-amber-400 font-semibold';
    }
    return 'text-emerald-500';
}

const DashboardPage: React.FC<DashboardPageProps> = ({ userName, schools, tasks, notes, callLogs, emails, recentlyViewedSchools, setActiveView, onSelectSchool, onUpdateTask, coachReport, coachChatHistory, onSendCoachMessage, isCoachResponding }) => {
    const [editingTask, setEditingTask] = useState<{ id: number; date: string } | null>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [displayedActivities, setDisplayedActivities] = useState<any[]>([]);

    useEffect(() => {
        if (editingTask && dateInputRef.current) {
            dateInputRef.current.focus();
        }
    }, [editingTask]);

    const handleSaveTaskDate = (task: Task) => {
        if (!editingTask) return;
    
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(editingTask.date) && editingTask.date !== '') {
            alert("Please use DD/MM/YYYY format or leave it blank.");
            return;
        }
    
        if (task.dueDate !== editingTask.date) {
            onUpdateTask({ ...task, dueDate: editingTask.date });
        }
        setEditingTask(null);
    };

    const { overdueTasksCount, callsLast7Days, emailsLast7Days, callsToday, callsThisWeek, averageCallDuration } = useMemo(() => {
        const safeTasks = safeArray(tasks);
        const safeCallLogs = safeArray(callLogs).filter(log => !!log.dateCalled);
        const safeEmails = safeArray(emails).filter(email => !!email.date);

        const computedOverdueTasks = safeTasks.filter(t => !t.isCompleted && isOverdue(t.dueDate)).length;

        const computedCallsLast7Days = safeCallLogs.filter(c => isInLast7Days(c.dateCalled)).length;
        const computedEmailsLast7Days = safeEmails.filter(e => e.direction === 'sent' && isInLast7Days(e.date)).length;
        const computedCallsToday = safeCallLogs.filter(c => isToday(c.dateCalled)).length;
        const computedCallsThisWeek = safeCallLogs.filter(c => isThisWeek(c.dateCalled)).length;

        const validDurationLogs = safeCallLogs.filter(log => log.duration && typeof log.duration === 'string');
        const averageDurationLabel = (() => {
            if (validDurationLogs.length === 0) return 'N/A';

            const totalSeconds = validDurationLogs.reduce((acc, log) => acc + parseDurationToSeconds(log.duration), 0);
            if (totalSeconds === 0) return '0s';

            const avgSeconds = Math.round(totalSeconds / validDurationLogs.length);
            const minutes = Math.floor(avgSeconds / 60);
            const seconds = avgSeconds % 60;

            if (minutes === 0 && seconds === 0) return '0s';
            if (minutes === 0) return `${seconds}s`;
            return `${minutes}m ${seconds}s`;
        })();

        return {
            overdueTasksCount: computedOverdueTasks,
            callsLast7Days: computedCallsLast7Days,
            emailsLast7Days: computedEmailsLast7Days,
            callsToday: computedCallsToday,
            callsThisWeek: computedCallsThisWeek,
            averageCallDuration: averageDurationLabel,
        };
    }, [tasks, callLogs, emails]);

    const allRecentActivities = useMemo(() => {
        const sortByDate = (a: { date: string }, b: { date: string }) => {
            const dateA = parseUKDateTimeString(a.date)?.getTime() || 0;
            const dateB = parseUKDateTimeString(b.date)?.getTime() || 0;
            return dateB - dateA;
        };
    
        const latestCalls = callLogs
            .map(c => ({
                type: 'call' as const,
                data: c,
                date: c.dateCalled,
                schoolName: c.schoolName,
                id: `call-${c.dateCalled}-${c.schoolName}-${c.notes.substring(0, 10)}`
            }))
            .sort(sortByDate)
            .slice(0, 5);
    
        const latestTasks = tasks
            .map(t => ({
                type: t.isCompleted ? 'taskCompleted' as const : 'taskCreated' as const,
                data: t,
                date: t.dateCreated,
                schoolName: t.schoolName,
                id: `task-${t.excelRowIndex}`
            }))
            .sort(sortByDate)
            .slice(0, 5);
    
        const latestNotes = notes
            .map(n => ({
                type: 'note' as const,
                data: n,
                date: n.date,
                schoolName: n.schoolName,
                id: `note-${n.excelRowIndex}`
            }))
            .sort(sortByDate)
            .slice(0, 5);
        
        const latestEmails = emails
            .map(e => ({
                type: 'email' as const,
                data: e,
                date: e.date,
                schoolName: e.schoolName,
                id: `email-${e.schoolName}-${e.subject}-${e.date}`
            }))
            .sort(sortByDate)
            .slice(0, 5);
        
        // This creates a guaranteed mixed pool of up to 20 recent activities
        return [...latestCalls, ...latestTasks, ...latestNotes, ...latestEmails];
    }, [tasks, callLogs, emails, notes]);

    useEffect(() => {
        const updateDisplayedActivities = () => {
            if (allRecentActivities.length > 0) {
                const shuffled = shuffleArray(allRecentActivities);
                setDisplayedActivities(shuffled.slice(0, 5));
            }
        };
    
        updateDisplayedActivities();
    
        const intervalId = setInterval(updateDisplayedActivities, 7000); // Cycle every 7 seconds
    
        return () => clearInterval(intervalId);
    }, [allRecentActivities]);


    const handleActivityClick = (schoolName: string) => {
        const school = schools.find(s => s.name === schoolName);
        if (school) {
            onSelectSchool(school);
        } else {
            console.warn(`School not found: ${schoolName}, navigating to schools list.`);
            setActiveView('Schools');
        }
    };

    const openTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);

  return (
    <div className="p-4 md:p-6 space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-slate-200">Welcome back, {userName.split(' ')[0]}!</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="My Schools" value={schools.length} icon={SchoolIcon} color="bg-sky-500" onClick={() => setActiveView('Schools')} />
        <StatCard title="Upcoming" value={tasks.filter(t => !t.isCompleted && !isOverdue(t.dueDate)).length} icon={TaskIcon} color="bg-amber-500" onClick={() => setActiveView('Tasks, Notes & Emails')} />
        <StatCard title="Outstanding" value={overdueTasksCount} icon={TaskIcon} color="bg-red-500" onClick={() => setActiveView('Tasks, Notes & Emails')} />
        <StatCard title="Calls (7d)" value={callsLast7Days} icon={CallIcon} color="bg-emerald-500" onClick={() => setActiveView('Calls')} />
        <StatCard title="Emails (7d)" value={emailsLast7Days} icon={EmailIcon} color="bg-rose-500" onClick={() => setActiveView('Tasks, Notes & Emails')} />
        <StatCard title="Calls Today" value={callsToday} icon={CallIcon} color="bg-indigo-500" onClick={() => setActiveView('Calls')} />
        <StatCard title="Calls This Week" value={callsThisWeek} icon={CallIcon} color="bg-purple-500" onClick={() => setActiveView('Calls')} />
        <StatCard title="Avg. Call Time" value={averageCallDuration} icon={CallIcon} color="bg-slate-500" onClick={() => setActiveView('Calls')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CoachDashboardWidget 
            callLogs={callLogs} 
            setActiveView={setActiveView} 
            coachReport={coachReport} 
            chatHistory={coachChatHistory}
            onSendMessage={onSendCoachMessage}
            isResponding={isCoachResponding}
        />
        <PersonalPaDashboardWidget setActiveView={setActiveView} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Tasks</h3>
            <ul className="space-y-3">
                {openTasks.slice(0, 5).map((task) => (
                     <li key={task.excelRowIndex} className={`flex items-center justify-between p-3 rounded-lg bg-slate-800 ${getTaskStatusClassName(task.dueDate)}`}>
                        <div className="flex-grow mr-4">
                            <p onClick={() => setActiveView('Tasks, Notes & Emails')} className="font-medium text-slate-200 hover:text-sky-400 cursor-pointer">{task.taskDescription}</p>
                            <p className="text-sm text-slate-400">
                                For: {task.schoolName}
                            </p>
                        </div>
                        {editingTask?.id === task.excelRowIndex ? (
                            <input
                                ref={dateInputRef}
                                type="text"
                                value={editingTask.date}
                                onChange={(e) => setEditingTask({ ...editingTask, date: autoformatDateInput(e.target.value) })}
                                onBlur={() => handleSaveTaskDate(task)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTaskDate(task);
                                    if (e.key === 'Escape') setEditingTask(null);
                                }}
                                className="text-sm bg-slate-700 text-white border border-sky-500 rounded-md px-2 py-1 w-28"
                                placeholder="DD/MM/YYYY"
                            />
                        ) : (
                            <button 
                                onClick={() => setEditingTask({ id: task.excelRowIndex, date: task.dueDate || '' })}
                                className={`text-sm text-left ${getTaskDueDateClassName(task.dueDate)}`}
                            >
                                {task.dueDate || 'Set Date'}
                            </button>
                        )}
                     </li>
                ))}
                {openTasks.length === 0 && <p className="text-slate-400">No open tasks found.</p>}
            </ul>
        </div>
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
             <ul className="space-y-4">
                {displayedActivities.map((activity) => {
                        let icon: React.ReactElement, text: React.ReactElement, date: string;

                        switch (activity.type) {
                            case 'taskCreated':
                                icon = <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mr-3 flex-shrink-0"><TaskIcon className="w-5 h-5 text-amber-400"/></div>;
                                text = <p className="text-sm text-slate-300">New task added for <span className="font-semibold text-white">{activity.schoolName}</span>.</p>;
                                date = (activity.data as Task).dateCreated;
                                break;
                            case 'taskCompleted':
                                icon = <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 flex-shrink-0"><TaskIcon className="w-5 h-5 text-emerald-400"/></div>;
                                text = <p className="text-sm text-slate-300">Task completed for <span className="font-semibold text-white">{activity.schoolName}</span>.</p>;
                                date = (activity.data as Task).dateCreated; // Date of completion is not available, use creation date
                                break;
                            case 'call':
                                icon = <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 flex-shrink-0"><CallIcon className="w-5 h-5 text-emerald-400"/></div>;
                                text = <p className="text-sm text-slate-300">Logged a call with <span className="font-semibold text-white">{activity.schoolName}</span>.</p>;
                                date = (activity.data as CallLog).dateCalled;
                                break;
                            case 'email':
                                icon = <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mr-3 flex-shrink-0"><EmailIcon className="w-5 h-5 text-rose-400"/></div>;
                                text = <p className="text-sm text-slate-300">Sent email to <span className="font-semibold text-white">{activity.schoolName}</span>.</p>;
                                date = (activity.data as Email).date;
                                break;
                            case 'note':
                                icon = <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 flex-shrink-0"><NotesIcon className="w-5 h-5 text-indigo-400"/></div>;
                                text = <p className="text-sm text-slate-300">Added a note for <span className="font-semibold text-white">{activity.schoolName}</span>.</p>;
                                date = (activity.data as Note).date;
                                break;
                            default:
                                return null;
                        }

                        return (
                            <li key={activity.id} className="flex items-start p-2 -m-2 rounded-lg cursor-pointer hover:bg-slate-800 activity-item-animate" onClick={() => handleActivityClick(activity.schoolName)}>
                                {icon}
                                <div>
                                    {text}
                                    <p className="text-xs text-slate-500">{date}</p>
                                </div>
                            </li>
                        );
                    })}
                {displayedActivities.length === 0 && <p className="text-slate-400">No recent activity to show.</p>}
            </ul>
        </div>
      </div>
      
      {recentlyViewedSchools.length > 0 && (
          <div className="bg-slate-900 p-4 md:p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recently Viewed</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recentlyViewedSchools.map(school => (
                    <button 
                        key={school.excelRowIndex} 
                        onClick={() => onSelectSchool(school)}
                        className="p-4 bg-slate-800 rounded-lg text-left hover:bg-slate-700 transition-colors"
                    >
                        <p className="font-semibold text-slate-200 truncate">{school.name}</p>
                        <p className="text-sm text-slate-400 truncate">{school.location}</p>
                    </button>
                ))}
            </div>
          </div>
      )}

      <style>
        {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(5px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .activity-item-animate {
              animation: fadeIn 0.5s ease-out forwards;
            }
        `}
      </style>
    </div>
  );
};

export default DashboardPage;