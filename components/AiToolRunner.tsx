import React, { useState } from 'react';
import { generateGeminiText } from '../services/gemini';
import { addAIDebugEvent } from '../src/debug/aiDebug';
import { CrmData } from '../types';
import { SpinnerIcon } from './icons';

interface AiToolRunnerProps {
    tool: { id: string; name: string; icon: React.ElementType; prompt: string; };
    crmData: CrmData;
    onBack: () => void;
}

const AiToolRunner: React.FC<AiToolRunnerProps> = ({ tool, crmData, onBack }) => {
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { icon: Icon } = tool;

    const generate = async () => {
        setIsLoading(true);
        setError(null);
        setResult('');
        const modelName = "gemini-1.5-flash";
        const envVars = {
            ...(typeof process !== 'undefined' ? (process as any).env ?? {} : {}),
            ...((import.meta as any)?.env ?? {})
        };

        try {
            const dataSummary = {
                schools: crmData.schools.slice(0, 20).map(s => ({ name: s.name, location: s.location, manager: s.accountManager, engagement: s.engagementScore })),
                tasks: crmData.tasks.slice(0, 50).map(t => ({ school: t.schoolName, desc: t.taskDescription, due: t.dueDate, completed: t.isCompleted })),
                notes: crmData.notes.slice(0, 50).map(n => ({ school: n.schoolName, note: n.note.substring(0, 100), date: n.date })),
                calls: crmData.callLogs.slice(0, 50).map(c => ({ school: c.schoolName, notes: c.notes.substring(0, 100), date: c.dateCalled, transcript: c.transcript ? c.transcript.substring(0, 200) : undefined })),
                opportunities: crmData.opportunities.slice(0, 20).map(o => ({name: o.name, school: o.schoolName, stage: o.progressStage})),
                candidates: crmData.candidates.slice(0, 20).map(c => ({name: c.name, location: c.location, drives: c.drives, availability: c.availability}))
            };

            const context = "Context: General check-in with a school that has been quiet recently.";
            
            const basePrompt = tool.prompt
                .replace('{{CRM_DATASET}}', JSON.stringify(dataSummary))
                .replace('{{CONTEXT}}', context);

            const fullPrompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

${basePrompt}

JSON schema:
{
  "result": "string"
}

If the tool instructions would normally return text, place it in the "result" field as a string.

Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

            const { rawText, error } = await generateGeminiText(fullPrompt, modelName);
            addAIDebugEvent({
                id: crypto.randomUUID(),
                toolName: tool.name,
                timestamp: Date.now(),
                prompt: fullPrompt,
                model: modelName,
                requestPayload: { prompt: fullPrompt },
                rawResponse: rawText,
                cleanedText: rawText || '',
                parsedJson: null,
                missingFields: [],
                error: error || null,
                errorStack: null,
                location: "components/AiToolRunner.tsx:44",
                environment: { envVars }
            });
            setResult(rawText || '');
            if (error) {
                setError('Sorry, the AI is having a moment. Please try again later.');
                alert('AI Error: ' + error);
            }

        } catch (e) {
            console.error(`Failed to generate AI result for ${tool.name}:`, e);
            addAIDebugEvent({
                id: crypto.randomUUID(),
                toolName: tool.name,
                timestamp: Date.now(),
                prompt: '',
                model: modelName,
                requestPayload: {},
                rawResponse: null,
                cleanedText: '',
                parsedJson: null,
                missingFields: [],
                error: e instanceof Error ? e.message : 'Unknown error',
                errorStack: e instanceof Error ? e.stack ?? null : null,
                location: "components/AiToolRunner.tsx:65",
                environment: { envVars }
            });
            alert('AI Error: ' + (e instanceof Error ? e.message : 'Unable to run AI tool.'));
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

            {!isLoading && !result && (
                <div className="flex-grow flex flex-col items-center justify-center">
                    <button 
                        onClick={generate}
                        className="flex items-center gap-3 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors text-lg shadow-lg"
                    >
                        <Icon className="w-6 h-6" />
                        Generate with JAY-AI
                    </button>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>
            )}
            
            {isLoading && (
                 <div className="flex-grow flex items-center justify-center text-slate-400">
                    <SpinnerIcon className="w-8 h-8 mr-4" />
                    <span className="text-lg">AI is thinking...</span>
                </div>
            )}
            
            {result && !isLoading && (
                <div className="flex-grow overflow-y-auto bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <pre className="text-slate-300 whitespace-pre-wrap font-sans">{result}</pre>
                </div>
            )}
        </div>
    );
};

export default AiToolRunner;
