import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CallLog, User, School, Task, Note, Email, Opportunity, Booking, BookingAmendment } from '../types';
import { parseUKDate, autoformatDateInput } from '../utils';
import { ExportIcon, SearchIcon, AddIcon, TrashIcon, CallIcon, EmailIcon, TaskIcon, DollarIcon, TrophyIcon } from './icons';
import MailingListModal from './MailingListModal';

// Make Chart.js available from the global scope (loaded via CDN)
declare var Chart: any;

interface ReportsPageProps {
    callLogs: CallLog[];
    users: User[];
    schools: School[];
    tasks: Task[];
    notes: Note[];
    emails: Email[];
    opportunities: Opportunity[];
    bookings: Booking[];
    currentUser: { name: string; email: string };
    isSuperAdmin: boolean;
}

interface DateRange {
    id: number;
    from: string;
    to: string;
}

const StatCard: React.FC<{ title: string, value: string, change?: number, icon: React.ElementType, color: string }> = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            {change !== undefined && !isNaN(change) && (
                 <div className={`flex items-center text-sm font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span>{change >= 0 ? '▲' : '▼'}</span>
                    <span>{Math.abs(change)}%</span>
                </div>
            )}
        </div>
        <div>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            <p className="text-sm text-slate-400">{title}</p>
        </div>
    </div>
);


const ReportsPage: React.FC<ReportsPageProps> = ({ callLogs, users, schools, tasks, notes, emails, opportunities, bookings, currentUser, isSuperAdmin }) => {
    const [accountManagerFilter, setAccountManagerFilter] = useState(isSuperAdmin ? 'All Staff' : currentUser.name);
    const [dateRanges, setDateRanges] = useState<DateRange[]>(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const formatDate = (date: Date): string => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        return [{
            id: 1,
            from: formatDate(sevenDaysAgo),
            to: formatDate(today)
        }];
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isMailingListModalOpen, setIsMailingListModalOpen] = useState(false);


    const lineChartRef = useRef<HTMLCanvasElement>(null);
    const lineChartInstance = useRef<any>(null);
    const activityBarChartRef = useRef<HTMLCanvasElement>(null);
    const activityBarChartInstance = useRef<any>(null);

    const handleDateChange = (id: number, field: 'from' | 'to', value: string) => {
        setDateRanges(prev => prev.map(range => range.id === id ? { ...range, [field]: autoformatDateInput(value) } : range));
    };

    const addDateRange = () => {
        if (dateRanges.length < 2) {
            setDateRanges(prev => [...prev, { id: Date.now(), from: '', to: '' }]);
        }
    };

    const removeDateRange = (id: number) => {
        setDateRanges(prev => prev.filter(range => range.id !== id));
    };

    const filteredData = useMemo(() => {
        return dateRanges.map(range => {
            const fromDate = range.from ? parseUKDate(range.from) : null;
            let toDate = range.to ? parseUKDate(range.to) : null;
            
            if (fromDate && !toDate) {
                toDate = new Date(fromDate);
            }

            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);

            const filterByDate = (dateStr?: string) => {
                if (!fromDate && !toDate) return true; // Show all if dates are cleared
                if (!fromDate || !toDate) return false; // Don't show if only one is set (unless it's a single day)
                const itemDate = parseUKDate(dateStr);
                // FIX: Date objects must be compared using .getTime() to get their numeric value.
                return itemDate && itemDate.getTime() >= fromDate.getTime() && itemDate.getTime() <= toDate.getTime();
            };
            // FIX: Added 'startDate' to the generic constraint to allow filtering bookings by date.
            const filterItems = <T extends {
                accountManager: string;
                date?: string;
                dateCalled?: string;
                dateCreated?: string;
                startDate?: string;
            }>(
                items: T[],
                dateSelector: (item: T) => string | undefined
            ) => {
                return items.filter(item => {
                    const managerMatch = accountManagerFilter === 'All Staff' || item.accountManager === accountManagerFilter;
                    if (!managerMatch) return false;
                    return filterByDate(dateSelector(item));
                });
            };

            return {
                id: range.id,
                range,
                callLogs: filterItems(callLogs, c => c.dateCalled),
                emails: filterItems(emails, e => e.date),
                tasks: filterItems(tasks, t => t.dateCreated),
                notes: filterItems(notes, n => n.date),
                opportunities: filterItems(opportunities, o => o.dateCreated),
                bookings: filterItems(bookings, b => b.startDate),
            };
        });
    }, [accountManagerFilter, dateRanges, callLogs, emails, tasks, notes, opportunities, bookings]);

    const primaryData = filteredData[0];
    const comparisonData = filteredData[1];

    const getChange = (current: number, previous: number) => {
        if (!previous || previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const calculateProfit = (bookingList: Booking[]): number => {
        return bookingList.reduce((acc, booking) => {
            // Recalculate profit for accuracy, accounting for amendments
            const startDate = parseUKDate(booking.startDate);
            if (!startDate) return acc;
    
            let workingDays = 0;
            for (let i = 0; i < booking.durationDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
                    workingDays++;
                }
            }
            
            const initialTotalProfit = booking.dailyProfit * workingDays;
    
            let totalDeductions = 0;
            if (booking.parsedAmendments) {
                // FIX: Explicitly type 'amendment' to resolve 'unknown' type error from Object.values.
                Object.values(booking.parsedAmendments).forEach((amendment: BookingAmendment) => {
                    totalDeductions += (amendment.schoolDeduction || 0) + (amendment.candidateDeduction || 0);
                });
            }
            
            return acc + (initialTotalProfit - totalDeductions);
        }, 0);
    }
    

    const kpi = {
        callsMade: primaryData.callLogs.length,
        emailsSent: primaryData.emails.filter(e => e.direction === 'sent').length,
        tasksCompleted: primaryData.tasks.filter(t => t.isCompleted).length,
        opportunitiesWon: primaryData.opportunities.filter(o => o.progressStage === '100% - Closed Won').length,
        weeklyProfit: calculateProfit(primaryData.bookings),
    };

    const comparisonKpi = comparisonData ? {
        callsMade: comparisonData.callLogs.length,
        emailsSent: comparisonData.emails.filter(e => e.direction === 'sent').length,
        tasksCompleted: comparisonData.tasks.filter(t => t.isCompleted).length,
        opportunitiesWon: comparisonData.opportunities.filter(o => o.progressStage === '100% - Closed Won').length,
        weeklyProfit: calculateProfit(comparisonData.bookings),
    } : null;

    useEffect(() => {
        const createOrUpdateChart = (ref: React.RefObject<HTMLCanvasElement>, instanceRef: React.MutableRefObject<any>, config: any) => {
            if (ref.current && Chart) {
                if (instanceRef.current) {
                    instanceRef.current.data = config.data;
                    instanceRef.current.options = config.options;
                    instanceRef.current.update();
                } else {
                    instanceRef.current = new Chart(ref.current, config);
                }
            }
        };

        const generateDailyData = (data: typeof primaryData) => {
            if (!data.range.from) return { labels: [], callData: [], emailData: [] };
            const from = parseUKDate(data.range.from);
            const to = data.range.to ? parseUKDate(data.range.to) : new Date(from!);
            if (!from || !to) return { labels: [], callData: [], emailData: [] };
            
            const labels: string[] = [];
            const callsByDay: { [key: string]: number } = {};
            const emailsByDay: { [key: string]: number } = {};

            // FIX: The loop condition must compare numeric timestamps using .getTime() as Date objects cannot be directly compared.
            for (let d = new Date(from); d.getTime() <= to.getTime(); d.setDate(d.getDate() + 1)) {
                const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                labels.push(label);
                callsByDay[label] = 0;
                emailsByDay[label] = 0;
            }

            data.callLogs.forEach(log => {
                const date = parseUKDate(log.dateCalled);
                if(date) {
                    const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    if(callsByDay[label] !== undefined) callsByDay[label]++;
                }
            });
            data.emails.forEach(email => {
                const date = parseUKDate(email.date);
                if(date) {
                    const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    if(emailsByDay[label] !== undefined) emailsByDay[label]++;
                }
            });
            
            return { labels, callData: Object.values(callsByDay), emailData: Object.values(emailsByDay) };
        };

        const primaryChartData = generateDailyData(primaryData);
        
        createOrUpdateChart(lineChartRef, lineChartInstance, {
            type: 'line',
            data: {
                labels: primaryChartData.labels,
                datasets: [
                    { label: 'Calls', data: primaryChartData.callData, borderColor: '#38bdf8', tension: 0.4, fill: false },
                    { label: 'Emails', data: primaryChartData.emailData, borderColor: '#34d399', tension: 0.4, fill: false },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
        
        const schoolActivity = schools.map(school => {
            const calls = primaryData.callLogs.filter(c => c.schoolName === school.name).length;
            const emails = primaryData.emails.filter(e => e.schoolName === school.name).length;
            const tasks = primaryData.tasks.filter(t => t.schoolName === school.name).length;
            return { name: school.name, total: calls + emails + tasks };
        });
        
        const top5Schools = schoolActivity.sort((a,b) => b.total - a.total).slice(0, 5);

        createOrUpdateChart(activityBarChartRef, activityBarChartInstance, {
            type: 'bar',
            data: {
                labels: top5Schools.map(s => s.name),
                datasets: [{
                    label: 'Total Activities',
                    data: top5Schools.map(s => s.total),
                    backgroundColor: '#818cf8',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { color: '#94a3b8' } },
                    x: { beginAtZero: true, ticks: { color: '#94a3b8' } }
                }
            }
        });

    }, [primaryData, schools]);
    
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <button 
                    onClick={() => setIsMailingListModalOpen(true)}
                    className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                >
                    <EmailIcon className="w-5 h-5 mr-2" />
                    Create Mailing List
                </button>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-full md:w-auto">
                        <label className="text-xs text-slate-400 block mb-1">Account Manager</label>
                        {isSuperAdmin ? (
                            <select value={accountManagerFilter} onChange={e => setAccountManagerFilter(e.target.value)} className="w-full md:w-auto bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition">
                                <option>All Staff</option>
                                {users.map(user => <option key={user.email} value={user.name}>{user.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full md:w-auto bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white">
                                {currentUser.name}
                            </div>
                        )}
                    </div>
                    {dateRanges.map((range, index) => (
                        <div key={range.id} className="flex flex-col sm:flex-row sm:items-end gap-2 p-2 border border-slate-700 rounded-lg w-full md:w-auto">
                            <div className="w-full">
                                <label className="text-xs text-slate-400 block mb-1">{index === 0 ? 'Primary Date Range' : 'Compare To'}</label>
                                <input type="text" value={range.from} onChange={e => handleDateChange(range.id, 'from', e.target.value)} placeholder="DD/MM/YYYY" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white text-sm" />
                            </div>
                            <span className="text-slate-500 hidden sm:block pb-2">to</span>
                            <div className="w-full">
                                <label className="text-xs text-slate-400 block sm:hidden mb-1">To</label>
                                <input type="text" value={range.to} onChange={e => handleDateChange(range.id, 'to', e.target.value)} placeholder="DD/MM/YYYY" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white text-sm" />
                            </div>
                            {index > 0 && <button onClick={() => removeDateRange(range.id)} className="p-2 text-slate-400 hover:text-red-400 self-end sm:self-center"><TrashIcon className="w-5 h-5"/></button>}
                        </div>
                    ))}
                    {dateRanges.length < 2 && <button onClick={addDateRange} className="flex items-center text-sm text-sky-400 font-semibold hover:text-sky-300"><AddIcon className="w-5 h-5 mr-1"/> Compare</button>}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Calls Made" value={String(kpi.callsMade)} icon={CallIcon} color="bg-emerald-500/50" change={comparisonKpi ? getChange(kpi.callsMade, comparisonKpi.callsMade) : undefined}/>
                <StatCard title="Emails Sent" value={String(kpi.emailsSent)} icon={EmailIcon} color="bg-rose-500/50" change={comparisonKpi ? getChange(kpi.emailsSent, comparisonKpi.emailsSent) : undefined}/>
                <StatCard title="Tasks Completed" value={String(kpi.tasksCompleted)} icon={TaskIcon} color="bg-amber-500/50" change={comparisonKpi ? getChange(kpi.tasksCompleted, comparisonKpi.tasksCompleted) : undefined}/>
                <StatCard title="Opportunities Won" value={String(kpi.opportunitiesWon)} icon={TrophyIcon} color="bg-indigo-500/50" change={comparisonKpi ? getChange(kpi.opportunitiesWon, comparisonKpi.opportunitiesWon) : undefined}/>
                <StatCard title="Weekly Profit" value={`£${kpi.weeklyProfit.toFixed(0)}`} icon={DollarIcon} color="bg-sky-500/50" change={comparisonKpi ? getChange(kpi.weeklyProfit, comparisonKpi.weeklyProfit) : undefined}/>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="font-semibold text-slate-300 mb-2">Daily Activity</h3>
                    <div className="h-72"><canvas ref={lineChartRef}></canvas></div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="font-semibold text-slate-300 mb-2">Top 5 Schools by Activity</h3>
                    <div className="h-72"><canvas ref={activityBarChartRef}></canvas></div>
                </div>
            </div>

             <MailingListModal 
                isOpen={isMailingListModalOpen}
                onClose={() => setIsMailingListModalOpen(false)}
                schools={schools}
                users={users}
                currentUser={currentUser}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
};

export default ReportsPage;