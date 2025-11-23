import React, { useState, useEffect, useRef } from 'react';
import { CoachReportData, CoachChatMessage } from '../types';
import { CoachIcon, SpinnerIcon, SendIcon } from './icons';

interface CoachDashboardWidgetProps {
    setActiveView: (view: string) => void;
    coachReport: CoachReportData | null;
    chatHistory: CoachChatMessage[];
    onSendMessage: (message: string) => void;
    isResponding: boolean;
}

const CoachDashboardWidget: React.FC<CoachDashboardWidgetProps> = ({ setActiveView, coachReport, chatHistory, onSendMessage, isResponding }) => {
    const [input, setInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    const handleViewReport = () => {
        sessionStorage.setItem('openAiTool', 'coach');
        setActiveView('JAY-AI Hub');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isResponding) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl flex flex-col h-full">
            <div className="flex justify-between items-start flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                        <CoachIcon className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">AI Coach</h3>
                        <p className="text-sm text-slate-400">Ask me anything...</p>
                    </div>
                </div>
                 <button onClick={handleViewReport} className="text-sm font-semibold bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                    View Full Report
                </button>
            </div>
            
            <div ref={chatContainerRef} className="mt-4 pt-4 border-t border-slate-700 flex-grow overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                                <CoachIcon className="w-5 h-5 text-sky-400" />
                            </div>
                        )}
                        <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-sky-600' : 'bg-slate-800'}`}>
                            <p className="text-sm text-white whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                {isResponding && (
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                            <CoachIcon className="w-5 h-5 text-sky-400" />
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800">
                           <SpinnerIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 flex-shrink-0">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-grow bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    disabled={isResponding}
                />
                <button type="submit" disabled={isResponding || !input.trim()} className="p-2 bg-sky-600 rounded-lg text-white hover:bg-sky-700 disabled:opacity-50 transition-colors">
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default CoachDashboardWidget;