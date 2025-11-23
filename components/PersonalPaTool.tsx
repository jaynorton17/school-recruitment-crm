import React, { useState, useEffect } from 'react';
import { getGeminiModel } from '../services/gemini';
import { CrmData, SuggestedCallList, CustomDialerList } from '../types';
import { SpinnerIcon, PersonalPaIcon, EditIcon } from './icons';

interface PersonalPaToolProps {
    tool: { id: string; name: string; icon: React.ElementType; };
    crmData: CrmData;
    onBack: () => void;
    onSaveCustomDialerList: (listData: Omit<CustomDialerList, 'id'>) => void;
}

const personalPaPrompt = `You are the PERSONAL PA AI. Your task is to analyze the provided CRM data and generate a daily briefing for a school recruiter.

Return a single JSON object with two keys: "briefing" and "suggestedCallList".
- "briefing": A markdown-formatted string. It MUST include a section titled "### Top 5 High-Impact Actions". Also include sections for Overdue Tasks, Today's Priorities, and Opportunities to watch.
- "suggestedCallList": A single object with "name", "reason", and a complete "filters" object for creating a proactive call list in the dialer.

CRM Dataset:
{{CRM_DATASET}}`;


const PersonalPaTool: React.FC<PersonalPaToolProps> = ({ tool, crmData, onBack, onSaveCustomDialerList }) => {
    const [briefingText, setBriefingText] = useState<string | null>(null);
    const [suggestedList, setSuggestedList] = useState<SuggestedCallList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const { icon: Icon } = tool;

    useEffect(() => {
        const storedData = localStorage.getItem('personalPa_dailyBriefing');
        if (storedData) {
            setHasGenerated(true);
            try {
                const parsed = JSON.parse(storedData);
                setBriefingText(parsed.briefing || '');
                setSuggestedList(parsed.suggestedCallList || null);
            } catch (e) {
                setBriefingText(storedData);
                setSuggestedList(null);
            }
        }
    }, []);

    const generateBriefing = async () => {
        setIsLoading(true);
        setError(null);
        setBriefingText(null);
        setSuggestedList(null);
        setHasGenerated(true);

        try {
            const dataSummary = {
                tasks: crmData.tasks.slice(0, 50).map(t => ({ school: t.schoolName, desc: t.taskDescription, due: t.dueDate, completed: t.isCompleted })),
                notes: crmData.notes.slice(0, 50).map(n => ({ school: n.schoolName, note: n.note.substring(0, 100), date: n.date })),
                calls: crmData.callLogs.slice(0, 50).map(c => ({ school: c.schoolName, notes: c.notes.substring(0, 100), date: c.dateCalled })),
                opportunities: crmData.opportunities.slice(0, 20).map(o => ({name: o.name, school: o.schoolName, stage: o.progressStage})),
                candidates: crmData.candidates.slice(0, 20).map(c => ({name: c.name, location: c.location, drives: c.drives, availability: c.availability}))
            };

            const fullPrompt = personalPaPrompt.replace('{{CRM_DATASET}}', JSON.stringify(dataSummary));

            const model = getGeminiModel('gemini-1.5-flash');
            const response = await model.generateContent({ prompt: fullPrompt });
            const result = JSON.parse(response.response.text().trim());

            if (result.briefing) {
                setBriefingText(result.briefing);
            }
             if (result.suggestedCallList) {
                setSuggestedList(result.suggestedCallList);
            }

            localStorage.setItem('personalPa_dailyBriefing', JSON.stringify(result));
            localStorage.setItem('personalPa_generationDate', new Date().toISOString().split('T')[0]); // Store just the date

        } catch (e) {
            console.error(`Failed to generate AI result for ${tool.name}:`, e);
            setError(`Sorry, the AI is having a moment. Please try again later.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
                </div>
            </div>

            <div className="flex-shrink-0 mb-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-slate-400">Generate a prioritized to-do list based on your current workload.</p>
                <button 
                    onClick={generateBriefing}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors text-lg shadow-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    <Icon className="w-6 h-6" />
                    {briefingText ? 'Regenerate' : 'Generate'} Daily Briefing
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {isLoading && (
                    <div className="flex-grow flex items-center justify-center text-slate-400">
                        <SpinnerIcon className="w-8 h-8 mr-4" />
                        <span className="text-lg">Generating your daily briefing...</span>
                    </div>
                )}
                
                {!isLoading && error && <div className="text-center text-red-400 p-8">{error}</div>}

                {hasGenerated && !isLoading && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800 rounded-lg border border-sky-500/50">
                            <h3 className="font-semibold text-white">Proactive Call List Suggestion</h3>
                            {suggestedList && suggestedList.name ? (
                                <>
                                    <p className="text-sm text-sky-300 font-semibold mt-1">{suggestedList.name}</p>
                                    <p className="text-sm text-slate-400 mt-1 mb-3">{suggestedList.reason}</p>
                                    <button 
                                        onClick={() => onSaveCustomDialerList({ name: suggestedList.name, filters: suggestedList.filters })}
                                        className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        Create List
                                    </button>
                                </>
                             ) : (
                                <p className="text-sm text-slate-400 mt-2">No specific call list was suggested this time.</p>
                             )}
                        </div>
                         {briefingText && (
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                <pre className="text-slate-300 whitespace-pre-wrap font-sans">{briefingText}</pre>
                            </div>
                         )}
                    </div>
                )}

                {!hasGenerated && !isLoading && !error && (
                     <div className="text-center text-slate-500 pt-16">
                        <p>Click the button above to generate your briefing for today.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalPaTool;