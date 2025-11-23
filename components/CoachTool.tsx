import React, { useState, useEffect, useRef } from 'react';
// FIX: Added 'Task' to the type imports to resolve a missing type error.
import { CrmData, CoachReportData, CoachChatMessage, Task } from '../types';
import { SpinnerIcon, CallIcon, EmailIcon, TaskIcon, PercentageIcon, FollowUpIcon, SchoolIcon, SendIcon } from './icons';

interface CoachToolProps {
    tool: { id: string; name: string; icon: React.ElementType; };
    crmData: CrmData;
    onBack: () => void;
    onOpenAddTaskModal: (task: Partial<Task>, school: any) => void;
    coachReportData: CoachReportData | null;
    chatHistory: CoachChatMessage[];
    onSendMessage: (message: string) => void;
    isResponding: boolean;
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center">
        <div className="p-3 bg-slate-700 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-slate-300" />
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{title}</p>
        </div>
    </div>
);


const CoachTool: React.FC<CoachToolProps> = ({ tool, onBack, coachReportData, chatHistory, onSendMessage, isResponding }) => {
    const [input, setInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { icon: Icon } = tool;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isResponding) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const isLoading = !coachReportData;

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <Icon className="w-8 h-8 text-white" />
                    <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
                </div>
            </div>

            {isLoading ? (
                 <div className="flex-grow flex items-center justify-center text-slate-400">
                    <SpinnerIcon className="w-8 h-8 mr-4" />
                    <span className="text-lg">Analyzing your performance...</span>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <KpiCard title="Calls made" value={String(coachReportData?.kpis.callsMade)} icon={CallIcon} />
                        <KpiCard title="Email volume" value={String(coachReportData?.kpis.emailVolume)} icon={EmailIcon} />
                        <KpiCard title="Email replies" value={String(coachReportData?.kpis.emailReplies)} icon={EmailIcon} />
                        <KpiCard title="Task completion" value={`${coachReportData?.kpis.taskCompletion}%`} icon={TaskIcon} />
                        <KpiCard title="Follow-ups missed" value={String(coachReportData?.kpis.followUpsMissed)} icon={FollowUpIcon} />
                        <KpiCard title="Schools w/ engagement" value={String(coachReportData?.kpis.schoolsWithEngagement)} icon={SchoolIcon} />
                    </div>

                    {/* Chat Interface */}
                    <div className="flex-grow bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
                         <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4 p-4 pr-6">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-6 h-6 text-sky-400" />
                                        </div>
                                    )}
                                    <div className={`p-4 rounded-xl max-w-xl ${msg.role === 'user' ? 'bg-sky-600' : 'bg-slate-800'}`}>
                                        <p className="text-white whitespace-pre-wrap">{msg.parts[0].text}</p>
                                    </div>
                                </div>
                            ))}
                            {isResponding && (
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-6 h-6 text-sky-400" />
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800">
                                       <SpinnerIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex items-center gap-2 flex-shrink-0">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your performance, or for advice on a situation..."
                                className="flex-grow bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                disabled={isResponding}
                            />
                            <button type="submit" disabled={isResponding || !input.trim()} className="p-3 bg-sky-600 rounded-lg text-white hover:bg-sky-700 disabled:opacity-50 transition-colors">
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default CoachTool;
