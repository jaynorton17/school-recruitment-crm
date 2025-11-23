import React from 'react';
import { CrmData, School, Task, AiEmailDraft, SuggestedCallList, CustomDialerList, AiSuggestion } from '../types';
import { AiIcon, SpinnerIcon, ResponseIcon, FollowUpIcon, DollarIcon, MegaphoneIcon, TooltipIcon, EmailIcon, TaskIcon, EditIcon } from './icons';

interface SalesStrategistToolProps {
    crmData: CrmData;
    onOpenSendEmailModal: (school: School) => void;
    onOpenAddTaskModal: (task: Partial<Task>, school: School) => void;
    onSelectSchool: (school: School) => void;
    onBack: () => void;
    onSaveCustomDialerList: (listData: Omit<CustomDialerList, 'id'>) => void;
    salesStrategistReport: { suggestions: AiSuggestion[], suggestedCallList: SuggestedCallList } | null;
    onGenerateReport: () => void;
}

const categoryStyles = {
    Engage: { icon: MegaphoneIcon, color: 'sky', text: 'Engage' },
    Nurture: { icon: FollowUpIcon, color: 'emerald', text: 'Nurture' },
    Convert: { icon: DollarIcon, color: 'amber', text: 'Convert' },
    Recover: { icon: ResponseIcon, color: 'rose', text: 'Recover' },
};

const confidenceStyles = {
    Low: { color: 'slate', text: 'Low' },
    Medium: { color: 'amber', text: 'Medium' },
    High: { color: 'emerald', text: 'High' },
};

const SuggestionCard: React.FC<{
    suggestion: AiSuggestion;
    onAction: (suggestion: AiSuggestion) => void;
    onSelectSchool: (schoolName: string) => void;
}> = ({ suggestion, onAction, onSelectSchool }) => {
    const category = categoryStyles[suggestion.category];
    const confidence = confidenceStyles[suggestion.confidence];

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3 group relative">
            <div className="flex justify-between items-start">
                <div>
                    <div className={`inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full bg-${category.color}-500/10 text-${category.color}-400`}>
                        <category.icon className="w-4 h-4" />
                        <span>{category.text}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group/tooltip">
                        <TooltipIcon className="w-4 h-4 text-slate-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-slate-300 text-xs rounded py-1 px-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                           <span className="font-bold text-white">Why?</span> {suggestion.reason}
                        </div>
                    </div>
                    <div className={`text-xs font-bold text-${confidence.color}-400`}>{confidence.text}</div>
                </div>
            </div>
            
            <p className="text-slate-200">{suggestion.suggestion}</p>
            
            <div className="flex justify-between items-end mt-2 pt-3 border-t border-slate-700">
                <button onClick={() => onSelectSchool(suggestion.schoolName)} className="text-sm font-semibold text-sky-400 hover:underline">
                    {suggestion.schoolName}
                </button>
                {suggestion.action && (
                     <button onClick={() => onAction(suggestion)} className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${suggestion.action.type === 'email' ? 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'}`}>
                        {suggestion.action.type === 'email' ? <EmailIcon className="w-4 h-4" /> : <TaskIcon className="w-4 h-4" />}
                        {suggestion.action.type === 'email' ? 'Draft Email' : 'Create Task'}
                    </button>
                )}
            </div>
        </div>
    );
};

const SalesStrategistTool: React.FC<SalesStrategistToolProps> = ({ 
    crmData, 
    onOpenSendEmailModal, 
    onOpenAddTaskModal, 
    onSelectSchool, 
    onBack, 
    onSaveCustomDialerList,
    salesStrategistReport,
    onGenerateReport
}) => {
    const isLoading = salesStrategistReport === null;
    
    const handleAction = (suggestion: AiSuggestion) => {
        const school = crmData.schools.find(s => s.name === suggestion.schoolName);
        if (!school) {
            alert(`Could not find school: ${suggestion.schoolName}`);
            return;
        }

        if (suggestion.action?.type === 'email') {
            const emailData = suggestion.action.data as AiEmailDraft;
            sessionStorage.setItem('aiEmailDraft', JSON.stringify(emailData));
            onOpenSendEmailModal(school);

        } else if (suggestion.action?.type === 'task') {
            const taskData = suggestion.action.data as { description: string };
            const task: Partial<Task> = { taskDescription: taskData.description, type: 'Follow-up' };
            onOpenAddTaskModal(task, school);
        }
    };
    
    const handleSelectSchool = (schoolName: string) => {
        const school = crmData.schools.find(s => s.name === schoolName);
        if (school) onSelectSchool(school);
    };
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                 <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                       {/* FIX: Corrected malformed SVG polyline points attribute that was causing a JSX parsing error. */}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">Sales Strategist</h1>
                </div>
                <p className="text-slate-400 max-w-2xl mt-2 ml-14">Get strategic suggestions for engaging schools based on recent CRM activity.</p>
            </div>
            
            <div className="flex-shrink-0 mb-4 flex justify-end">
                <button 
                    onClick={onGenerateReport}
                    className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                    <AiIcon className="w-5 h-5" />
                    Regenerate
                </button>
            </div>

            {isLoading && (
                <div className="flex-grow flex items-center justify-center text-slate-400">
                    <SpinnerIcon className="w-8 h-8 mr-4" />
                    <span className="text-lg">AI is generating your daily strategy...</span>
                </div>
            )}
            
            {!isLoading && salesStrategistReport && (
                 <div className="flex-grow overflow-y-auto pr-2">
                    <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-sky-500/50">
                        <h3 className="font-semibold text-white">Proactive Call List Suggestion</h3>
                        {salesStrategistReport.suggestedCallList && salesStrategistReport.suggestedCallList.name ? (
                            <>
                                <p className="text-sm text-sky-300 font-semibold mt-1">{salesStrategistReport.suggestedCallList.name}</p>
                                <p className="text-sm text-slate-400 mt-1 mb-3">{salesStrategistReport.suggestedCallList.reason}</p>
                                <button 
                                    onClick={() => onSaveCustomDialerList({ name: salesStrategistReport.suggestedCallList.name, filters: salesStrategistReport.suggestedCallList.filters })}
                                    className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                                >
                                    <EditIcon className="w-4 h-4" />
                                    Create List
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 mt-2">No specific call list was suggested this time. Try generating again for new ideas.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {salesStrategistReport.suggestions.map(s => (
                            <SuggestionCard 
                                key={s.id}
                                suggestion={s}
                                onAction={handleAction}
                                onSelectSchool={handleSelectSchool}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesStrategistTool;
