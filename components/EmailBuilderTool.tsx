import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiJson } from '../services/gemini';
import { CrmData, School } from '../types';
import { SpinnerIcon, ClipboardIcon } from './icons';

interface EmailBuilderToolProps {
    tool: { id: string; name: string; icon: React.ElementType; };
    crmData: CrmData;
    onBack: () => void;
}

interface GeneratedContent {
    email: string;
    sms: string;
    subjects: string[];
    followup: string;
}

const emailBuilderPrompt = `You are the EMAIL BUILDER AI. Based on the context provided, generate a professional and personalized outreach communication set.

Return a single JSON object with the keys: "email", "sms", "subjects", "followup".
- "email": A full HTML email body. Use <p> and <strong> tags for structure.
- "sms": A short SMS version (max 160 characters).
- "subjects": An array of 3 subject line strings.
- "followup": A short follow-up line for the next day.

Use these smart tags where appropriate: {{school_name}}, {{contact_name}}, {{account_manager_name}}.

Context:
- School: {{SCHOOL_NAME}}
- Situation: {{CONTEXT}}

CRM Dataset (for context):
{{CRM_DATASET}}`;

const EmailBuilderTool: React.FC<EmailBuilderToolProps> = ({ tool, crmData, onBack }) => {
    const [selectedSchoolName, setSelectedSchoolName] = useState('');
    const [context, setContext] = useState('');
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (selectedSchoolName && context) {
            setIsLoading(true);
            setError(null);
            debounceTimeout.current = window.setTimeout(async () => {
                try {
                    const school = crmData.schools.find(s => s.name === selectedSchoolName);
                    
                    const dataSummary = {
                        schoolDetails: school,
                        recentNotes: crmData.notes.filter(n => n.schoolName === selectedSchoolName).slice(0, 3),
                        recentCalls: crmData.callLogs.filter(c => c.schoolName === selectedSchoolName).slice(0, 3),
                    };

                    const populatedPrompt = emailBuilderPrompt
                        .replace('{{SCHOOL_NAME}}', selectedSchoolName)
                        .replace('{{CONTEXT}}', context)
                        .replace('{{CRM_DATASET}}', JSON.stringify(dataSummary));

                    const defaultContent: GeneratedContent = { email: '', sms: '', subjects: [], followup: '' };
                    const { data: result, error, rawText } = await generateGeminiJson<GeneratedContent>(populatedPrompt, defaultContent);
                    const safeResult: GeneratedContent = {
                        email: typeof result.email === 'string' ? result.email : '',
                        sms: typeof result.sms === 'string' ? result.sms : '',
                        subjects: Array.isArray(result.subjects) ? result.subjects.filter((s): s is string => typeof s === 'string') : [],
                        followup: typeof result.followup === 'string' ? result.followup : '',
                    };
                    setGeneratedContent(safeResult);
                    if (error) {
                        console.debug('Email builder raw AI response:', rawText);
                        setError('AI output looked unusual. Please review before sending.');
                        alert('AI Error: ' + error);
                    }
                } catch (e) {
                    console.error("Failed to generate email content:", e);
                    alert('AI Error: ' + (e instanceof Error ? e.message : 'Failed to generate content.'));
                    setError("Failed to generate content. Please try again.");
                    setGeneratedContent(null);
                } finally {
                    setIsLoading(false);
                }
            }, 750);
        } else {
            setIsLoading(false);
            setGeneratedContent(null);
        }

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [selectedSchoolName, context, crmData]);
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                        {/* FIX: Corrected malformed SVG polyline points attribute that was causing a JSX parsing error. */}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                {/* Inputs */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-white">Context</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">School</label>
                        <select value={selectedSchoolName} onChange={e => setSelectedSchoolName(e.target.value)} className="w-full p-2 border border-slate-600 rounded-md bg-slate-800 text-white" required>
                            <option value="" disabled>Select a school...</option>
                            {crmData.schools.map(s => <option key={s.excelRowIndex} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Situation / Goal</label>
                        <textarea
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            rows={6}
                            className="w-full p-2 border border-slate-600 rounded-md bg-slate-800 text-white"
                            placeholder="e.g., Cold outreach to introduce our services. Follow up on our call from last week. Propose a specific candidate for their open role."
                        />
                    </div>
                </div>

                {/* Outputs */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col gap-4 overflow-y-auto relative">
                    {isLoading && <div className="absolute top-4 right-4"><SpinnerIcon className="w-6 h-6 text-sky-400" /></div>}
                    <h2 className="text-xl font-bold text-white">Generated Content</h2>

                    {error && <p className="text-red-400">{error}</p>}
                    
                    {!generatedContent && !isLoading && !error && (
                        <div className="text-center text-slate-500 py-16">
                            <p>Select a school and provide context to generate content.</p>
                        </div>
                    )}

                    {generatedContent && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Subject Lines</h3>
                                <div className="space-y-2">
                                    {generatedContent.subjects.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded-md">
                                            <span className="text-sm text-slate-200">{s}</span>
                                            <button onClick={() => copyToClipboard(s)} className="p-1 text-slate-400 hover:text-white"><ClipboardIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Email Body</h3>
                                <div className="p-3 bg-white text-slate-800 rounded-md prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.email }} />
                            </div>
                             <div>
                                <h3 className="font-semibold text-slate-300 mb-2">SMS Version</h3>
                                <div className="p-2 bg-slate-800 rounded-md text-sm text-slate-200">{generatedContent.sms}</div>
                            </div>
                             <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Follow-up Line</h3>
                                <div className="p-2 bg-slate-800 rounded-md text-sm text-slate-200">{generatedContent.followup}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailBuilderTool;
