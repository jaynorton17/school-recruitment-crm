import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { SpinnerIcon } from './icons';
import { autoformatDateInput } from '../utils';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Candidate, 'id' | 'excelRowIndex' | 'cvUrl' | 'dbsCertificateUrl'>) => Promise<void>;
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        location: '',
        drives: false,
        willingToTravelMiles: 0,
        email: '',
        phone: '',
        dbs: false,
        onUpdateService: false,
        availability: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
        },
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when closing
            setFormData({
                name: '',
                dob: '',
                location: '',
                drives: false,
                willingToTravelMiles: 0,
                email: '',
                phone: '',
                dbs: false,
                onUpdateService: false,
                availability: {
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                },
                notes: '',
            });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'willingToTravelMiles') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
        } else if (name === 'dob') {
            setFormData(prev => ({ ...prev, [name]: autoformatDateInput(value) }));
        }
         else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAvailabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [name]: checked
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone || !formData.location) {
            alert("Name, Email, Phone, and Location are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to add candidate.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">Add New Candidate</h2>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 text-slate-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Date of Birth</label>
                            <input type="text" name="dob" value={formData.dob} onChange={handleChange} placeholder="DD/MM/YYYY" className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Phone Number</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center">
                            <input id="drives" name="drives" type="checkbox" checked={formData.drives} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="drives" className="ml-2 block text-sm">Drives?</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Travel Radius (miles)</label>
                            <input type="number" name="willingToTravelMiles" value={formData.willingToTravelMiles} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                        </div>
                        <div className="flex items-center">
                            <input id="dbs" name="dbs" type="checkbox" checked={formData.dbs} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="dbs" className="ml-2 block text-sm">DBS?</label>
                        </div>
                        <div className="flex items-center">
                            <input id="onUpdateService" name="onUpdateService" type="checkbox" checked={formData.onUpdateService} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <label htmlFor="onUpdateService" className="ml-2 block text-sm">On Update Service?</label>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-sm font-medium mb-2">Availability</label>
                        <div className="flex flex-wrap gap-4">
                            {Object.keys(formData.availability).map(day => (
                                <div key={day} className="flex items-center">
                                    <input id={day} name={day} type="checkbox" checked={formData.availability[day as keyof typeof formData.availability]} onChange={handleAvailabilityChange} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                    <label htmlFor={day} className="ml-2 block text-sm capitalize">{day}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-sm font-medium">Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white"></textarea>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[100px] justify-center">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Add Candidate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCandidateModal;