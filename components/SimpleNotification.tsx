import React, { useEffect } from 'react';

interface SimpleNotificationProps {
    notification: { message: string, type: 'success' | 'info' | 'error' } | null;
    onDismiss: () => void;
}

const SimpleNotification: React.FC<SimpleNotificationProps> = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000); // Auto-dismiss after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    if (!notification) return null;

    const baseClasses = "fixed top-5 right-5 z-[200] px-6 py-4 rounded-lg shadow-lg text-white font-semibold transform transition-all duration-300";
    let typeClasses = "";
    switch (notification.type) {
        case 'success': typeClasses = 'bg-emerald-500'; break;
        case 'info': typeClasses = 'bg-sky-500'; break;
        case 'error': typeClasses = 'bg-red-500'; break;
    }

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            {notification.message}
        </div>
    );
};

export default SimpleNotification;
