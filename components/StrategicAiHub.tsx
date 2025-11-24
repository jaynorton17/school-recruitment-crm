
import React, { useState, useEffect } from 'react';
import { CrmData, School, Task, CallLog, Candidate, JobAlert, CustomDialerList, CoachReportData, AiSuggestion, SuggestedCallList, CoachChatMessage } from '../types';
import { SalesStrategistIcon, TranscriberIcon, CoachIcon, CandidateMatcherIcon, JobAlertsIcon, PersonalPaIcon, StrategicPlannerIcon, EmailIcon, GlobeIcon } from './icons';
import SalesStrategistTool from './SalesStrategistTool';
import TranscriberTool from './TranscriberTool';
import CoachTool from './CoachTool';
import JobAlertsTool from './JobAlertsTool';
import PersonalPaTool from './PersonalPaTool';
import StrategicPlannerTool from './StrategicPlannerTool';
import EmailBuilderTool from './EmailBuilderTool';
import CandidateMatcherTool from './CandidateMatcherTool';
import SchoolDataValidatorTool from './SchoolDataValidatorTool';
import { AiDebugInfo } from '../services/aiDebug';

interface StrategicAiHubProps {
    crmData: CrmData;
    onOpenSendEmailModal: (school: School) => void;
    onOpenAddTaskModal: (task: Partial<Task>, school: School) => void;
    onSelectSchool: (school: School) => void;
    onSelectCandidate: (candidate: Candidate) => void;
    onUpdateCallLog: (callLog: CallLog) => Promise<void>;
    onAddNewJobAlert: (job: Omit<JobAlert, 'excelRowIndex'>) => Promise<void>;
    isJobSearching: boolean;
    jobSearchLog: string[];
    jobSearchSummary: { found: number; duplicates: number; added: number; schoolsChecked: number; } | null;
    onStartJobSearch: () => void;
    onStopJobSearch: () => void;
    onSaveCustomDialerList: (listData: Omit<CustomDialerList, 'id'>) => void;
    coachReport: CoachReportData | null;
    salesStrategistReport: { suggestions: AiSuggestion[], suggestedCallList: SuggestedCallList } | null;
    onGenerateSalesStrategistReport: () => void;
    strategicPlannerReport: string | null;
    onGenerateStrategicPlannerReport: () => void;
    onPruneJobAlerts: () => void;
    coachChatHistory: CoachChatMessage[];
    onSendCoachMessage: (message: string) => void;
    isCoachResponding: boolean;
    onUpdateSchool: (school: School) => Promise<void>;
    openDebug: (debug: AiDebugInfo) => void;
}

const aiTools = [
    { id: 'salesStrategist', name: 'Sales Strategist', icon: SalesStrategistIcon },
    { id: 'transcriber', name: 'Transcriber', icon: TranscriberIcon },
    { id: 'coach', name: 'Coach', icon: CoachIcon },
    { id: 'candidateMatcher', name: 'Cand, School & Job Matcher', icon: CandidateMatcherIcon },
    { id: 'jobAlerts', name: 'Job Alerts', icon: JobAlertsIcon },
    { id: 'personalPa', name: 'Personal PA', icon: PersonalPaIcon },
    { id: 'strategicPlanner', name: 'Strategic Planner', icon: StrategicPlannerIcon },
    { id: 'emailBuilder', name: 'Email Builder', icon: EmailIcon },
    { id: 'schoolValidator', name: 'School Data Validator', icon: GlobeIcon },
];

type AiToolId = typeof aiTools[number]['id'];

