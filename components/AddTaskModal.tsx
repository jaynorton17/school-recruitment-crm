import React, { useState, useEffect } from 'react';
import { Task, School } from '../types';
import { SpinnerIcon } from './icons';
import { autoformatDateInput } from '../utils';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Task>) => void;
    school?: School | null;
    schools?: School[];
    taskToEdit?: Partial<Task> | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSubmit, school, schools, taskToEdit}) => {
    const [task, setTask] = useState<Partial<Task>>({});
    const isEditMode = !!taskToEdit;

    useEffect(() => {
        if (isOpen) {
            setTask({
                schoolName: taskToEdit?.schoolName || school?.name || '',
                taskDescription: taskToEdit?.taskDescription || '',
                type: taskToEdit?.type || 'General or other',
                dueDate: taskToEdit?.dueDate || '',
                dueTime: taskToEdit?.dueTime || '',
                reminderDate: undefined, // Obsolete field
            });
        }
    }, [isOpen, school, taskToEdit]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'dueDate' ? autoformatDateInput(value) : value;
        setTask(prev => ({...prev, [name]: finalValue}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!task.taskDescription?.trim() || (!school && !task.schoolName && !isEditMode)) {
            alert("Task description and school are required.");
            return;
        };
        
        onSubmit(task);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">{isEditMode ? 'Edit Task' : 'Add New Task'}</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300">School</label>
                        {(school || isEditMode) ? (
                             <input type="text" value={task.schoolName} disabled className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-slate-400 cursor-not-allowed" />
                        ) : (
                            <select name="schoolName" value={task.schoolName || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required>
                                <option value="" disabled>Select a school</option>
                                {schools?.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Task Description</label>
                        <input type="text" name="taskDescription" value={task.taskDescription || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Type</label>
                        <select name="type" value={task.type || 'General or other'} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white">
                            <option>Follow-up</option>
                            <option>Phone call</option>
                            <option>Email</option>
                            <option>Action</option>
                            <option>Reminder</option>
                            <option>General or other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Due Date</label>
                            <input type="text" placeholder="DD/MM/YYYY" name="dueDate" value={task.dueDate || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Due Time</label>
                            <input type="time" name="dueTime" value={task.dueTime || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={!task.taskDescription?.trim() || (!school && !task.schoolName && !isEditMode)} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                           {isEditMode ? 'Save Changes' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;