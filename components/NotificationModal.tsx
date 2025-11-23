import React, { useEffect, useRef } from 'react';
import { Task } from '../types';
import { CloseIcon } from './icons';

interface NotificationModalProps {
    task: Task;
    onSnooze: (taskId: number, minutes: number) => void;
    onDismiss: () => void;
    onComplete: (task: Task) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ task, onSnooze, onDismiss, onComplete }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all animate-fade-in-up">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-sky-600">Task Reminder</h2>
                        <p className="text-sm text-slate-500 mt-1">Due at {task.dueTime} on {task.dueDate}</p>
                    </div>
                    <button onClick={onDismiss} className="p-1 text-slate-400 hover:text-slate-600">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-800 text-lg">{task.taskDescription}</p>
                    <p className="text-md text-slate-600 mt-1">{task.schoolName}</p>
                </div>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onDismiss} 
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                    >
                        Actioned
                    </button>
                    <button 
                        onClick={() => onSnooze(task.excelRowIndex, 5)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                    >
                        Snooze (5 min)
                    </button>
                    <button 
                        onClick={() => onSnooze(task.excelRowIndex, 10)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                    >
                        Snooze (10 min)
                    </button>
                     <button 
                        onClick={() => onComplete(task)}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                    >
                        Completed
                    </button>
                </div>
                <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-clear-announce-tones-2861.mp3" preload="auto" />
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default NotificationModal;
