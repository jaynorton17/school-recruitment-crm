import React, { useState, useEffect } from 'react';
import { Opportunity, School, User } from '../types';
import { SpinnerIcon } from './icons';

interface AddEditOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (opp: Omit<Opportunity, 'excelRowIndex' | 'id' | 'dateCreated' | 'notes'> | Opportunity) => void;
    schools: School[];
    users: User[];
    currentUser: { name: string, email: string };
    opportunityToEdit?: Opportunity | null;
    defaultSchoolName?: string;
}

const AddEditOpportunityModal: React.FC<AddEditOpportunityModalProps> = ({ isOpen, onClose, onSubmit, schools, users, currentUser, opportunityToEdit, defaultSchoolName }) => {
    const isEditMode = !!opportunityToEdit;
    const [formData, setFormData] = useState<Partial<Opportunity>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stages = [ '5% - Opportunity identified', '15% - Reached out', '50% - Engagement', '75% - Negotiation' ];
    const [sliderValue, setSliderValue] = useState(0);
    const [closedStatus, setClosedStatus] = useState<'Won' | 'Lost'>('Won');


    useEffect(() => {
        if (isOpen) {
            const initialData = opportunityToEdit || {
                schoolName: defaultSchoolName || '',
                accountManager: currentUser.name,
                progressStage: '5% - Opportunity identified'
            };
            setFormData(initialData);

            if (initialData.progressStage) {
                const stage = initialData.progressStage;
                if (stage.startsWith('100%')) {
                    setSliderValue(4);
                    if (stage.includes('Won')) setClosedStatus('Won');
                    if (stage.includes('Lost')) setClosedStatus('Lost');
                } else {
                    const index = stages.findIndex(s => s === stage);
                    setSliderValue(index > -1 ? index : 0);
                }
            } else {
                setSliderValue(0);
                setClosedStatus('Won');
            }

            setIsSubmitting(false);
        }
    }, [isOpen, opportunityToEdit, currentUser.name, defaultSchoolName]);

    if (!isOpen) return null;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setSliderValue(value);
        let newStage: Opportunity['progressStage'];
        if (value < 4) {
            newStage = stages[value] as Opportunity['progressStage'];
        } else {
            newStage = `100% - Closed ${closedStatus}` as Opportunity['progressStage'];
        }
        setFormData(prev => ({ ...prev, progressStage: newStage }));
    };

    const handleClosedStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const status = e.target.value as 'Won' | 'Lost';
        setClosedStatus(status);
        if (sliderValue === 4) {
            setFormData(prev => ({ ...prev, progressStage: `100% - Closed ${status}` as Opportunity['progressStage'] }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.schoolName) {
            alert("Description and School Name are required.");
            return;
        }
        setIsSubmitting(true);
        onSubmit(formData as Opportunity);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">{isEditMode ? 'Edit Opportunity' : 'Add Opportunity'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300">Description</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">School Name</label>
                            <select name="schoolName" value={formData.schoolName || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white disabled:bg-slate-900/50 disabled:text-slate-400" required disabled={!isEditMode && !!defaultSchoolName}>
                                <option value="" disabled>Select a school</option>
                                {schools.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300">Account Manager</label>
                            <select name="accountManager" value={formData.accountManager || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white">
                                {users.map(u => <option key={u.email} value={u.name}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300">Stage: <span className="font-semibold text-white">{formData.progressStage}</span></label>
                            <input 
                                type="range"
                                min="0"
                                max="4"
                                step="1"
                                value={sliderValue}
                                onChange={handleSliderChange}
                                className="mt-2 w-full"
                            />
                            {sliderValue === 4 && (
                                <div className="mt-2 p-2 bg-slate-700 rounded-md">
                                    <p className="text-sm font-medium text-slate-300 mb-1">Set outcome:</p>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                            <input type="radio" name="closedStatus" value="Won" checked={closedStatus === 'Won'} onChange={handleClosedStatusChange} className="w-4 h-4 text-sky-600 bg-slate-600 border-slate-500 focus:ring-sky-500"/>
                                            Won
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                            <input type="radio" name="closedStatus" value="Lost" checked={closedStatus === 'Lost'} onChange={handleClosedStatusChange} className="w-4 h-4 text-sky-600 bg-slate-600 border-slate-500 focus:ring-sky-500"/>
                                            Lost
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                       
                    </div>
                    <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-slate-800">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : (isEditMode ? 'Save Changes' : 'Add Opportunity')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditOpportunityModal;