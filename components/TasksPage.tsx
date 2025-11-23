import React, { useMemo, useState } from 'react';
import { Task, School } from '../types';
import { AddIcon, EditIcon } from './icons';
import { isOverdue } from '../utils';

interface TasksPageProps {
  tasks: Task[];
  schools: School[];
  onToggleTask: (task: Task) => void;
  onOpenAddTaskModal: (task?: Task) => void;
  onSelectSchool: (school: School) => void;
}

const TaskCard: React.FC<{ task: Task; schools: School[]; onToggle: () => void; onEdit: () => void; onSelectSchool: (school: School) => void; }> = ({ task, schools, onToggle, onEdit, onSelectSchool }) => {
    const school = useMemo(() => schools.find(s => s.name === task.schoolName), [schools, task.schoolName]);

    const handleSchoolClick = () => {
        if (school) {
            onSelectSchool(school);
        } else {
            console.warn(`School not found: ${task.schoolName}`);
        }
    };
    
    return (
        <div className="flex items-start p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 group">
            <div className="flex-shrink-0 pt-1">
                <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    checked={task.isCompleted}
                    onChange={onToggle}
                />
            </div>
            <div className="flex-grow ml-4">
                <p className={`font-medium text-slate-800 ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>{task.taskDescription}</p>
                <button
                    type="button"
                    onClick={handleSchoolClick}
                    disabled={!school}
                    className={`text-sm font-semibold text-left text-sky-700 ${task.isCompleted ? 'text-sky-500' : ''} ${school ? 'hover:underline' : 'cursor-not-allowed'}`}
                    aria-label={`View profile for ${task.schoolName}`}
                >
                    {task.schoolName}
                </button>
                <div className={`mt-2 flex items-center flex-wrap gap-x-4 gap-y-2 text-xs ${task.isCompleted ? 'text-slate-400' : ''}`}>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">{task.type}</span>
                    <span className="font-semibold text-slate-600">Due: {task.dueDate || 'N/A'}</span>
                    <span className="text-slate-500">Manager: {task.accountManager}</span>
                </div>
            </div>
            <div className="flex-shrink-0 ml-4 self-center">
                <button 
                    onClick={onEdit}
                    className="p-2 text-slate-500 hover:text-sky-600 rounded-full hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Edit task: ${task.taskDescription}`}
                    title="Edit Task"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


const TasksPage: React.FC<TasksPageProps> = ({ tasks, schools, onToggleTask, onOpenAddTaskModal, onSelectSchool }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  const { upcomingTasks, overdueTasks, completedTasks } = useMemo(() => {
    const openTasks = tasks.filter(t => !t.isCompleted);
    const completed = tasks.filter(t => t.isCompleted);

    return {
      upcomingTasks: openTasks.filter(t => !isOverdue(t.dueDate)),
      overdueTasks: openTasks.filter(t => isOverdue(t.dueDate)),
      completedTasks: completed,
    };
  }, [tasks]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
        <button 
            onClick={() => onOpenAddTaskModal()}
            className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
            <AddIcon className="w-5 h-5 mr-2"/>
            Add Task
        </button>
      </div>
      
      <div className="space-y-8">
        <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Upcoming Tasks ({upcomingTasks.length})</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task) => <TaskCard key={task.excelRowIndex} task={task} schools={schools} onToggle={() => onToggleTask(task)} onEdit={() => onOpenAddTaskModal(task)} onSelectSchool={onSelectSchool} />)
                ) : (
                    <p className="text-slate-500 p-4">No upcoming tasks.</p>
                )}
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-red-700 mb-4">Overdue Tasks ({overdueTasks.length})</h3>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                 {overdueTasks.length > 0 ? (
                    overdueTasks.map((task) => <TaskCard key={task.excelRowIndex} task={task} schools={schools} onToggle={() => onToggleTask(task)} onEdit={() => onOpenAddTaskModal(task)} onSelectSchool={onSelectSchool} />)
                 ) : (
                    <p className="text-slate-500 p-4">No overdue tasks. Great job!</p>
                 )}
            </div>
        </div>

        <div>
            <button 
                onClick={() => setShowCompleted(!showCompleted)} 
                className="text-lg font-semibold text-slate-700 mb-4 hover:text-sky-600 transition-colors"
            >
                {showCompleted ? '▼' : '►'} Completed Tasks ({completedTasks.length})
            </button>
            {showCompleted && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    {completedTasks.length > 0 ? (
                        completedTasks.map((task) => <TaskCard key={task.excelRowIndex} task={task} schools={schools} onToggle={() => onToggleTask(task)} onEdit={() => onOpenAddTaskModal(task)} onSelectSchool={onSelectSchool} />)
                    ) : (
                        <p className="text-slate-500 p-4">No completed tasks.</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;