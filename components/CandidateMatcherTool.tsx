import React, { useState } from 'react';
import { getGeminiModel } from '../genaiClient';
import { CrmData, School, Candidate, JobAlert } from '../types';
import { SpinnerIcon, SearchIcon, UsersIcon, SchoolIcon, JobAlertsIcon } from './icons';

interface CandidateMatcherToolProps {
    tool: { id: string; name: string; icon: React.ElementType; };
    crmData: CrmData;
    onBack: () => void;
    onSelectSchool: (school: School) => void;
    onSelectCandidate: (candidate: Candidate) => void;
}

interface CandidateMatch { candidateName: string; reason: string; likelihood: number; }
interface SchoolMatch { schoolName: string; reason: string; likelihood: number; }
interface JobMatch { jobTitle: string; schoolName: string; reason: string; likelihood: number; }
interface MatchResults {
    candidateMatches: CandidateMatch[];
    schoolMatches: SchoolMatch[];
    jobMatches: JobMatch[];
}

const matcherPrompt = `You are the CANDIDATE, SCHOOL, & JOB MATCHER AI.
Your task is to find the best matches from the CRM data based on a user's query.

The user is searching for: "{{SEARCH_QUERY}}"

Analyze the CRM dataset provided. Return a single JSON object with three keys: "candidateMatches", "schoolMatches", and "jobMatches".

1. For "candidateMatches" (find candidates for jobs):
   - Find up to 5 best candidates from the 'candidates' data.
   - For each match, provide: { candidateName: string, reason: string, likelihood: number (0-100) }

2. For "schoolMatches" (find schools for prospecting):
   - Find up to 5 best schools from the 'schools' data that are good prospects based on the query.
   - For each match, provide: { schoolName: string, reason: string, likelihood: number (0-100) }

3. For "jobMatches" (find jobs for candidates):
   - Find up to 5 best jobs from the 'jobAlerts' data.
   - For each match, provide: { jobTitle: string, schoolName: string, reason: string, likelihood: number (0-100) }

If a category has no matches, return an empty array for that key.

CRM Dataset:
{{CRM_DATASET}}`;

const MatchColumn: React.FC<{
    title: string;
    icon: React.ElementType;
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ title, icon: Icon, items, renderItem }) => (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="font-semibold text-white text-lg flex items-center gap-2 mb-3">
            <Icon className="w-5 h-5 text-sky-400" />
            {title}
        </h3>
        {items.length > 0 ? (
            <div className="space-y-3">
                {items.map(renderItem)}
            </div>
        ) : (
            <p className="text-sm text-slate-500 text-center py-4">No matches found.</p>
        )}
    </div>
);


const CandidateMatcherTool: React.FC<CandidateMatcherToolProps> = ({ tool, crmData, onBack, onSelectSchool, onSelectCandidate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<MatchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const dataSummary = {
                schools: crmData.schools.map(s => ({ name: s.name, location: s.location, engagement: s.engagementScore })),
                candidates: crmData.candidates.map(c => ({ name: c.name, location: c.location, drives: c.drives, availability: c.availability, notes: c.notes })),
                jobAlerts: crmData.jobAlerts.map(j => ({ jobTitle: j.jobTitle, schoolName: j.schoolName, subject: j.subject, location: j.location }))
            };

            const fullPrompt = matcherPrompt
                .replace('{{CRM_DATASET}}', JSON.stringify(dataSummary))
                .replace('{{SEARCH_QUERY}}', searchQuery);

            const model = getGeminiModel('gemini-2.5-flash');
            const response = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }]}],
                responseMimeType: "application/json"
            });

            const result = JSON.parse(response.response.text().trim());
            setResults({
                candidateMatches: result.candidateMatches || [],
                schoolMatches: result.schoolMatches || [],
                jobMatches: result.jobMatches || [],
            });

        } catch (e) {
            console.error("Failed to generate AI matches:", e);
            setError("Sorry, the AI couldn't find matches. Please try a different query.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSchoolByName = (name: string) => {
        const school = crmData.schools.find(s => s.name === name);
        if (school) onSelectSchool(school);
    };

    const handleSelectCandidateByName = (name: string) => {
        const candidate = crmData.candidates.find(c => c.name === name);
        if (candidate) onSelectCandidate(candidate);
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
                <div className="ml-14 mt-4 flex gap-2">
                     <div className="relative flex-grow">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="e.g., 'Secondary Maths in Hampshire'"
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 outline-none text-lg"
                        />
                    </div>
                    <button onClick={handleSearch} disabled={isLoading} className="flex-shrink-0 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors text-lg disabled:opacity-50">
                        Match
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <SpinnerIcon className="w-8 h-8 mr-4" />
                        <span className="text-lg">Finding the best matches...</span>
                    </div>
                )}
                {!isLoading && error && (
                    <div className="text-center text-red-400 p-8">{error}</div>
                )}
                {!isLoading && !results && (
                    <div className="text-center text-slate-500 pt-16">
                        <p>Enter a query to find candidate, school, and job matches.</p>
                    </div>
                )}
                {!isLoading && results && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <MatchColumn title="Candidate Matches" icon={UsersIcon} items={results.candidateMatches} renderItem={(item: CandidateMatch, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded-md">
                                <button onClick={() => handleSelectCandidateByName(item.candidateName)} className="font-semibold text-sky-400 hover:underline">{item.candidateName}</button>
                                <p className="text-sm text-slate-400 mt-1">{item.reason}</p>
                                <p className="text-xs font-bold text-emerald-400 mt-2">{item.likelihood}% Likelihood</p>
                            </div>
                        )} />
                        <MatchColumn title="School Matches" icon={SchoolIcon} items={results.schoolMatches} renderItem={(item: SchoolMatch, i) => (
                             <div key={i} className="bg-slate-900/50 p-3 rounded-md">
                                <button onClick={() => handleSelectSchoolByName(item.schoolName)} className="font-semibold text-sky-400 hover:underline">{item.schoolName}</button>
                                <p className="text-sm text-slate-400 mt-1">{item.reason}</p>
                                <p className="text-xs font-bold text-emerald-400 mt-2">{item.likelihood}% Likelihood</p>
                            </div>
                        )} />
                        <MatchColumn title="Job Matches" icon={JobAlertsIcon} items={results.jobMatches} renderItem={(item: JobMatch, i) => (
                             <div key={i} className="bg-slate-900/50 p-3 rounded-md">
                                <p className="font-semibold text-white">{item.jobTitle}</p>
                                <button onClick={() => handleSelectSchoolByName(item.schoolName)} className="text-sm text-sky-400 hover:underline">{item.schoolName}</button>
                                <p className="text-sm text-slate-400 mt-1">{item.reason}</p>
                                <p className="text-xs font-bold text-emerald-400 mt-2">{item.likelihood}% Likelihood</p>
                            </div>
                        )} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateMatcherTool;
