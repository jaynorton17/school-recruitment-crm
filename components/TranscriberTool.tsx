import React, { useState, useMemo } from 'react';
import { generateGeminiText } from '../services/gemini';
import { CrmData, CallLog } from '../types';
import { AiIcon, SpinnerIcon, CheckIcon, ExclamationIcon, NotesIcon } from './icons';
import { parseUKDateTimeString, safeArray } from '../utils';

interface TranscriberToolProps {
    crmData: CrmData;
    onBack: () => void;
    onUpdateCallLog: (callLog: CallLog) => Promise<void>;
}

const TranscriptionCard: React.FC<{
    log: CallLog;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ log, isExpanded, onToggleExpand }) => {
    const hasNotes = log.notes && log.notes.trim() !== '';

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-white">{log.schoolName}</h4>
                    <p className="text-sm text-slate-400">{log.dateCalled} &middot; {log.accountManager}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${hasNotes ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {hasNotes ? 'Notes Exist' : 'Notes Missing'}
                </span>
            </div>
            {hasNotes && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400 font-semibold mb-1">Notes:</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{log.notes}</p>
                </div>
            )}
            <div className="mt-3">
                <button onClick={onToggleExpand} className="text-sm text-sky-400 hover:underline">
                    {isExpanded ? 'Hide' : 'View'} Transcript
                </button>
                {isExpanded && (
                    <pre className="mt-2 p-3 bg-slate-900/50 rounded-md text-sm text-slate-400 max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                        {log.transcript}
                    </pre>
                )}
            </div>
        </div>
    );
};


const TranscriberTool: React.FC<TranscriberToolProps> = ({ crmData, onBack, onUpdateCallLog }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
    const [expandedTranscriptId, setExpandedTranscriptId] = useState<number | null>(null);

    const transcribedCalls = useMemo(() => {
        return safeArray(crmData.callLogs)
            .filter(log => log.transcript && log.transcript.trim() !== '')
            .sort((a, b) => {
                const dateA = parseUKDateTimeString(a.dateCalled)?.getTime() || 0;
                const dateB = parseUKDateTimeString(b.dateCalled)?.getTime() || 0;
                return dateB - dateA;
            });
    }, [crmData.callLogs]);

    const checkMissedNotes = async () => {
        setIsLoading(true);
        setStatus({ type: 'info', message: 'Scanning for calls with missing notes...' });

        const callsToProcess = transcribedCalls.filter(log => !log.notes || log.notes.trim() === '');
        
        if (callsToProcess.length === 0) {
            setStatus({ type: 'success', message: 'All transcribed calls already have notes.' });
            setIsLoading(false);
            return;
        }

        setStatus({ type: 'info', message: `Found ${callsToProcess.length} calls. Generating AI notes...` });
        
        const updatePromises = callsToProcess.map(async (call) => {
            try {
                const prompt = `Based on the following call transcript, generate a concise summary of 1-3 sentences to be used as call notes. Transcript: "${call.transcript}"`;
                const { rawText, error } = await generateGeminiText(prompt);
                const aiNotes = rawText;

                if (error) {
                    console.debug('Transcriber raw AI response:', rawText);
                    alert('AI Error: ' + error);
                }

                if (aiNotes) {
                    const updatedLog = { ...call, notes: `(AI-Generated) ${aiNotes.trim()}` };
                    await onUpdateCallLog(updatedLog);
                    return true;
                }
                return false;
            } catch (error) {
                console.error(`Failed to process call log ${call.excelRowIndex}:`, error);
                alert('AI Error: ' + (error instanceof Error ? error.message : 'Unable to generate notes.'));
                return false;
            }
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(Boolean).length;

        if (successCount > 0) {
            setStatus({ type: 'success', message: `Successfully generated notes for ${successCount} call log(s).` });
        } else {
            setStatus({ type: 'error', message: 'Could not generate any notes. Please try again later.' });
        }
        setIsLoading(false);
    };

    const StatusIcon = () => {
        if (!status) return null;
        switch (status.type) {
            case 'info': return <SpinnerIcon className="w-5 h-5" />;
            case 'success': return <CheckIcon className="w-5 h-5" />;
            case 'error': return <ExclamationIcon className="w-5 h-5" />;
        }
    };
    
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">Transcriber</h1>
                </div>
                <p className="text-slate-400 max-w-2xl mt-2 ml-14">Review call transcripts and automatically generate notes for any that are missing them.</p>
            </div>
            
            <div className="flex-shrink-0 mb-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                    onClick={checkMissedNotes}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors text-lg shadow-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    <NotesIcon className="w-6 h-6" />
                    Check for Missed Notes
                </button>
                {status && (
                     <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                        status.type === 'info' ? 'text-sky-300' :
                        status.type === 'success' ? 'text-emerald-300' : 'text-red-400'
                     }`}>
                        <StatusIcon />
                        <span>{status.message}</span>
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto">
                {transcribedCalls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {transcribedCalls.map(log => (
                            <TranscriptionCard 
                                key={log.excelRowIndex}
                                log={log}
                                isExpanded={expandedTranscriptId === log.excelRowIndex}
                                onToggleExpand={() => setExpandedTranscriptId(prev => prev === log.excelRowIndex ? null : log.excelRowIndex)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 text-slate-500">
                        No transcribed calls found in the CRM.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriberTool;