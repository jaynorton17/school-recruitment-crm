import React, { useState, useMemo } from 'react';
import { Opportunity, School, User } from '../types';
import { AddIcon, TrophyIcon, OpportunitiesIcon } from './icons';
import AddEditOpportunityModal from './AddEditOpportunityModal';
import { parseUKDateTimeString } from '../utils';

const OpportunityCard: React.FC<{
    opportunity: Opportunity;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, oppId: string) => void;
    onClick: () => void;
    onSchoolClick: (e: React.MouseEvent) => void;
}> = ({ opportunity, onDragStart, onClick, onSchoolClick }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, opportunity.id)}
            onClick={onClick}
            className="bg-slate-800 p-3 rounded-lg shadow-md cursor-grab active:cursor-grabbing border border-slate-700 hover:border-sky-500 transition-all"
        >
            <p className="font-semibold text-white">{opportunity.name}</p>
            <button onClick={onSchoolClick} className="text-sm text-sky-400 hover:underline text-left">{opportunity.schoolName}</button>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">{opportunity.accountManager}</p>
            </div>
        </div>
    );
};

const BoardColumn: React.FC<{
    stage: Opportunity['progressStage'];
    title: string;
    opportunities: Opportunity[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, oppId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, newStage: Opportunity['progressStage']) => void;
    onSelectOpportunity: (opp: Opportunity) => void;
    onSelectSchool: (school: School) => void;
    schools: School[];
}> = ({ stage, title, opportunities, onDragStart, onDrop, onSelectOpportunity, onSelectSchool, schools }) => {
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleSchoolClick = (e: React.MouseEvent, schoolName: string) => {
        e.stopPropagation(); // Prevent card click
        const school = schools.find(s => s.name === schoolName);
        if (school) {
            onSelectSchool(school);
        }
    };

    return (
        <div 
            className="flex-shrink-0 w-64 bg-slate-900 rounded-xl flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => onDrop(e, stage)}
        >
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">{title} ({opportunities.length})</h3>
            </div>
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                {opportunities.map(opp => (
                    <OpportunityCard 
                        key={opp.id} 
                        opportunity={opp} 
                        onDragStart={onDragStart}
                        onClick={() => onSelectOpportunity(opp)}
                        onSchoolClick={(e) => handleSchoolClick(e, opp.schoolName)}
                    />
                ))}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


// Main Component
const OpportunitiesPage: React.FC<{
    opportunities: Opportunity[];
    schools: School[];
    users: User[];
    currentUser: { name: string; email: string; };
    onAddOpportunity: (opp: Omit<Opportunity, 'excelRowIndex' | 'id' | 'dateCreated' | 'notes'>) => void;
    onUpdateOpportunity: (opp: Opportunity) => void;
    onDeleteOpportunity: (opp: Opportunity) => void;
    onSelectOpportunity: (opp: Opportunity) => void;
    onSelectSchool: (school: School) => void;
}> = ({ opportunities, schools, users, currentUser, onAddOpportunity, onUpdateOpportunity, onDeleteOpportunity, onSelectOpportunity, onSelectSchool }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);

    const kpiData = useMemo(() => {
        const openOpps = opportunities.filter(o => o.progressStage !== '100% - Closed Won' && o.progressStage !== '100% - Closed Lost');
        const wonOpps = opportunities.filter(o => o.progressStage === '100% - Closed Won');
        const lostOpps = opportunities.filter(o => o.progressStage === '100% - Closed Lost');
        
        const totalClosed = wonOpps.length + lostOpps.length;
        const winRate = totalClosed > 0 ? Math.round((wonOpps.length / totalClosed) * 100) : 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const wonThisMonth = wonOpps
            .filter(o => (parseUKDateTimeString(o.dateCreated)?.getTime() || 0) >= startOfMonth.getTime()).length;

        return { openPipelineCount: openOpps.length, wonThisMonth, winRate };
    }, [opportunities]);


    const handleOpenModal = (opp?: Opportunity) => {
        setOpportunityToEdit(opp || null);
        setIsModalOpen(true);
    };

    const handleSubmit = (oppData: Omit<Opportunity, 'excelRowIndex' | 'id' | 'dateCreated' | 'notes'> | Opportunity) => {
        if ('id' in oppData) {
            onUpdateOpportunity(oppData as Opportunity);
        } else {
            onAddOpportunity(oppData);
        }
    };
    
    const STAGES: { stage: Opportunity['progressStage'], title: string }[] = [
        { stage: '5% - Opportunity identified', title: 'Identified' },
        { stage: '15% - Reached out', title: 'Reached Out' },
        { stage: '50% - Engagement', title: 'Engagement' },
        { stage: '75% - Negotiation', title: 'Negotiation' },
        { stage: '100% - Closed Won', title: 'Closed Won' },
        { stage: '100% - Closed Lost', title: 'Closed Lost' },
    ];

    const opportunitiesByStage = useMemo(() => {
        const grouped: Record<string, Opportunity[]> = {};
        STAGES.forEach(s => {
            grouped[s.stage] = [];
        });
        opportunities.forEach(opp => {
            if (grouped[opp.progressStage]) {
                grouped[opp.progressStage].push(opp);
            } else {
                 // Fallback for any stages not in our list
                if(!grouped['5% - Opportunity identified']) grouped['5% - Opportunity identified'] = [];
                grouped['5% - Opportunity identified'].push(opp);
            }
        });
        return grouped;
    }, [opportunities]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, oppId: string) => {
        e.dataTransfer.setData('opportunityId', oppId);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: Opportunity['progressStage']) => {
        const oppId = e.dataTransfer.getData('opportunityId');
        const oppToMove = opportunities.find(o => o.id === oppId);
        if (oppToMove && oppToMove.progressStage !== newStage) {
            onUpdateOpportunity({ ...oppToMove, progressStage: newStage });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <AddEditOpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                schools={schools}
                users={users}
                currentUser={currentUser}
                opportunityToEdit={opportunityToEdit}
            />
            <div className="flex-shrink-0 p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Opportunities Pipeline</h1>
                    <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                        <AddIcon className="w-5 h-5 mr-2" />
                        Add Opportunity
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Open Pipeline" value={String(kpiData.openPipelineCount)} icon={OpportunitiesIcon} color="bg-indigo-500/50" />
                    <StatCard title="Won (This Month)" value={String(kpiData.wonThisMonth)} icon={TrophyIcon} color="bg-emerald-500/50" />
                    <StatCard title="Win Rate" value={`${kpiData.winRate}%`} icon={TrophyIcon} color="bg-amber-500/50" />
                </div>
            </div>

            <div className="flex-grow flex gap-4 p-4 md:p-6 pt-0 md:pt-0 overflow-x-auto">
                {STAGES.map(({stage, title}) => (
                    <BoardColumn 
                        key={stage}
                        stage={stage}
                        title={title}
                        opportunities={opportunitiesByStage[stage]}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onSelectOpportunity={onSelectOpportunity}
                        onSelectSchool={onSelectSchool}
                        schools={schools}
                    />
                ))}
            </div>
        </div>
    );
};

export default OpportunitiesPage;