const StrategicAiHub: React.FC<StrategicAiHubProps> = (props) => {
    const [activeToolId, setActiveToolId] = useState<'hub' | AiToolId>('hub');
    
    useEffect(() => {
        const toolToOpen = sessionStorage.getItem('openAiTool');
        if (toolToOpen && aiTools.some(t => t.id === toolToOpen)) {
            setActiveToolId(toolToOpen as AiToolId);
            sessionStorage.removeItem('openAiTool');
        }
    }, []);

    const activeTool = aiTools.find(t => t.id === activeToolId);

    if (activeTool) {
        if (activeTool.id === 'salesStrategist') {
            return <SalesStrategistTool 
                crmData={props.crmData}
                onOpenSendEmailModal={props.onOpenSendEmailModal}
                onOpenAddTaskModal={props.onOpenAddTaskModal}
                onSelectSchool={props.onSelectSchool}
                onBack={() => setActiveToolId('hub')}
                onSaveCustomDialerList={props.onSaveCustomDialerList}
                salesStrategistReport={props.salesStrategistReport}
                onGenerateReport={props.onGenerateSalesStrategistReport}
            />;
        }
        if (activeTool.id === 'transcriber') {
            return <TranscriberTool crmData={props.crmData} onBack={() => setActiveToolId('hub')} onUpdateCallLog={props.onUpdateCallLog} />;
        }
        if (activeTool.id === 'coach') {
            return <CoachTool
                tool={activeTool}
                crmData={props.crmData}
                onBack={() => setActiveToolId('hub')}
                onOpenAddTaskModal={props.onOpenAddTaskModal}
                coachReportData={props.coachReport}
                chatHistory={props.coachChatHistory}
                onSendMessage={props.onSendCoachMessage}
                isResponding={props.isCoachResponding}
            />;
        }
        if (activeTool.id === 'candidateMatcher') {
            return <CandidateMatcherTool tool={activeTool} {...props} onBack={() => setActiveToolId('hub')} openDebug={props.openDebug} />;
        }
        if (activeTool.id === 'jobAlerts') {
            return <JobAlertsTool 
                onBack={() => setActiveToolId('hub')}
                crmData={props.crmData}
                onAddNewJobAlert={props.onAddNewJobAlert}
                isSearching={props.isJobSearching}
                log={props.jobSearchLog}
                summary={props.jobSearchSummary}
                onStartSearch={props.onStartJobSearch}
                onStopSearch={props.onStopJobSearch}
                onSelectSchool={props.onSelectSchool}
                onPruneJobAlerts={props.onPruneJobAlerts}
            />;
        }
        if (activeTool.id === 'personalPa') {
            // @ts-ignore
            return <PersonalPaTool tool={activeTool} crmData={props.crmData} onBack={() => setActiveToolId('hub')} onSaveCustomDialerList={props.onSaveCustomDialerList} openDebug={props.openDebug} />;
        }
        if (activeTool.id === 'strategicPlanner') {
            return <StrategicPlannerTool
                tool={activeTool}
                onBack={() => setActiveToolId('hub')}
                strategicPlannerReport={props.strategicPlannerReport}
                onGenerateReport={props.onGenerateStrategicPlannerReport}
            />;
        }
        if (activeTool.id === 'emailBuilder') {
            return <EmailBuilderTool tool={activeTool} crmData={props.crmData} onBack={() => setActiveToolId('hub')} openDebug={props.openDebug} />;
        }
        if (activeTool.id === 'schoolValidator') {
            return <SchoolDataValidatorTool schools={props.crmData.schools} onUpdateSchool={props.onUpdateSchool} onBack={() => setActiveToolId('hub')} openDebug={props.openDebug} />;
        }
    }


    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">JAY-AI Hub</h1>
                <p className="text-slate-400 max-w-2xl mx-auto mt-2">Your personal assistant for identifying opportunities and staying on top of school relationships.</p>
            </div>
            <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {aiTools.map(tool => (
                    <button 
                        key={tool.id} 
                        onClick={() => setActiveToolId(tool.id as AiToolId)}
                        className="bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:bg-slate-800 transition-all text-center flex flex-col items-center justify-center aspect-square"
                    >
                        <tool.icon className="w-10 h-10 text-sky-400 mb-3" />
                        <span className="font-semibold text-white text-sm">{tool.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StrategicAiHub;
