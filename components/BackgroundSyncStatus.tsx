import React, { useEffect } from 'react';
import { SpinnerIcon, CheckIcon, ExclamationIcon } from './icons';

export interface BackgroundTask {
    id: string;
    message: string;
    status: 'pending' | 'success' | 'error';
}

interface BackgroundSyncStatusProps {
    tasks: BackgroundTask[];
    onDismiss: (taskId: string) => void;
}

const TaskNotification: React.FC<{ task: BackgroundTask; onDismiss: (id: string) => void; }> = ({ task, onDismiss }) => {
    useEffect(() => {
        if (task.status === 'success') {
            const timer = setTimeout(() => {
                onDismiss(task.id);
            }, 3000); // Auto-dismiss success after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [task.status, task.id, onDismiss]);

    const getStatusStyles = () => {
        switch (task.status) {
            case 'pending':
                return { bg: 'bg-slate-700', icon: <SpinnerIcon className="w-5 h-5 text-sky-400" />, text: 'text-slate-300' };
            case 'success':
                return { bg: 'bg-emerald-600', icon: <CheckIcon className="w-5 h-5 text-white" />, text: 'text-white' };
            case 'error':
                return { bg: 'bg-red-600', icon: <ExclamationIcon className="w-5 h-5 text-white" />, text: 'text-white' };
        }
    };

    const { bg, icon, text } = getStatusStyles();

    return (
        <div className={`flex items-center p-3 rounded-lg shadow-lg ${bg} animate-fade-in`}>
            <div className="flex-shrink-0 mr-3">{icon}</div>
            <p className={`text-sm font-medium flex-grow ${text}`}>{task.message}</p>
            {task.status === 'error' && (
                <button onClick={() => onDismiss(task.id)} className="ml-2 text-white/70 hover:text-white text-xl font-bold">&times;</button>
            )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

const BackgroundSyncStatus: React.FC<BackgroundSyncStatusProps> = ({ tasks, onDismiss }) => {
    if (tasks.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[200] space-y-2 w-64">
            {tasks.map(task => (
                <TaskNotification key={task.id} task={task} onDismiss={onDismiss} />
            ))}
        </div>
    );
};


export default BackgroundSyncStatus;