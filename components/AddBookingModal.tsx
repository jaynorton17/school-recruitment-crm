import React, { useState, useEffect, useMemo } from 'react';
import { School, Candidate } from '../types';
import { SpinnerIcon } from './icons';
import { autoformatDateInput } from '../utils';

interface AddBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        schoolName: string;
        candidateName: string;
        schoolDayCharge: number;
        candidateDayCharge: number;
        days: number;
        startDate: string;
    }) => Promise<void>;
    schools: School[];
    candidates: Candidate[];
}

const HOURS_PER_DAY = 6;

const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, onSubmit, schools, candidates }) => {
    const [schoolName, setSchoolName] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [schoolDayCharge, setSchoolDayCharge] = useState('');
    const [candidateDayCharge, setCandidateDayCharge] = useState('');
    const [days, setDays] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSchoolName('');
            setCandidateName('');
            setSchoolDayCharge('');
            setCandidateDayCharge('');
            setDays('');
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            setStartDate(`${day}/${month}/${year}`);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const { schoolHourlyRate, candidateHourlyRate } = useMemo(() => {
        const sdc = parseFloat(schoolDayCharge);
        const cdc = parseFloat(candidateDayCharge);
        return {
            schoolHourlyRate: isNaN(sdc) ? 0 : sdc / HOURS_PER_DAY,
            candidateHourlyRate: isNaN(cdc) ? 0 : cdc / HOURS_PER_DAY,
        };
    }, [schoolDayCharge, candidateDayCharge]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolName || !candidateName || !schoolDayCharge || !candidateDayCharge || !days || !startDate) {
            alert("All fields are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({
                schoolName,
                candidateName,
                schoolDayCharge: parseFloat(schoolDayCharge),
                candidateDayCharge: parseFloat(candidateDayCharge),
                days: parseInt(days, 10),
                startDate,
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to add booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Add New Booking</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">School</label>
                            <select value={schoolName} onChange={e => setSchoolName(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required>
                                <option value="" disabled>Select a school</option>
                                {schools.map(s => <option key={s.excelRowIndex} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Candidate</label>
                            <select value={candidateName} onChange={e => setCandidateName(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required>
                                <option value="" disabled>Select a candidate</option>
                                {candidates.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">School Day Charge (£)</label>
                            <input type="number" step="0.01" value={schoolDayCharge} onChange={e => setSchoolDayCharge(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Candidate Day Charge (£)</label>
                            <input type="number" step="0.01" value={candidateDayCharge} onChange={e => setCandidateDayCharge(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-300">Number of Days</label>
                            <input type="number" step="1" min="1" value={days} onChange={e => setDays(e.target.value)} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Start Date</label>
                            <input type="text" value={startDate} onChange={e => setStartDate(autoformatDateInput(e.target.value))} placeholder="DD/MM/YYYY" className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" required />
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                         <div className="bg-slate-700 p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-400">School Hourly Rate (Est.)</p>
                            <p className="text-2xl font-bold text-white">£{schoolHourlyRate.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-700 p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-400">Candidate Hourly Rate (Est.)</p>
                            <p className="text-2xl font-bold text-emerald-400">£{candidateHourlyRate.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[100px] justify-center">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Add Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBookingModal;