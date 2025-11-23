import React, { useState, useMemo } from 'react';
import { Booking, BookingAmendment, School } from '../types';
import { AddIcon, DollarIcon, TrashIcon, EditIcon, CheckIcon, CloseIcon, SpinnerIcon } from './icons';
import { parseUKDate, formatDateUK } from '../utils';

interface BookOfBusinessPageProps {
    bookings: Booking[];
    onOpenAddBookingModal: () => void;
    onDeleteMasterBooking: (masterBookingId: string) => Promise<void>;
    onUpdateBooking: (booking: Booking) => Promise<void>;
    onSelectSchool: (school: School) => void;
    schools: School[];
}

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const getWorkingDaysInBooking = (startDate: Date, duration: number): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    let addedDays = 0;
    let checkedDays = 0;
    while(addedDays < duration && checkedDays < duration * 2) { // Safety break
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            dates.push(new Date(currentDate));
            addedDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        checkedDays++;
    }
    return dates;
};


const DailyBookingCell: React.FC<{ booking: Booking, date: Date, onUpdateBooking: (booking: Booking) => Promise<void> }> = ({ booking, date, onUpdateBooking }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const dateKey = formatDateUK(date);
    const amendment = booking.parsedAmendments?.[dateKey];

    const initialSchoolHours = (amendment && booking.schoolHourlyRate) ? (amendment.schoolDeduction / booking.schoolHourlyRate) : 0;
    const initialCandidateHours = (amendment && booking.candidateHourlyRate) ? (amendment.candidateDeduction / booking.candidateHourlyRate) : 0;
    
    const [schoolDeductionHours, setSchoolDeductionHours] = useState(initialSchoolHours.toString());
    const [candidateDeductionHours, setCandidateDeductionHours] = useState(initialCandidateHours.toString());
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async () => {
        setIsSaving(true);

        const schoolDeductionAmount = (parseFloat(schoolDeductionHours) || 0) * booking.schoolHourlyRate;
        const candidateDeductionAmount = (parseFloat(candidateDeductionHours) || 0) * booking.candidateHourlyRate;
        
        const newAmendments = { ...(booking.parsedAmendments || {}) };
        newAmendments[dateKey] = {
            schoolDeduction: schoolDeductionAmount,
            candidateDeduction: candidateDeductionAmount,
        };

        const startDate = parseUKDate(booking.startDate);
        if(!startDate) {
            alert("Invalid start date for booking.");
            setIsSaving(false);
            return;
        }

        const workingDaysInBooking = getWorkingDaysInBooking(startDate, booking.durationDays);
        const initialTotalProfit = booking.dailyProfit * workingDaysInBooking.length;

        let totalDeductionsValue = 0;
        Object.values(newAmendments).forEach((amend: BookingAmendment) => {
            totalDeductionsValue += (amend.schoolDeduction || 0) + (amend.candidateDeduction || 0);
        });

        const newTotalProfit = initialTotalProfit - totalDeductionsValue;

        const updatedBooking: Booking = {
            ...booking,
            amendments: JSON.stringify(newAmendments),
            parsedAmendments: newAmendments,
            totalProfit: newTotalProfit,
        };
        
        await onUpdateBooking(updatedBooking);
        setIsSaving(false);
        setIsEditing(false);
    };

    const finalSchoolCharge = booking.schoolDailyRate - (amendment?.schoolDeduction || 0);
    const finalCandidatePay = booking.candidateDailyRate - (amendment?.candidateDeduction || 0);
    
    const schoolDeductedHours = (amendment?.schoolDeduction || 0) > 0 && booking.schoolHourlyRate ? (amendment.schoolDeduction / booking.schoolHourlyRate) : 0;
    const candidateDeductedHours = (amendment?.candidateDeduction || 0) > 0 && booking.candidateHourlyRate ? (amendment.candidateDeduction / booking.candidateHourlyRate) : 0;


    if (isEditing) {
        return (
            <div className="bg-slate-700 p-2 rounded-md space-y-2">
                <div>
                    <label className="text-xs text-slate-400">School Deduction (hrs)</label>
                    <input type="number" step="0.5" value={schoolDeductionHours} onChange={e => setSchoolDeductionHours(e.target.value)} className="w-full text-xs p-1 bg-slate-800 border border-slate-600 rounded" />
                </div>
                <div>
                    <label className="text-xs text-slate-400">Candidate Deduction (hrs)</label>
                    <input type="number" step="0.5" value={candidateDeductionHours} onChange={e => setCandidateDeductionHours(e.target.value)} className="w-full text-xs p-1 bg-slate-800 border border-slate-600 rounded" />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="w-full p-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700" disabled={isSaving}>
                        {isSaving ? <SpinnerIcon className="w-4 h-4 mx-auto" /> : <CheckIcon className="w-4 h-4 mx-auto"/>}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="w-full p-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500">
                        <CloseIcon className="w-4 h-4 mx-auto"/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative">
            <p className="font-semibold text-white">£{finalSchoolCharge.toFixed(2)}</p>
            <p className="text-emerald-400">£{finalCandidatePay.toFixed(2)}</p>
            {(amendment?.schoolDeduction || 0) > 0 && <p className="text-xs text-red-400">(-£{amendment?.schoolDeduction.toFixed(2)} / {schoolDeductedHours.toFixed(1)}hr)</p>}
            {(amendment?.candidateDeduction || 0) > 0 && <p className="text-xs text-red-400">(-£{amendment?.candidateDeduction.toFixed(2)} / {candidateDeductedHours.toFixed(1)}hr)</p>}
            <button onClick={() => setIsEditing(true)} className="absolute top-0 right-0 p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <EditIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const BookOfBusinessPage: React.FC<BookOfBusinessPageProps> = ({ bookings, onOpenAddBookingModal, onDeleteMasterBooking, onUpdateBooking, onSelectSchool, schools }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { weekStart, weekDates, weekLabel } = useMemo(() => {
        const start = getStartOfWeek(currentDate);
        const dates = Array.from({ length: 5 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
        
        const startLabel = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const end = new Date(dates[4]);
        const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return { weekStart: start, weekDates: dates, weekLabel: `${startLabel} - ${endLabel}`};
    }, [currentDate]);
    
    const bookingsInView = useMemo(() => {
        const weekStartTs = weekStart.getTime();
        const weekEndTs = new Date(weekDates[4]).setHours(23, 59, 59, 999);
    
        return bookings.filter(booking => {
            const bookingStart = parseUKDate(booking.startDate);
            if (!bookingStart) return false;

            const workingDays = getWorkingDaysInBooking(bookingStart, booking.durationDays);
            if (workingDays.length === 0) return false;
            const bookingEnd = workingDays[workingDays.length - 1];
            bookingEnd.setHours(23, 59, 59, 999);
    
            return bookingStart.getTime() <= weekEndTs && bookingEnd.getTime() >= weekStartTs;
        });
    }, [bookings, weekStart, weekDates]);
    
    const handleSchoolClick = (schoolName: string) => {
        const school = schools.find(s => s.name === schoolName);
        if (school) onSelectSchool(school);
    };

    const handlePrevWeek = () => setCurrentDate(prev => new Date(new Date(prev).setDate(prev.getDate() - 7)));
    const handleNextWeek = () => setCurrentDate(prev => new Date(new Date(prev).setDate(prev.getDate() + 7)));
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <DollarIcon className="w-8 h-8 text-sky-400"/>
                        <h1 className="text-2xl font-bold text-white">Book of Business</h1>
                    </div>
                    <button onClick={onOpenAddBookingModal} className="flex items-center justify-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                        <AddIcon className="w-5 h-5 mr-2" />
                        Add Booking
                    </button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                    <button onClick={handlePrevWeek} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-white">&lt;</button>
                    <h2 className="text-lg font-semibold text-white text-center w-56">{weekLabel}</h2>
                    <button onClick={handleNextWeek} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-white">&gt;</button>
                </div>
            </div>

            <div className="flex-grow bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-auto h-full">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="bg-slate-800 text-xs text-slate-300 uppercase sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3 w-1/6">School / Candidate</th>
                                {weekDates.map(date => (
                                    <th key={date.toISOString()} scope="col" className="px-4 py-3 text-center">
                                        {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                                        <br/>
                                        {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                    </th>
                                ))}
                                <th scope="col" className="px-4 py-3">Weekly Totals</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {bookingsInView.map(booking => {
                                const startDate = parseUKDate(booking.startDate)!;
                                const workingDaysInBooking = getWorkingDaysInBooking(startDate, booking.durationDays);

                                const weeklyTotals = weekDates.reduce((acc, weekDay) => {
                                    const isDayInBooking = workingDaysInBooking.some(d => d.getTime() === weekDay.getTime());
                                    if(isDayInBooking) {
                                        const dateKey = formatDateUK(weekDay);
                                        const amendment = booking.parsedAmendments?.[dateKey];
                                        acc.schoolCharge += booking.schoolDailyRate - (amendment?.schoolDeduction || 0);
                                        acc.candidatePay += booking.candidateDailyRate - (amendment?.candidateDeduction || 0);
                                    }
                                    return acc;
                                }, { schoolCharge: 0, candidatePay: 0, profit: 0 });
                                weeklyTotals.profit = weeklyTotals.schoolCharge - weeklyTotals.candidatePay;
                                
                                return (
                                    <tr key={booking.id} className="hover:bg-slate-800/50 group">
                                        <td className="px-4 py-4 font-medium text-white align-top">
                                            <button onClick={() => handleSchoolClick(booking.schoolName)} className="text-sky-400 hover:underline text-left">
                                                {booking.schoolName}
                                            </button>
                                            <p className="text-sm text-slate-400">{booking.candidateName}</p>
                                        </td>
                                        {weekDates.map(date => {
                                            const isDayInBooking = workingDaysInBooking.some(d => d.getTime() === date.getTime());
                                            return (
                                                <td key={date.toISOString()} className="px-4 py-4 text-center align-top">
                                                    {isDayInBooking && <DailyBookingCell booking={booking} date={date} onUpdateBooking={onUpdateBooking} />}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-4 align-top">
                                            <p><span className="font-semibold text-slate-300">Charge:</span> £{weeklyTotals.schoolCharge.toFixed(2)}</p>
                                            <p><span className="font-semibold text-slate-300">Pay:</span> £{weeklyTotals.candidatePay.toFixed(2)}</p>
                                            <p className="font-bold text-emerald-400">Profit: £{weeklyTotals.profit.toFixed(2)}</p>
                                            <button onClick={() => onDeleteMasterBooking(booking.id)} className="mt-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {bookingsInView.length === 0 && (
                        <div className="text-center p-8 text-slate-500">No bookings found for this week.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookOfBusinessPage;