import React from 'react';
import { JobAlert } from '../types';
import { CloseIcon, JobAlertsIcon } from './icons';

interface JobAlertNotificationProps {
    notifications: JobAlert[];
    onDismiss: (jobId: number) => void;
}

const JobAlertNotification: React.FC<JobAlertNotificationProps> = ({ notifications, onDismiss }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-5 z-[200] space-y-2 w-80">
            {notifications.map(job => (
                <div key={job.excelRowIndex} className="bg-sky-500 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 animate-fade-in-right">
                    <JobAlertsIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="flex-grow">
                        <p className="font-bold">New Job Alert!</p>
                        <p className="text-sm">{job.jobTitle} at {job.schoolName}</p>
                    </div>
                    <button onClick={() => onDismiss(job.excelRowIndex)} className="p-1 rounded-full hover:bg-white/20">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
             <style>{`
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default JobAlertNotification;
