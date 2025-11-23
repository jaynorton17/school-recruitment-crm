

import React, { useState, useEffect, useMemo } from 'react';
import { Mapping } from '../types';
import { LockIcon, UnlockIcon, EditIcon, TrashIcon, CheckIcon, CloseIcon, AddIcon, RefreshIcon, SpinnerIcon, ExclamationIcon, SearchIcon } from './icons';

const ADMIN_PASSWORD = "Footballt2!";

const initialMappings: Mapping[] = [
    // Schools Sheet
    { id: 'school_name', crmField: 'School Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'A' },
    { id: 'school_location', crmField: 'Location', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'B' },
    { id: 'school_contactNumber', crmField: 'Contact Number', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'C' },
    { id: 'school_accountManager', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'D' },
    { id: 'school_coverManager', crmField: 'Cover Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'E' },
    { id: 'school_email', crmField: 'Email', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'F' },
    { id: 'school_contact2', crmField: 'Contact 2', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'G' },
    { id: 'school_contact2Email', crmField: 'Contact 2 Email', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'H' },
    { id: 'school_spokeToCoverManager', crmField: 'Spoke to Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'I' },
    { id: 'school_emailName', crmField: 'Email Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'J' },
    { id: 'school_switchboard', crmField: 'Switchboard', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'K' },
    { id: 'school_engagementScore', crmField: 'Engagement Score', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Schools', column: 'L' },
    
    // Task Sheet
    { id: 'task_schoolName', crmField: 'School Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'A' },
    { id: 'task_type', crmField: 'Type', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'B' },
    { id: 'task_phoneNumber', crmField: 'Phone Number', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'C' },
    { id: 'task_accountManager', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'D' },
    { id: 'task_coverManager', crmField: 'Cover Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'E' },
    { id: 'task_coverManagerEmail', crmField: 'Cover Manager Email', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'F' },
    { id: 'task_contact2', crmField: 'Contact 2', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'G' },
    { id: 'task_contact2Email', crmField: 'Contact 2 Email', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'H' },
    { id: 'task_dateCreated', crmField: 'Date Created', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'I' },
    { id: 'task_taskDescription', crmField: 'Description', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'J' },
    { id: 'task_dueDate', crmField: 'Due Date', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'K' },
    { id: 'task_dueTime', crmField: 'Due Time', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'M' },
    { id: 'task_isCompleted', crmField: 'Completed', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Task', column: 'N' },

    // Notes Sheet
    { id: 'note_schoolName', crmField: 'School Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'A' },
    { id: 'note_accountManager', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'B' },
    { id: 'note_coverManager', crmField: 'Cover Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'C' },
    { id: 'note_contact2', crmField: 'Contact 2', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'D' },
    { id: 'note_date', crmField: 'Date', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'E' },
    { id: 'note_note', crmField: 'Note Text', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Notes', column: 'F' },

    // Email Sheet
    { id: 'email_schoolName', crmField: 'School Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'A' },
    { id: 'email_accountManager', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'B' },
    { id: 'email_coverManager', crmField: 'Cover Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'C' },
    { id: 'email_date', crmField: 'Date', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'D' },
    { id: 'email_subject', crmField: 'Subject', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'E' },
    { id: 'email_body', crmField: 'Body', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Email', column: 'F' },

    // Call Log Sheet
    { id: 'call_schoolName', crmField: 'School Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'A' },
    { id: 'call_location', crmField: 'Location', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'B' },
    { id: 'call_phoneNumber', crmField: 'Phone Number', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'C' },
    { id: 'call_accountManager', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'D' },
    { id: 'call_contactCalled', crmField: 'Contact Called', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'E' },
    { id: 'call_dateCalled', crmField: 'Date Called', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'F' },
    { id: 'call_spokeTo', crmField: 'Spoke To', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'G' },
    { id: 'call_duration', crmField: 'Duration', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'H' },
    { id: 'call_notes', crmField: 'Notes', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'I' },
    { id: 'call_transcript', crmField: 'Transcript', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Call Log', column: 'J' },

    // Users Sheet
    { id: 'user_firstName', crmField: 'First Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'A' },
    { id: 'user_lastName', crmField: 'Last Name', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'B' },
    { id: 'user_email', crmField: 'Email', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'C' },
    { id: 'user_mobile', crmField: 'Mobile Number', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'D' },
    { id: 'user_address', crmField: 'Address', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'E' },
    { id: 'user_lastSeen', crmField: 'Last Seen', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'F' },
    { id: 'user_status', crmField: 'Status', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Users', column: 'G' },

    // Announcements Sheet
    { id: 'announcement_author', crmField: 'Account Manager', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Announcements', column: 'A' },
    { id: 'announcement_title', crmField: 'Title', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Announcements', column: 'B' },
    { id: 'announcement_message', crmField: 'Message', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Announcements', column: 'C' },
    { id: 'announcement_date', crmField: 'Date and Time', spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx', sheetName: 'Announcements', column: 'D' },
];

interface AdminMappingManagerProps {
    isJayNortonAdminView: boolean;
    onToggleJayNortonView: () => void;
    isJoshColeAdminView: boolean;
    onToggleJoshColeView: () => void;
    isSuperAdmin: boolean;
    isJayNorton: boolean;
    isJoshCole: boolean;
}

const AdminMappingManager: React.FC<AdminMappingManagerProps> = ({
    isJayNortonAdminView,
    onToggleJayNortonView,
    isJoshColeAdminView,
    onToggleJoshColeView,
    isSuperAdmin,
    isJayNorton,
    isJoshCole,
}) => {
    const [mappings, setMappings] = useState(initialMappings);

    const handleAddMapping = () => {
        // FIX: The original code likely had an incomplete object, causing the type error.
        // This is a corrected implementation that provides all required fields for the Mapping type.
        const newMapping: Mapping = {
            id: 'new-mapping-' + Date.now(),
            crmField: 'New CRM Field',
            spreadsheet: 'cover_manager_tracker_API_MASTER.xlsx',
            sheetName: 'New Sheet',
            column: 'A',
        };
        setMappings(prev => [...prev, newMapping]);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400">Manage spreadsheet mappings.</p>
            <div className="mt-4 space-y-2">
                {isJayNorton && (
                    <label className="flex items-center space-x-2 text-white">
                        <input
                            type="checkbox"
                            checked={isJayNortonAdminView}
                            onChange={onToggleJayNortonView}
                        />
                        <span>Enable Admin View for Jay Norton</span>
                    </label>
                )}
                 {isJoshCole && (
                    <label className="flex items-center space-x-2 text-white">
                        <input
                            type="checkbox"
                            checked={isJoshColeAdminView}
                            onChange={onToggleJoshColeView}
                        />
                        <span>Enable Admin View for Josh Cole</span>
                    </label>
                )}
                 {isSuperAdmin && (
                    <p className="text-emerald-400">Super admin mode is active.</p>
                 )}
            </div>
        </div>
    );
};

export default AdminMappingManager;