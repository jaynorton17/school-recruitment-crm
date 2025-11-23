import React, { useState, useEffect } from 'react';
import { PersonalPaIcon } from './icons';

interface PersonalPaDashboardWidgetProps {
    setActiveView: (view: string) => void;
}

const PersonalPaDashboardWidget: React.FC<PersonalPaDashboardWidgetProps> = ({ setActiveView }) => {
    const [topActions, setTopActions] = useState<string[]>([]);
    const [briefingExists, setBriefingExists] = useState(false);

    useEffect(() => {
        const checkBriefing = () => {
            const lastDate = localStorage.getItem('personalPa_generationDate');
            const today = new Date().toISOString().split('T')[0];

            if (lastDate === today) {
                const fullBriefingJSON = localStorage.getItem('personalPa_dailyBriefing');
                if (fullBriefingJSON) {
                    setBriefingExists(true);
                    try {
                        const parsed = JSON.parse(fullBriefingJSON);
                        const briefingText = parsed.briefing || '';
                        const match = briefingText.match(/### Top 5 High-Impact Actions\s*([\s\S]*?)(?=\n###|$)/i);
                        if (match && match[1]) {
                            const actions = match[1]
                                .trim()
                                .split('\n')
                                .map((line: string) => line.replace(/^[•*-]\s*/, '').trim()) // Remove markdown list markers
                                .filter(Boolean); // Remove any empty lines
                            setTopActions(actions);
                        } else {
                            setTopActions([]);
                        }
                    } catch (e) {
                        console.error("Failed to parse PA briefing from storage:", e);
                        setBriefingExists(false);
                    }
                } else {
                    setBriefingExists(false);
                }
            } else {
                setBriefingExists(false);
                setTopActions([]);
            }
        };

        checkBriefing();
        
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', checkBriefing);
        return () => window.removeEventListener('storage', checkBriefing);
    }, []);

    const handleViewBriefing = () => {
        sessionStorage.setItem('openAiTool', 'personalPa');
        setActiveView('JAY-AI Hub');
    };

    return (
        <div className="bg-slate-900 p-4 md:p-6 rounded-xl">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <PersonalPaIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Personal PA</h3>
                        <p className="text-sm text-slate-400">Your daily briefing and top actions</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
                {briefingExists ? (
                    <>
                        {topActions.length > 0 ? (
                            <div>
                                <p className="text-sm font-semibold text-slate-400 mb-2">Top High-Impact Actions:</p>
                                <ul className="space-y-2">
                                    {topActions.map((action, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-sky-400 mt-1">●</span>
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                             <p className="text-slate-400">Could not extract top actions from your briefing.</p>
                        )}
                        <button onClick={handleViewBriefing} className="mt-3 text-sm font-semibold bg-slate-800 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors w-full text-center">
                            View Full Briefing
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-400 mb-3">No daily briefing has been generated yet.</p>
                        <button onClick={handleViewBriefing} className="text-sm font-semibold bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                            Generate Your Briefing
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalPaDashboardWidget;