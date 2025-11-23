import React from 'react';
import { SpinnerIcon, AiIcon } from './icons';

interface StrategicPlannerToolProps {
    tool: { id: string; name: string; icon: React.ElementType; };
    onBack: () => void;
    strategicPlannerReport: string | null;
    onGenerateReport: () => void;
}

const StrategicPlannerTool: React.FC<StrategicPlannerToolProps> = ({ tool, onBack, strategicPlannerReport, onGenerateReport }) => {
    const isLoading = strategicPlannerReport === null;
    const { icon: Icon } = tool;

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
            
            <div className="flex-shrink-0 mb-4 flex justify-end">
                <button 
                    onClick={onGenerateReport}
                    className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                    <AiIcon className="w-5 h-5" />
                    Regenerate Plan
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {isLoading && (
                    <div className="flex-grow flex items-center justify-center text-slate-400">
                        <SpinnerIcon className="w-8 h-8 mr-4" />
                        <span className="text-lg">AI is generating your strategic plan...</span>
                    </div>
                )}
                
                {!isLoading && strategicPlannerReport && (
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                        <pre className="text-slate-300 whitespace-pre-wrap font-sans">{strategicPlannerReport}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicPlannerTool;
