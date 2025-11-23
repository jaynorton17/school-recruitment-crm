
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiModel } from '../services/gemini';
import { School } from '../types';
import { SpinnerIcon, CheckIcon, GlobeIcon, StopIcon, RefreshIcon } from './icons';

interface SchoolDataValidatorToolProps {
    schools: School[];
    onUpdateSchool: (updatedSchool: School) => Promise<void>;
    onBack: () => void;
}

const SchoolDataValidatorTool: React.FC<SchoolDataValidatorToolProps> = ({ schools, onUpdateSchool, onBack }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [processedCount, setProcessedCount] = useState(0);
    const [updatedCount, setUpdatedCount] = useState(0);
    const stopRef = useRef(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const startValidation = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        stopRef.current = false;
        setProcessedCount(0);
        setUpdatedCount(0);
        setLogs([]);
        addLog("Starting school data validation...");

        // Process in small batches to avoid rate limits and allow stopping
        for (let i = 0; i < schools.length; i++) {
            if (stopRef.current) {
                addLog("Validation stopped by user.");
                break;
            }

            const school = schools[i];
            setProcessedCount(i + 1);

            // Skip if school seems to have good data already (optional check, but good for efficiency)
            // if (school.website && school.contactNumber) continue; 

            try {
                const prompt = `Find the official website URL and the main contact telephone number for the school "${school.name}" located in "${school.location}". Return a JSON object with keys: "website" (string) and "phoneNumber" (string). If not found, return empty strings.`;
                
                const model = getGeminiModel('gemini-1.5-flash');
                const response = await model.generateContent({ prompt });

                const result = JSON.parse(response.response.text().trim());
                let needsUpdate = false;
                const updates: string[] = [];

                if (result.website && result.website !== school.website) {
                    school.website = result.website;
                    needsUpdate = true;
                    updates.push(`Website: ${result.website}`);
                }

                if (result.phoneNumber && result.phoneNumber !== school.contactNumber) {
                    school.contactNumber = result.phoneNumber;
                    needsUpdate = true;
                    updates.push(`Phone: ${result.phoneNumber}`);
                }

                if (needsUpdate) {
                    await onUpdateSchool(school);
                    setUpdatedCount(prev => prev + 1);
                    addLog(`Updated ${school.name}: ${updates.join(', ')}`);
                } else {
                    // addLog(`Checked ${school.name}: No changes needed.`);
                }

            } catch (e) {
                console.error(`Error processing ${school.name}:`, e);
                addLog(`Error processing ${school.name}.`);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setIsProcessing(false);
        addLog("Validation complete.");
    };

    const stopValidation = () => {
        stopRef.current = true;
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1 className="text-3xl font-bold text-white">School Data Validator</h1>
                </div>
                <p className="text-slate-400 max-w-2xl mt-2 ml-14">Automatically verify and update school websites and contact numbers.</p>
            </div>

            <div className="flex-shrink-0 mb-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white">
                    <span className="font-bold text-xl">{processedCount}</span> / {schools.length} Checked
                    <span className="mx-3 text-slate-600">|</span>
                    <span className="font-bold text-emerald-400 text-xl">{updatedCount}</span> Updated
                </div>
                <button 
                    onClick={isProcessing ? stopValidation : startValidation}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 font-semibold px-6 py-3 rounded-lg transition-colors text-lg shadow-lg ${isProcessing ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
                >
                    {isProcessing ? <><StopIcon className="w-6 h-6" /> Stop</> : <><GlobeIcon className="w-6 h-6" /> Start Validation</>}
                </button>
            </div>

            <div className="flex-grow bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col p-4">
                <h3 className="text-lg font-semibold text-white mb-2 flex-shrink-0">Activity Log</h3>
                <div ref={logContainerRef} className="flex-grow bg-black/50 p-3 rounded-md overflow-y-auto text-xs text-slate-400 font-mono space-y-1">
                    {logs.length === 0 ? <p className="text-slate-600 italic">Ready to start...</p> : logs.map((line, i) => <p key={i}>{line}</p>)}
                </div>
            </div>
        </div>
    );
};

export default SchoolDataValidatorTool;
