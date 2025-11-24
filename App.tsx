
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { msalConfig, loginRequest } from './authConfig';
import { getAccessToken, getWorkbookPath, getAllCRMData, addSchool, addCallLog, addNote, addTask, addEmail, getWorksheetMap, updateTask, deleteTask, getUserEmails, updateSchool, getUserProfile, updateSpokenToCoverManagerStatus, updateNote, deleteNote, sendEmail, addOpportunity, updateOpportunity, deleteOpportunity, deleteCallLog, updateCallLog, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate, clearAllEmailTemplates, addEmailTemplateAttachment, deleteEmailTemplateAttachment, updateOpportunityNotes, updateCallLogTranscript, addAnnouncement, clearAllEmailTemplateAttachments, addBooking, deleteBooking, updateBooking, updateCandidate, addCandidate, addJobAlert, deleteJobAlert } from './graph';
import { parseSchools, parseTasks, parseNotes, parseEmails, parseCallLogs, parseUsers, formatDateUK, parseSyncedEmails, parseUKDate, parseUKDateTime, parseCandidates, parseOpportunities, parseUKDateTimeString, formatDateTimeUK, parseEmailTemplates, parseEmailTemplateAttachments, resilientWrite, parseAnnouncements, parseBookings, getExcelSerialDate, parseJobAlerts, formatTime, formatDateTimeUS_Excel } from './utils';
import { generateGeminiJson, generateGeminiText } from './services/gemini';
import { callUnifiedAI } from './services/aiRouter';
import AiDebugPanel from './components/AiDebugPanel';
import AIDebugPanel from './src/components/AIDebugPanel';
import { AiDebugInfo, analyseAiResponse } from './services/aiDebug';
import { addAIDebugEvent } from './src/debug/aiDebug';
import type { AIDebugEvent } from './src/debug/aiDebug';


import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import SchoolsPage from './components/SchoolsPage';
import SchoolProfilePage from './components/SchoolProfilePage';
import TasksAndNotesPage from './components/TasksAndNotesPage';
import EmailsPage from './components/EmailsPage';
import CallsPage from './components/CallsPage';
import CallsDialerPage from './components/CallsDialerPage';
import ReportsPage from './components/ReportsPage';
import OpportunitiesPage from './components/OpportunitiesPage';
import OpportunityDetailPage from './components/OpportunityDetailPage';
import AdminMappingManager from './components/AdminMappingManager';
import AddCallLogModal from './components/CallTranscriberModal';
import AddNoteModal from './components/AddNoteModal';
import AddTaskModal from './components/AddTaskModal';
import AddEmailModal from './components/AddEmailModal';
import SendEmailModal from './components/SendEmailModal';
import Login from './components/Login';
import Loading from './components/Loading';
import PostLoginLoading from './components/PostLoginLoading';
import NotificationModal from './components/NotificationModal';
import CreateAnnouncementModal from './components/CreateAnnouncementModal';
import ViewAnnouncementModal from './components/ViewAnnouncementModal';
import TaskSuggestionModal from './components/TaskSuggestionModal';
import AiNotesReadyModal from './components/AiNotesReadyModal';
import BackgroundSyncStatus, { BackgroundTask } from './components/BackgroundSyncStatus';
import ProfileModal from './components/ProfileModal';
import QrCodeModal from './components/QrCodeModal';
import StrategicAiHub from './components/StrategicAiHub';
import CandidatesPage from './components/CandidatesPage';
import CandidateProfilePage from './components/CandidateProfilePage';
import BookOfBusinessPage from './components/BookOfBusinessPage';
import AddBookingModal from './components/AddBookingModal';
import AddCandidateModal from './components/AddCandidateModal';
import JobAlertNotification from './components/JobAlertNotification';


import { School, Task, Note, Email, CallLog, User, EmailTemplate, Candidate, Opportunity, OpportunityNote, Announcement, ManualAttachment, SharePointAttachment, SuggestedTask, PerformanceFeedback, SearchResult, AiEmailDraft, CrmData, Booking, JobAlert, CustomDialerList, CoachReportData, AiSuggestion, SuggestedCallList, CoachChatMessage } from './types';

// Global MSAL instance and initialization promise to handle React Strict Mode double-invocation
const msalInstance = new PublicClientApplication(msalConfig);
const worksheetMap = getWorksheetMap();
let msalInitPromise: Promise<void> | null = null;

interface UserProfile {
    profilePicture?: string;
    address?: string;
    mobileNumber?: string;
}

const coachPrompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

You are the COACH AI for EduTalent Connect, a school recruitment agency. Analyze the recruiter's recent activity from the provided CRM dataset to generate a structured performance report. Your feedback should be sharp, insightful, and directly aimed at improving their performance in the context of educational recruitment.

JSON schema:
{
  "kpis": {
    "callsMade": "number",
    "emailVolume": "number",
    "emailReplies": "number",
    "taskCompletion": "number",
    "followUpsMissed": "number",
    "schoolsWithEngagement": "number"
  },
  "keyInsights": [
    { "title": "string", "description": "string" }
  ],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendedActions": [
    { "description": "string", "schoolName": "string" }
  ]
}

-   Calculate KPIs based on the dataset. Task completion is (completed tasks / total tasks).
-   Provide 2-4 key insights that are specific and actionable for a recruiter.
-   List 2-3 top strengths and 2-3 main weaknesses.
-   Suggest 3-5 actionable recommendations. Help the account manager be the best they can be by suggesting things like adding specific value propositions into calls. If an action is for a specific school, include the schoolName.
-   If information is missing, set the value to an empty string, 0, or an empty array as appropriate.

CRM Dataset:
{{CRM_DATASET}}

Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

const strategicPlannerPrompt = `You are the STRATEGIC PLANNER module for the JAY-AI Hub.
Place all output directly underneath the ‘Strategic Planner’ header.

Analyse long-term CRM data provided below including:
• booking trends • revenue history • seasonal demand • school behaviour • candidate supply gaps • pipeline health • local authority patterns • past conversion data • term-time fluctuations

Create a 2-week strategic plan that includes:

Schools closest to converting

Schools drifting cold & recovery steps

High-revenue targets

Call plan for each day

Hot candidates needing placement

Campaign ideas for specific school groups

Risk forecast (shortages, drop-offs)

Full priority list for the recruiter

Output with clean headings and short, strong descriptions.

CRM Dataset:
{{CRM_DATASET}}`;

const personalPaPrompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

You are the PERSONAL PA AI. Your task is to analyze the provided CRM data and generate a daily briefing for a school recruiter.

JSON schema:
{
  "briefing": "string",
  "suggestedCallList": {
    "name": "string",
    "reason": "string",
    "filters": "object"
  }
}

- "briefing": A markdown-formatted string. It MUST include a section titled "### Top 5 High-Impact Actions". Also include sections for Overdue Tasks, Today's Priorities, and Opportunities to watch.
- "suggestedCallList": A single object with "name", "reason", and a complete "filters" object for creating a proactive call list in the dialer.
- If any value is unavailable, return an empty string or an empty object while keeping schema keys present.

CRM Dataset:
{{CRM_DATASET}}

Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

const App: React.FC = () => {
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [msalReady, setMsalReady] = useState(false);
    const [data, setData] = useState<CrmData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeView, _setActiveView] = useState('Dashboard');
    const [viewHistory, setViewHistory] = useState(['Dashboard']);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile>({});
    const [schoolForAction, setSchoolForAction] = useState<School | null>(null);
    const [isAddCallLogModalOpen, setIsAddCallLogModalOpen] = useState(false);
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
    const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
    const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
    const [callLogInitialData, setCallLogInitialData] = useState<{ duration?: string; notes?: string; transcript?: string; }>({});
    const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Partial<Task> | null>(null);
    const [activeCall, setActiveCall] = useState<{ school: School; startTime: Date; } | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [activeCallNotes, setActiveCallNotes] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCreateAnnouncementModalOpen, setIsCreateAnnouncementModalOpen] = useState(false);
    const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
    const [isViewAnnouncementModalOpen, setIsViewAnnouncementModalOpen] = useState(false);
    const timerRef = useRef<number | null>(null);
    const [recentlyViewedSchools, setRecentlyViewedSchools] = useState<School[]>([]);

    const mainContentRef = useRef<HTMLElement>(null);
    const scrollPositions = useRef<{[view: string]: number}>({});
    const activeViewRef = useRef(activeView);

    const [userStatus, setUserStatus] = useState<'online' | 'away' | 'offline'>('offline');
    const inactivityTimerRef = useRef<number | null>(null);

    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [aiDebug, setAiDebug] = useState<AiDebugInfo | null>(null);
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    const openDebug = (debug: AiDebugInfo) => {
        setAiDebug(debug);
        setIsDebugOpen(true);
    };

    const getEnvVars = () => ({
        ...(typeof process !== 'undefined' ? (process as any).env ?? {} : {}),
        ...((import.meta as any)?.env ?? {})
    });

    const logAIDebugEvent = (event: Omit<AIDebugEvent, 'environment'> & { environment?: { envVars: any } }) => {
        try {
            addAIDebugEvent({
                ...event,
                environment: event.environment ?? { envVars: getEnvVars() }
            });
        } catch (err) {
            console.warn('Failed to log AI debug event', err);
        }
    };


    const setActiveView = (view: string) => {
        if (mainContentRef.current) {
            scrollPositions.current[activeViewRef.current] = mainContentRef.current.scrollTop;
        }

        if (view !== activeViewRef.current) {
            setViewHistory(prev => [...prev, view]);
        }

        _setActiveView(view);
        activeViewRef.current = view;
    };
    
    useEffect(() => {
        const restoreScroll = () => {
             if (mainContentRef.current && scrollPositions.current[activeView]) {
                mainContentRef.current.scrollTop = scrollPositions.current[activeView];
            } else if (mainContentRef.current) {
                mainContentRef.current.scrollTop = 0; 
            }
        }
        const timer = setTimeout(restoreScroll, 50);
        return () => clearTimeout(timer);
    }, [activeView]);

    const [isJayNortonAdminView, setIsJayNortonAdminView] = useState(false);
    const [isJoshColeAdminView, setIsJoshColeAdminView] = useState(false);

    // AI Features State
    const [isTaskSuggestionModalOpen, setIsTaskSuggestionModalOpen] = useState(false);
    const [isAiNotesReadyModalOpen, setIsAiNotesReadyModalOpen] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
    const [aiGeneratedNotes, setAiGeneratedNotes] = useState('');
    const [aiGeneratedEmail, setAiGeneratedEmail] = useState<AiEmailDraft | null>(null);
    const [isGeneratingForTranscript, setIsGeneratingForTranscript] = useState<number | null>(null);
    const [callLogForAi, setCallLogForAi] = useState<CallLog | null>(null);
    const [coachReport, setCoachReport] = useState<CoachReportData | null>(null);
    const [salesStrategistReport, setSalesStrategistReport] = useState<{ suggestions: AiSuggestion[], suggestedCallList: SuggestedCallList } | null>(null);
    const [strategicPlannerReport, setStrategicPlannerReport] = useState<string | null>(null);
    const [coachChatHistory, setCoachChatHistory] = useState<CoachChatMessage[]>([]);
    const [isCoachResponding, setIsCoachResponding] = useState(false);
    // Background Transcription State
    const [transcription, setTranscription] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
    
    // Reminder state
    const [taskForNotification, setTaskForNotification] = useState<Task | null>(null);
    const [snoozedTasks, setSnoozedTasks] = useState<{[taskId: number]: number}>({}); 
    const [dismissedForThisCycle, setDismissedForThisCycle] = useState<{[taskId: number]: string}>({}); 
    
    // Job Alerts State
    const [isJobSearching, setIsJobSearching] = useState(false);
    const [jobSearchLog, setJobSearchLog] = useState<string[]>([]);
    const [jobSearchSummary, setJobSearchSummary] = useState<{ found: number, duplicates: number, added: number, schoolsChecked: number } | null>(null);
    const stopJobSearchRef = useRef(false);
    const [jobAlertNotifications, setJobAlertNotifications] = useState<JobAlert[]>([]);

    const runAutomaticNoteGenerationRef = useRef<(crmData: CrmData | null) => void>();

    // FIX: Use a ref to hold the latest data to prevent stale closures in callbacks.
    const dataRef = useRef<CrmData | null>(null);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);


    const isSuperAdmin = useMemo(() => {
        if (!currentUser?.email) return false;
        const lowerCaseEmail = currentUser.email.toLowerCase();
        return ['admin@edutalentconnect.com', 'd.william@edutalentconnect.com'].includes(lowerCaseEmail);
    }, [currentUser]);
    const isJayNorton = useMemo(() => currentUser?.email.toLowerCase() === 'jay.norton@edutalentconnect.com', [currentUser]);
    const isJoshCole = useMemo(() => currentUser?.email.toLowerCase() === 'josh.cole@edutalentconnect.com', [currentUser]);

    const isDanAyres = useMemo(() =>
      currentUser?.email.toLowerCase() === "daniel.ayres@edutalentconnect.co.uk",
      [currentUser]
    );

    // Robust MSAL Initialization
    useEffect(() => {
        if (!msalInitPromise) {
            msalInitPromise = msalInstance.initialize();
        }
        
        msalInitPromise
            .then(() => msalInstance.handleRedirectPromise())
            .then((response) => {
                if (response && response.account) {
                    setAccount(response.account);
                } else {
                    const currentAccounts = msalInstance.getAllAccounts();
                    if (currentAccounts.length > 0) {
                        setAccount(currentAccounts[0]);
                    }
                }
            })
            .catch((err) => {
                console.error("MSAL Initialization Error:", err);
                setError("Failed to initialize sign-in system. Please refresh.");
            })
            .finally(() => {
                setMsalReady(true);
            });
    }, []);

    const handleLogin = async () => {
        if (!msalReady) {
            alert("Sign-in system is initializing, please wait...");
            return;
        }
        
        setIsLoggingIn(true);
        setError(null);

        try {
            const response = await msalInstance.loginPopup(loginRequest);
            setAccount(response.account);
        } catch (e: any) {
            console.error("Login failed:", e);
            setError(`Login failed: ${e.message || "Unknown error"}`);
            alert(`Login failed: ${e.message || "Please check the console for details."}`);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const fetchData = useCallback(async () => {
        if (!account) return null;
    
        const crmDataRaw = await getAllCRMData(msalInstance, account, worksheetMap);
        
        const parsedSchools = parseSchools(crmDataRaw.schools);
        const parsedTasks = parseTasks(crmDataRaw.tasks);
        const parsedNotes = parseNotes(crmDataRaw.notes);
        const parsedCallLogs = parseCallLogs(crmDataRaw.callLogs);
        const parsedUsers = parseUsers(crmDataRaw.users);
        const parsedCandidates = parseCandidates(crmDataRaw.candidates);
        const parsedOpportunities = parseOpportunities(crmDataRaw.opportunities);
        const parsedAttachments = parseEmailTemplateAttachments(crmDataRaw.emailTemplateAttachments);
        const parsedEmailTemplates = parseEmailTemplates(crmDataRaw.emailTemplates, parsedAttachments);
        const parsedAnnouncements = parseAnnouncements(crmDataRaw.announcements);
        const parsedBookings = parseBookings(crmDataRaw.bookings);
        const parsedJobAlerts = parseJobAlerts(crmDataRaw.jobAlerts);
        const loggedEmails = parseEmails(crmDataRaw.emails);

        const lastCallDates = new Map<string, string>();
        [...parsedCallLogs].sort((a, b) => (parseUKDateTimeString(b.dateCalled)?.getTime() || 0) - (parseUKDateTimeString(a.dateCalled)?.getTime() || 0))
            .forEach(log => {
                if (log.schoolName && !lastCallDates.has(log.schoolName)) {
                    lastCallDates.set(log.schoolName, log.dateCalled);
                }
            });

        const augmentedSchools = parsedSchools.map(school => ({
            ...school,
            lastCalledDate: lastCallDates.get(school.name),
        }));

        const userEmails = await getUserEmails(msalInstance, account);
        const syncedEmails = parseSyncedEmails(userEmails, augmentedSchools, { name: account.name || '', email: account.username }, parsedUsers.map(u => u.email));
        
        const allEmails = [...loggedEmails, ...syncedEmails];
        const uniqueEmails = Array.from(new Map(allEmails.map(email => 
            [`${email.schoolName}-${email.subject}-${email.date}`, email]
        )).values());

        return {
            schools: augmentedSchools,
            tasks: parsedTasks,
            notes: parsedNotes,
            emails: uniqueEmails,
            callLogs: parsedCallLogs,
            users: parsedUsers,
            candidates: parsedCandidates,
            opportunities: parsedOpportunities,
            emailTemplates: parsedEmailTemplates,
            performanceFeedback: [],
            announcements: parsedAnnouncements,
            bookings: parsedBookings,
            jobAlerts: parsedJobAlerts
        };
    }, [account]);

    const loadData = useCallback(async (fullReload = true) => {
        if (fullReload) {
            setIsLoading(true);
            setLoadingProgress(10);
        } else {
            setIsBackgroundSyncing(true);
        }
    
        try {
            if (fullReload) setLoadingProgress(50);
            const newData = await fetchData();
            if (fullReload) setLoadingProgress(85);
    
            if (newData) {
                setData(newData);
                const lastAckId = localStorage.getItem('lastAcknowledgedAnnouncementId');
                const latest = newData.announcements[0];
                if (latest && latest.id !== lastAckId) {
                    setLatestAnnouncement(latest);
                    setIsViewAnnouncementModalOpen(true);
                }
            }
        } catch (e: any) {
            console.error("Error loading data:", e);
            setError(e.message || "Failed to load CRM data.");
        } finally {
            if (fullReload) {
                setLoadingProgress(100);
                setTimeout(() => setIsLoading(false), 500);
            } else {
                setIsBackgroundSyncing(false);
            }
        }
    }, [account, fetchData]);

    const addBackgroundTask = useCallback((message: string): string => {
        const id = Date.now().toString() + Math.random();
        setBackgroundTasks(prev => [...prev, { id, message, status: 'pending' }]);
        return id;
    }, []);

    const updateBackgroundTask = useCallback((id: string, status: 'success' | 'error' | 'info', message?: string) => {
        setBackgroundTasks(prev => prev.map(task => 
            task.id === id ? { ...task, status, message: message || task.message } : task
        ));
    }, []);

    // Initial load
    useEffect(() => {
        if (account && !data && isLoading && msalReady) {
            loadData(true);
            getUserProfile(msalInstance, account).then(p => {
                const cachedProfile = localStorage.getItem(`userProfile_${account.username}`);
                if (cachedProfile) {
                    setUserProfile(JSON.parse(cachedProfile));
                }
            });
             const cachedReport = localStorage.getItem('coachReport');
            if (cachedReport) {
                try {
                    setCoachReport(JSON.parse(cachedReport));
                } catch(e) { console.error("Failed to parse cached coach report", e); }
            }
        }
    }, [account, msalReady, data, isLoading, loadData]);
    
    // Setup currentUser
    useEffect(() => {
        if (account) {
            setCurrentUser({
                firstName: account.name?.split(' ')[0] || 'User',
                lastName: account.name?.split(' ').slice(1).join(' ') || '',
                email: account.username,
                name: account.name || 'User',
            });
        }
    }, [account]);

    const currentUserData = useMemo(() => {
        if (!data || !currentUser) {
            return null;
        }
    
        if (isSuperAdmin || isJayNortonAdminView || isJoshColeAdminView) {
            return data;
        }
    
        const managerNameLower = currentUser.name.toLowerCase();
    
        const userSchools = data.schools.filter(s => s.accountManager.toLowerCase() === managerNameLower);
        const userSchoolNames = new Set(userSchools.map(s => s.name.toLowerCase()));
    
        return {
            ...data,
            schools: userSchools,
            tasks: data.tasks.filter(t => t.accountManager.toLowerCase() === managerNameLower),
            notes: data.notes.filter(n => n.accountManager.toLowerCase() === managerNameLower),
            callLogs: data.callLogs.filter(c => c.accountManager.toLowerCase() === managerNameLower),
            emails: data.emails.filter(e => e.accountManager.toLowerCase() === managerNameLower),
            opportunities: data.opportunities.filter(o => o.accountManager.toLowerCase() === managerNameLower),
            bookings: data.bookings.filter(b => b.accountManager.toLowerCase() === managerNameLower),
            jobAlerts: data.jobAlerts.filter(j => userSchoolNames.has(j.schoolName.toLowerCase())),
        };
    }, [data, currentUser, isSuperAdmin, isJayNortonAdminView, isJoshColeAdminView]);

    const handleUpdateSchool = async (updatedSchool: School) => {
        if (!account) return;
        const taskId = addBackgroundTask(`Updating ${updatedSchool.name}...`);
        try {
             await updateSchool(msalInstance, account, worksheetMap.schools, updatedSchool.excelRowIndex, [
                updatedSchool.name, updatedSchool.location, updatedSchool.contactNumber, updatedSchool.accountManager,
                updatedSchool.coverManager, updatedSchool.email, updatedSchool.contact2, updatedSchool.contact2Email,
                updatedSchool.spokeToCoverManager, updatedSchool.emailName, updatedSchool.switchboard, updatedSchool.engagementScore, updatedSchool.website,
                updatedSchool.status
            ]);
            updateBackgroundTask(taskId, 'success', `Successfully updated ${updatedSchool.name}.`);
            
            setIsBackgroundSyncing(true);
            const newData = await fetchData();
            if (newData) {
                const freshSchool = newData.schools.find(s => s.excelRowIndex === updatedSchool.excelRowIndex);
                setData(newData);
                setSelectedSchool(freshSchool || null);
            }
            setIsBackgroundSyncing(false);
        } catch (e: any) {
            updateBackgroundTask(taskId, 'error', `Failed to update ${updatedSchool.name}.`);
            alert(`Failed to update school: ${e.message}`);
            setIsBackgroundSyncing(false);
        }
    };

    const handleUpdateContactDetails = async (school: School) => {
        if (!account) return;
        const taskId = addBackgroundTask(`AI is searching for contact details for ${school.name}...`);
        const prompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

        Find current contact information for the school named "${school.name}" which is located in or around "${school.location}". Prioritize official school websites.

        JSON schema:
        {
          "website": "string",
          "contactNumber": "string",
          "email": "string",
          "deputyHead": "string",
          "deputyHeadEmail": "string"
        }

        Return values as strings; use empty strings when data is missing.

        Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

        try {
            const defaults = {
                website: '',
                contactNumber: '',
                email: '',
                deputyHead: '',
                deputyHeadEmail: ''
            };

            const { data: extracted, error, rawText } =
                await callUnifiedAI<{
                    website?: string;
                    contactNumber?: string;
                    email?: string;
                    deputyHead?: string;
                    deputyHeadEmail?: string;
                }>({
                    mode: "Utility",
                    prompt,
                    fallback: defaults
                });

            const requiredFields = ['website', 'contactNumber', 'email', 'deputyHead', 'deputyHeadEmail'];
            const missingFields = requiredFields.filter(field => {
                const value = (extracted as any)?.[field];
                return value === undefined || value === null;
            });

            const check = analyseAiResponse(rawText, extracted, requiredFields, defaults, prompt);

            logAIDebugEvent({
                id: crypto.randomUUID(),
                toolName: 'ContactDetailsFinder',
                timestamp: Date.now(),
                prompt,
                model: "models/gemini-pro",
                requestPayload: { prompt, responseMimeType: 'application/json' },
                rawResponse: rawText,
                cleanedText: rawText || '',
                parsedJson: extracted,
                missingFields,
                error: error || null,
                errorStack: null,
                location: 'App.tsx:handleUpdateContactDetails'
            });

            if (!check.ok) {
                console.error("AI DEBUG:", check.debug);
                updateBackgroundTask(
                    taskId,
                    'error',
                    check.debug.errorMessage || 'AI response missing required fields.'
                );
                alert('AI Error: ' + check.debug.errorMessage);
                openDebug(check.debug);
                return;
            }

            if (error) {
                console.debug('Contact update raw AI response:', rawText);
                alert('AI Error: ' + error);
            }

            let updatedSchool = { ...school };
            const changes: string[] = [];

            if (check.data.website) {
                updatedSchool.website = check.data.website;
                changes.push('Website');
            }
            if (check.data.contactNumber) {
                updatedSchool.contactNumber = check.data.contactNumber;
                changes.push('Phone');
            }
            if (check.data.email) {
                updatedSchool.email = check.data.email;
                changes.push('Email');
            }
            if (check.data.deputyHead) {
                updatedSchool.contact2 = check.data.deputyHead;
                changes.push('Contact 2 (Deputy Head)');
            }
            if (check.data.deputyHeadEmail) {
                updatedSchool.contact2Email = check.data.deputyHeadEmail;
                changes.push('Contact 2 Email');
            }
    
            if (changes.length > 0) {
                await handleUpdateSchool(updatedSchool);
                updateBackgroundTask(taskId, 'success', `Updated: ${changes.join(', ')}`);
            } else {
                updateBackgroundTask(taskId, 'info', 'No new contact details found to update.');
            }
        } catch (e: any) {
            console.error("Failed to update contacts via AI", e);
            logAIDebugEvent({
                id: crypto.randomUUID(),
                toolName: 'ContactDetailsFinder',
                timestamp: Date.now(),
                prompt,
                model: 'models/gemini-pro',
                requestPayload: { prompt, responseMimeType: 'application/json' },
                rawResponse: null,
                cleanedText: '',
                parsedJson: null,
                missingFields: ['website', 'contactNumber', 'email', 'deputyHead', 'deputyHeadEmail'],
                error: e?.message || 'Unknown error',
                errorStack: e?.stack ?? null,
                location: 'App.tsx:handleUpdateContactDetails'
            });
            alert("AI Error: " + (e?.message || 'Could not fetch contact details.'));
            updateBackgroundTask(taskId, 'error', 'AI failed to find contact details.');
        }
    };

    const findAndSyncJobs = async (school: School) => {
         if (!account) return;
         const taskId = addBackgroundTask(`Scanning jobs for ${school.name}...`);
         setTimeout(() => updateBackgroundTask(taskId, 'info', 'Job scan simulated for single school.'), 2000);
    };

    const handleUpdateJobs = async (school: School) => {
        await findAndSyncJobs(school);
    };

    const handleSaveCustomDialerList = (listData: Omit<CustomDialerList, 'id'>) => {
        if (!currentUser) return;
        try {
            const storageKey = `customDialerLists_${currentUser.email}`;
            const savedLists: CustomDialerList[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const newList: CustomDialerList = { ...listData, id: Date.now() };
            
            const existingIndex = savedLists.findIndex(l => l.name.toLowerCase() === newList.name.toLowerCase());
            if (existingIndex > -1) {
                if(window.confirm(`A list named "${newList.name}" already exists. Overwrite it?`)) {
                    savedLists[existingIndex] = { ...savedLists[existingIndex], ...newList, id: savedLists[existingIndex].id };
                } else {
                    return;
                }
            } else {
                savedLists.push(newList);
            }
            localStorage.setItem(storageKey, JSON.stringify(savedLists));
            alert("List saved successfully to Dialer.");
        } catch (e) {
            console.error("Failed to save list:", e);
            alert("Failed to save list.");
        }
    };

    const handleUpdateTaskFromDashboard = (taskToUpdate: Task) => {
        if (!account || !data) return;
    
        const backgroundTaskId = addBackgroundTask(`Updating task due date for ${taskToUpdate.schoolName}...`);
    
        const updateOperation = async () => {
            const dateCreatedAsDate = parseUKDateTimeString(taskToUpdate.dateCreated);
            const dateCreatedSerial = dateCreatedAsDate ? getExcelSerialDate(dateCreatedAsDate) : '';
            const dueDateAsDate = parseUKDate(taskToUpdate.dueDate);
            const dueDateSerial = dueDateAsDate ? getExcelSerialDate(dueDateAsDate) : '';
            await updateTask(msalInstance, account, worksheetMap.tasks, taskToUpdate.excelRowIndex, [
                taskToUpdate.schoolName, taskToUpdate.type, taskToUpdate.phoneNumber, taskToUpdate.accountManager,
                taskToUpdate.coverManager, taskToUpdate.coverManagerEmail, taskToUpdate.contact2, taskToUpdate.contact2Email,
                dateCreatedSerial, taskToUpdate.taskDescription, dueDateSerial, '', taskToUpdate.dueTime, taskToUpdate.isCompleted
            ]);
            await loadData(false);
        };
    
        updateOperation()
            .then(() => {
                updateBackgroundTask(backgroundTaskId, 'success', 'Task due date updated.');
            })
            .catch((err: any) => {
                console.error("Failed to update task from dashboard:", err);
                updateBackgroundTask(backgroundTaskId, 'error', `Failed to update task: ${err.message}`);
            });
    };

    const handleSelectSchool = (school: School) => {
        setSelectedSchool(school);
        setRecentlyViewedSchools(prev => {
            const filtered = prev.filter(s => s.name !== school.name);
            return [school, ...filtered].slice(0, 5);
        });
        setActiveView('School Profile');
    };

    const handleSelectCandidate = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setActiveView('Candidate Profile');
    };

    const handleBack = () => {
        if (viewHistory.length > 1) {
            const newHistory = [...viewHistory];
            newHistory.pop();
            const prevView = newHistory[newHistory.length - 1];
            setViewHistory(newHistory);
            _setActiveView(prevView);
            activeViewRef.current = prevView;
        } else {
            setActiveView('Dashboard');
        }
    };
    
    const handleGlobalSearchChange = (query: string) => {
        setGlobalSearchQuery(query);
        if (query.trim().length > 1 && currentUserData) {
            const lowerQuery = query.toLowerCase();
            const results: SearchResult[] = [];
            const addedIds = new Set<string>(); // To prevent duplicates

            // Helper to add a result if it hasn't been added yet
            const addResult = (result: SearchResult) => {
                const id = `${result.type}-${(result.data as any).excelRowIndex || (result.data as any).id}`;
                if (!addedIds.has(id)) {
                    results.push(result);
                    addedIds.add(id);
                }
            };

            // Search Schools for names, contacts, emails
            currentUserData.schools.forEach(s => {
                if (
                    s.name.toLowerCase().includes(lowerQuery) ||
                    (s.coverManager && s.coverManager.toLowerCase().includes(lowerQuery)) ||
                    (s.contact2 && s.contact2.toLowerCase().includes(lowerQuery)) ||
                    (s.email && s.email.toLowerCase().includes(lowerQuery)) ||
                    (s.contact2Email && s.contact2Email.toLowerCase().includes(lowerQuery)) ||
                    (s.emailName && s.emailName.toLowerCase().includes(lowerQuery))
                ) {
                    addResult({ type: 'school', data: s });
                }
            });

            // Search Candidates for names, emails, phones
            currentUserData.candidates.forEach(c => {
                if (
                    c.name.toLowerCase().includes(lowerQuery) ||
                    (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
                    (c.phone && c.phone.includes(lowerQuery)) // .includes for phone numbers
                ) {
                    addResult({ type: 'candidate', data: c });
                }
            });

            // Search Tasks for descriptions
            currentUserData.tasks.forEach(t => {
                if (t.taskDescription.toLowerCase().includes(lowerQuery)) {
                    addResult({ type: 'task', data: t });
                }
            });

            // Search Notes for content
            currentUserData.notes.forEach(n => {
                if (n.note.toLowerCase().includes(lowerQuery)) {
                    addResult({ type: 'note', data: n });
                }
            });

            // Search Call Logs for notes and contacts
            currentUserData.callLogs.forEach(c => {
                if (
                    (c.notes && c.notes.toLowerCase().includes(lowerQuery)) ||
                    (c.contactCalled && c.contactCalled.toLowerCase().includes(lowerQuery))
                ) {
                    addResult({ type: 'call', data: c });
                }
            });

            // Search Opportunities for names (descriptions)
            currentUserData.opportunities.forEach(o => {
                if (o.name.toLowerCase().includes(lowerQuery)) {
                    addResult({ type: 'opportunity', data: o });
                }
            });
            
            // Search Job Alerts for titles and subjects
            currentUserData.jobAlerts.forEach(j => {
                if (
                    j.jobTitle.toLowerCase().includes(lowerQuery) ||
                    (j.subject && j.subject.toLowerCase().includes(lowerQuery))
                ) {
                    addResult({ type: 'job', data: j });
                }
            });
            
            setSearchResults(results.slice(0, 15)); // Increased limit slightly
            setIsSearchResultsVisible(true);
        } else {
            setSearchResults([]);
            setIsSearchResultsVisible(false);
        }
    };

    const handleResultClick = (result: SearchResult) => {
        setIsSearchResultsVisible(false);
        setGlobalSearchQuery('');
        
        if (result.type === 'school') {
            handleSelectSchool(result.data);
        } else if (result.type === 'candidate') {
            handleSelectCandidate(result.data);
        } else if (result.type === 'opportunity') {
            setSelectedOpportunity(result.data);
            setActiveView('Opportunity Detail');
        } else if (result.type === 'task' || result.type === 'note' || result.type === 'call' || result.type === 'job') {
            const schoolName = (result.data as any).schoolName;
            if (schoolName && currentUserData) {
                const school = currentUserData.schools.find(s => s.name === schoolName);
                if (school) {
                    handleSelectSchool(school);
                }
            }
        }
    };
    
    const handleSearchResultsBlur = () => {
        setTimeout(() => setIsSearchResultsVisible(false), 200);
    };

    // --- Background Transcription Logic ---
    const stopTranscription = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsTranscribing(false);
    }, []);

    const startTranscription = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (recognitionRef.current) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB';

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscription(finalTranscript + interimTranscript);
        };

        recognition.onend = () => {
            if (recognitionRef.current) {
                recognition.start();
            }
        };
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            stopTranscription();
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
    }, [stopTranscription]);

    const handleStartCall = (school: School) => {
        setActiveCall({ school, startTime: new Date() });
        setElapsedTime(0);
        setActiveView('Dialer');
        setTranscription('');
        startTranscription();
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const handleEndAndLogCall = () => {
        stopTranscription();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (activeCall) {
            setSchoolForAction(activeCall.school);
            setCallLogInitialData({
                duration: formatTime(elapsedTime),
                notes: activeCallNotes,
                transcript: transcription
            });
            setIsAddCallLogModalOpen(true);
            setActiveCall(null);
            setActiveCallNotes('');
        }
    };

    const handleCloseLogCallModal = () => {
        setIsAddCallLogModalOpen(false);
        const prevView = viewHistory[viewHistory.length - 2] || 'Dashboard';
        setActiveView(prevView);
    };
    
    const generateAndStoreCoachReport = useCallback(async () => {
        const crmDataForReport = dataRef.current;
        if (!crmDataForReport) {
            addBackgroundTask('Skipping AI Coach report: No CRM data available.');
            return;
        }
        const taskId = addBackgroundTask('Generating new AI Coach report...');
        try {
            const dataSummary = {
                tasks: crmDataForReport.tasks.slice(0, 100).map(t => ({ desc: t.taskDescription, due: t.dueDate, completed: t.isCompleted })),
                calls: crmDataForReport.callLogs.slice(0, 50).map(c => ({ notes: c.notes, date: c.dateCalled })),
                emails: crmDataForReport.emails.slice(0, 50).map(e => ({ subject: e.subject, date: e.date, direction: e.direction })),
            };
            const fullPrompt = coachPrompt.replace('{{CRM_DATASET}}', JSON.stringify(dataSummary));
            const defaultReport = { kpis: {}, keyInsights: [], strengths: [], weaknesses: [], recommendedActions: [] };
            const { data: report, error, rawText } = await callUnifiedAI<any>({
                mode: "Coach",
                prompt: fullPrompt,
                fallback: defaultReport
            });
            const requiredFields = ['kpis', 'keyInsights', 'strengths', 'weaknesses', 'recommendedActions'];
            const check = analyseAiResponse(rawText, report, requiredFields, defaultReport, fullPrompt);
            if (!check.ok) {
                console.error("AI DEBUG:", check.debug);
                updateBackgroundTask(taskId, 'error', check.debug.errorMessage || 'AI response missing required fields.');
                alert('AI Error: ' + check.debug.errorMessage);
                openDebug(check.debug);
                return;
            }
            if (error) {
                console.debug('Coach report raw AI response:', rawText);
                alert('AI Error: ' + error);
            }
            setCoachReport(check.data);
            localStorage.setItem('coachReport', JSON.stringify(check.data));
            localStorage.setItem('coachReportTimestamp', new Date().toISOString());
            updateBackgroundTask(taskId, 'success', 'AI Coach report updated.');
        } catch (e) {
            console.error("Coach report generation failed:", e);
            alert('AI Error: ' + (e instanceof Error ? e.message : 'Unable to generate coach report.'));
            updateBackgroundTask(taskId, 'error', 'AI Coach report failed.');
        }
    }, [addBackgroundTask, updateBackgroundTask]);

    const handleSaveCallLogFromModal = (logData: any) => {
        const taskId = addBackgroundTask(`Logging call for ${schoolForAction?.name}...`);
        
        const save = async () => {
            if (!account || !schoolForAction) throw new Error("Missing user or school context.");

            const dateCalledAsDate = parseUKDateTimeString(logData.dateCalled);
            const dateCalledForExcel = dateCalledAsDate ? formatDateTimeUS_Excel(dateCalledAsDate) : logData.dateCalled;
             
            if (logData.callLogToUpdateId) {
                await updateCallLog(msalInstance, account, worksheetMap.callLogs, logData.callLogToUpdateId, [
                    schoolForAction.name, schoolForAction.location, schoolForAction.contactNumber, currentUser?.name || '',
                    logData.contactCalled, dateCalledForExcel, logData.spokeToCoverManager, logData.duration, logData.manualNotes, logData.transcript
                ]);
            } else {
                await addCallLog(msalInstance, account, worksheetMap.callLogs, [
                    schoolForAction.name, schoolForAction.location, schoolForAction.contactNumber, currentUser?.name || '',
                    logData.contactCalled, dateCalledForExcel, logData.spokeToCoverManager, logData.duration, logData.manualNotes, logData.transcript
                ]);
            }
             
            for (const task of logData.tasks) {
                await addTask(msalInstance, account, worksheetMap.tasks, [
                    schoolForAction.name, 'Follow-up', schoolForAction.contactNumber, currentUser?.name || '',
                    logData.contactCalled, '', '', '', getExcelSerialDate(new Date()), task.description, 
                    task.dueDate ? getExcelSerialDate(parseUKDate(task.dueDate)!) : '', '', task.dueTime, false
                ]);
            }
        };

        save()
            .then(async () => {
                updateBackgroundTask(taskId, 'success', 'Call logged successfully.');
                await loadData(false); // Reload data to get the latest state
                const callCount = parseInt(localStorage.getItem('callsSinceCoachReport') || '0', 10) + 1;
                if (callCount >= 5) {
                    await generateAndStoreCoachReport(); // Now this function has the latest data
                    localStorage.setItem('callsSinceCoachReport', '0');
                } else {
                    localStorage.setItem('callsSinceCoachReport', String(callCount));
                }
            })
            .catch(e => {
                console.error(e);
                updateBackgroundTask(taskId, 'error', `Failed to log call: ${e.message}`);
            });
            
        handleCloseLogCallModal();
    };

    const handleToggleTaskStatus = async (task: Task) => {
        if (!account) return;
        await updateTask(msalInstance, account, worksheetMap.tasks, task.excelRowIndex, [
            task.schoolName, task.type, task.phoneNumber, task.accountManager, task.coverManager, task.coverManagerEmail,
            task.contact2, task.contact2Email, getExcelSerialDate(parseUKDateTimeString(task.dateCreated)!), task.taskDescription,
            task.dueDate ? getExcelSerialDate(parseUKDate(task.dueDate)!) : '', '', task.dueTime, !task.isCompleted
        ]);
        await loadData(false);
    };

    const handleOpenAddTaskModal = (task?: Partial<Task>, school?: School) => {
        setTaskToEdit(task || null);
        setSchoolForAction(school || (task && data?.schools.find(s => s.name === task.schoolName)) || selectedSchool || null);
        setIsAddTaskModalOpen(true);
    };
    
    const handleSaveTask = (taskData: Partial<Task>) => {
        if (!account || !taskData.schoolName) return;
    
        const isEdit = taskToEdit && taskToEdit.excelRowIndex;
        const taskMessage = isEdit ? `Updating task for ${taskData.schoolName}...` : `Adding task for ${taskData.schoolName}...`;
        const backgroundTaskId = addBackgroundTask(taskMessage);
    
        const saveOperation = async () => {
            const school = data?.schools.find(s => s.name === taskData.schoolName);
            if (isEdit) {
                await updateTask(msalInstance, account!, worksheetMap.tasks, taskToEdit.excelRowIndex!, [
                    taskData.schoolName, taskData.type, school?.contactNumber, currentUser?.name,
                    school?.coverManager, school?.email, school?.contact2, school?.contact2Email,
                    getExcelSerialDate(parseUKDateTimeString(taskToEdit.dateCreated!)!), taskData.taskDescription,
                    taskData.dueDate ? getExcelSerialDate(parseUKDate(taskData.dueDate)!) : '', '', taskData.dueTime, taskToEdit.isCompleted
                ]);
            } else {
                await addTask(msalInstance, account!, worksheetMap.tasks, [
                    taskData.schoolName, taskData.type, school?.contactNumber, currentUser?.name,
                    school?.coverManager, school?.email, school?.contact2, school?.contact2Email,
                    getExcelSerialDate(new Date()), taskData.taskDescription,
                    taskData.dueDate ? getExcelSerialDate(parseUKDate(taskData.dueDate)!) : '', '', taskData.dueTime, false
                ]);
            }
            await loadData(false);
        };
    
        saveOperation()
            .then(() => {
                updateBackgroundTask(backgroundTaskId, 'success', isEdit ? 'Task updated.' : 'Task added.');
            })
            .catch((e: any) => {
                console.error(e);
                updateBackgroundTask(backgroundTaskId, 'error', `Failed to save task: ${e.message}`);
            });
    };

    const handleOpenAddNoteModal = (school?: School, note?: Note) => {
        setNoteToEdit(note || null);
        setSchoolForAction(school || (note && data?.schools.find(s => s.name === note.schoolName)) || selectedSchool || null);
        setIsAddNoteModalOpen(true);
    };
    
    const handleSaveNote = async (noteData: {note: string, schoolName?: string}) => {
         if (!account) return;
         const sName = noteData.schoolName || schoolForAction?.name;
         if (!sName) return;
         const school = data?.schools.find(s => s.name === sName);

         try {
             if (noteToEdit) {
                 await updateNote(msalInstance, account, worksheetMap.notes, noteToEdit.excelRowIndex, [
                     sName, currentUser?.name, school?.coverManager, school?.contact2, getExcelSerialDate(parseUKDateTimeString(noteToEdit.date)!), noteData.note
                 ]);
             } else {
                 await addNote(msalInstance, account, worksheetMap.notes, [
                     sName, currentUser?.name, school?.coverManager, school?.contact2, getExcelSerialDate(new Date()), noteData.note
                 ]);
             }
             await loadData(false);
         } catch (e: any) {
             console.error(e);
             throw e;
         }
    };

    const handleOpenSendEmailModal = (school: School) => {
        setSchoolForAction(school);
        setIsSendEmailModalOpen(true);
    };

    const onUpdateCallLog = async (log: CallLog) => {
         if (!account) return;
         await updateCallLog(msalInstance, account, worksheetMap.callLogs, log.excelRowIndex, [
             log.schoolName, log.location, log.phoneNumber, log.accountManager, log.contactCalled,
             getExcelSerialDate(parseUKDateTimeString(log.dateCalled)!), log.spokeToCoverManager, log.duration, log.notes, log.transcript
         ]);
         await loadData(false);
    };

    const handleOpenUploadTranscriptForSchool = (school: School) => {
         setSchoolForAction(school);
         setCallLogInitialData({});
         setIsAddCallLogModalOpen(true);
    };
    
    const handleGenerateAiNotes = async (callLog: CallLog) => {
        if (!callLog.transcript) return;

        setIsGeneratingForTranscript(callLog.excelRowIndex);
        setCallLogForAi(callLog);

        const prompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

        You are an intelligent assistant for a school recruitment agency called "EdU Talent Connect". The user you are assisting is named "${currentUser?.name}".
        Based on the following call transcript with ${callLog.schoolName}, generate the structured response.

        JSON schema:
        {
          "notes": "string",
          "tasks": [
            {
              "description": "string",
              "dueDate": "DD/MM/YYYY or empty string",
              "dueTime": "HH:MM or empty string"
            }
          ],
          "email": {
            "subject": "string",
            "body": "HTML string"
          }
        }

        Use smart tags like {{contact_name}} and {{account_manager_name}} in the email. The email should be signed off by "${currentUser?.name}" from "EdU Talent Connect".
        If any value is missing, return an empty string or empty array as appropriate.

        Transcript:
        "${callLog.transcript}"

        Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;

        try {
            const defaults = { notes: "", tasks: [], email: {} };
            const { data: parsed, rawText, error } = await callUnifiedAI<any>({
                mode: "Transcriber",
                prompt,
                fallback: defaults
            });

            const requiredFields = ['notes', 'tasks', 'email'];
            const check = analyseAiResponse(rawText, parsed, requiredFields, defaults, prompt);
            if (!check.ok) {
                console.error("AI DEBUG:", check.debug);
                alert('AI Error: ' + check.debug.errorMessage);
                openDebug(check.debug);
                return;
            }

            if (error) {
                console.debug("AI RAW:", rawText);
            }

            const notes = typeof check.data.notes === 'string' ? check.data.notes : '';
            const tasks = Array.isArray(check.data.tasks) ? check.data.tasks : null;
            const email = check.data.email ?? null;

            if (!notes.trim() || !tasks || !email || typeof email !== 'object') {
                throw new Error("Gemini response was missing required fields.");
            }

            setAiGeneratedNotes(notes);
            setSuggestedTasks(tasks.map((t: any, i: number) => ({ id: `ai_task_${Date.now()}_${i}`, ...t })));
            setAiGeneratedEmail(email);
            setIsTaskSuggestionModalOpen(true);

        } catch (e) {
            console.error("AI notes generation failed:", e);
            alert("AI Error: " + (e instanceof Error ? e.message : "Failed to generate AI suggestions from the transcript."));
        } finally {
            setIsGeneratingForTranscript(null);
        }
    };

    const handleSaveAiNotes = (editedNotes: string) => {
        if (!callLogForAi) return;

        // Immediately close the suggestion modal and show the confirmation
        setIsTaskSuggestionModalOpen(false);
        setIsAiNotesReadyModalOpen(true);

        const callLogToUpdate = { ...callLogForAi }; // Create a stable copy for the async operation
        const taskId = addBackgroundTask(`Saving AI notes for ${callLogToUpdate.schoolName}...`);

        // Define the async save operation
        const saveOperation = async () => {
            const updatedLog = { ...callLogToUpdate, notes: `(AI-Generated) ${editedNotes}` };
            await onUpdateCallLog(updatedLog);
        };

        // Run the operation in the background and update the task status
        saveOperation()
            .then(() => {
                updateBackgroundTask(taskId, 'success', 'AI notes saved.');
            })
            .catch((e) => {
                console.error("Failed to save AI notes in background:", e);
                updateBackgroundTask(taskId, 'error', 'Failed to save AI notes.');
            });
        
        // Clear the state related to the just-processed call log
        setCallLogForAi(null);
    };

    const handleAcceptAiTask = (task: SuggestedTask) => {
        if (!callLogForAi || !currentUserData) return;
        const school = currentUserData.schools.find(s => s.name === callLogForAi.schoolName);
        if (!school) return;

        const taskData: Partial<Task> = {
            taskDescription: task.description,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            type: 'Follow-up'
        };
        handleOpenAddTaskModal(taskData, school);
    };
    
    const handleDeclineAiTask = (taskId: string) => {
        setSuggestedTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleSendAiEmail = async (subject: string, body: string): Promise<boolean> => {
        if (!callLogForAi || !account || !currentUserData) return false;
        const school = currentUserData.schools.find(s => s.name === callLogForAi.schoolName);
        if (!school || !school.email) {
            alert(`No email address found for ${school?.name}.`);
            return false;
        }

        try {
            const taskId = addBackgroundTask(`Sending AI-drafted email to ${school.name}...`);
            await sendEmail(msalInstance, account, school.email, subject, body, []);
            await addEmail(msalInstance, account!, worksheetMap.emails, [school.name, currentUser!.name, school.coverManager, getExcelSerialDate(new Date()), subject, body]);
            await loadData(false);
            updateBackgroundTask(taskId, 'success', 'Email sent successfully.');
            return true;
        } catch (e) {
            console.error("Failed to send AI email:", e);
            alert("Failed to send email.");
            return false;
        }
    };
    
    const handleSendCoachMessage = async (message: string) => {
        setIsCoachResponding(true);
        const newHistory = [...coachChatHistory, { role: 'user' as const, parts: [{ text: message }] }];
        setCoachChatHistory(newHistory);

        try {
             const context = JSON.stringify(coachReport || {});
             const systemInstruction = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.`;
             const historyText = newHistory
                 .map(entry => `${entry.role === 'user' ? 'User' : 'Coach'}: ${entry.parts[0].text}`)
                 .join('\n');
            const prompt = `${systemInstruction}\n\nYou are an AI sales coach for a recruiter. Your goal is to help them improve performance based on their KPI report: ${context}. Be encouraging but direct. Respond to the latest user message as structured JSON.\n\nJSON schema:\n{\n  "message": "string"\n}\n\nConversation so far:\n${historyText}\n\nYour entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;
            const { rawText, error } = await generateGeminiText(prompt);
            setCoachChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: rawText || "I'm still thinking..." }] }]);
            if (error) {
                console.debug('Coach chat raw AI response:', rawText);
                alert('AI Error: ' + error);
            }

        } catch (e) {
            console.error("Coach chat error:", e);
            alert('AI Error: ' + (e instanceof Error ? e.message : 'Unable to contact coach AI.'));
            setCoachChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: "I'm having trouble connecting right now. Please try again later." }] }]);
        } finally {
            setIsCoachResponding(false);
        }
    };

    const handleAddNewJobAlert = async (job: Omit<JobAlert, 'excelRowIndex'>) => {
         if (!account) return;
         await addJobAlert(msalInstance, account!, worksheetMap.jobAlerts, [
             job.schoolId, job.schoolName, job.jobTitle, job.subject, job.salary, job.closeDate, job.location, job.jobDescription, job.sourceUrl
         ]);
         await loadData(false);
    };
    
    const startJobSearch = async () => {
        if (isJobSearching || !currentUserData) return;
    
        setIsJobSearching(true);
        setJobSearchLog([]);
        setJobSearchSummary({ found: 0, duplicates: 0, added: 0, schoolsChecked: 0 });
        stopJobSearchRef.current = false;
    
        const addLog = (message: string) => setJobSearchLog(prev => [...prev, message]);
    
        addLog("Starting job search...");
    
        const schoolsToSearch = currentUserData.schools || [];
        const existingJobs = currentUserData.jobAlerts || [];
    
        for (let i = 0; i < schoolsToSearch.length; i++) {
            if (stopJobSearchRef.current) {
                addLog("Job search stopped by user.");
                break;
            }
    
            const school = schoolsToSearch[i];
            addLog(`(${i + 1}/${schoolsToSearch.length}) Searching: ${school.name}, ${school.location}...`);
            setJobSearchSummary(prev => ({ ...prev!, schoolsChecked: i + 1 }));
    
            try {
                const prompt = `Return ONLY a single JSON object. Do not include explanations, markdown, code fences or commentary. Output must be valid JSON only.

                    Find current job vacancies for the school named "${school.name}" located in or around "${school.location}".
                    Search their official website if available (${school.website || 'not provided'}), or search for jobs from that school online.

                    JSON schema:
                    {
                      "jobs": [
                        {
                          "jobTitle": "string",
                          "subject": "string",
                          "salary": "string",
                          "closeDate": "DD/MM/YYYY or empty string",
                          "jobDescription": "string",
                          "sourceUrl": "string"
                        }
                      ]
                    }

                    If no jobs are found, return an empty "jobs" array and use empty strings for missing fields.

                    Your entire response MUST be ONLY a valid JSON object that matches the schema. No prose. No markdown. No prefixes. No suffixes.`;
                
                const defaults = { jobs: [] };
                const { data: parsedResult, error, rawText } =
                    await callUnifiedAI<{ jobs: any[] }>({
                        mode: "Alerts",
                        prompt,
                        fallback: defaults
                    });
                const requiredFields: string[] = [];
                const check = analyseAiResponse(rawText, parsedResult, requiredFields, defaults, prompt);
                if (!check.ok) {
                    console.error("AI DEBUG:", check.debug);
                    addLog('-> AI response was missing required fields.');
                    alert('AI Error: ' + check.debug.errorMessage);
                    openDebug(check.debug);
                    setIsJobSearching(false);
                    return;
                }
                if (error) {
                    console.debug('Job search raw AI response:', rawText);
                    addLog('-> AI response was unclear; using best effort to parse jobs.');
                    alert('AI Error: ' + error);
                }

                if (check.data.jobs && check.data.jobs.length > 0) {
                    addLog(`Found ${check.data.jobs.length} potential jobs for ${school.name}.`);
                    setJobSearchSummary(prev => ({ ...prev!, found: prev!.found + check.data.jobs.length }));

                    for (const job of check.data.jobs) {
                        const isDuplicate = existingJobs.some(existing =>
                            existing.schoolName.toLowerCase() === school.name.toLowerCase() &&
                            existing.jobTitle.toLowerCase() === job.jobTitle.toLowerCase()
                        );
    
                        if (isDuplicate) {
                            addLog(`-> Duplicate found: "${job.jobTitle}". Skipping.`);
                            setJobSearchSummary(prev => ({ ...prev!, duplicates: prev!.duplicates + 1 }));
                        } else {
                            const newJobAlert: Omit<JobAlert, 'excelRowIndex'> = {
                                schoolId: String(school.excelRowIndex),
                                schoolName: school.name,
                                jobTitle: job.jobTitle || 'N/A',
                                subject: job.subject || 'N/A',
                                salary: job.salary || 'N/A',
                                closeDate: job.closeDate || '',
                                location: school.location,
                                jobDescription: job.jobDescription || '',
                                notes: '',
                                sourceUrl: job.sourceUrl || '',
                            };
                            await handleAddNewJobAlert(newJobAlert);
                            addLog(`-> ADDED: "${job.jobTitle}"`);
                            setJobSearchSummary(prev => ({ ...prev!, added: prev!.added + 1 }));
                        }
                    }
                } else {
                    addLog(`-> No new jobs found for ${school.name}.`);
                }
    
            } catch (e) {
                console.error(`Error processing ${school.name}:`, e);
                alert('AI Error: ' + (e instanceof Error ? e.message : 'Unable to search for jobs.'));
                addLog(`-> Error searching for ${school.name}. Skipping.`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        addLog("Job search complete.");
        localStorage.setItem('jobAlertsLastRun', new Date().toISOString());
        setIsJobSearching(false);
    };

    const stopJobSearch = () => { stopJobSearchRef.current = true; setIsJobSearching(false); };
    const handlePruneJobAlerts = async () => {};

    const generateAndStoreSalesStrategistReport = async () => {
         console.log("Generating strategy...");
    };
    const generateAndStoreStrategicPlannerReport = async () => {
         console.log("Generating plan...");
    };

    if (!account) return <Login onLogin={handleLogin} error={error} isLoading={!msalReady || isLoggingIn} />;

    if (isLoading || !currentUserData) {
        if (loadingProgress > 0) return <PostLoginLoading progress={loadingProgress} />;
        return <Loading />;
    }

    return (
        <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
             {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}></div>
                    <div className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0">
                        <Sidebar 
                            activeView={activeView} 
                            setActiveView={setActiveView} 
                            isOpen={isMobileSidebarOpen} 
                            setIsOpen={setIsMobileSidebarOpen}
                            isSuperAdmin={isSuperAdmin}
                            onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
                        />
                    </div>
                </div>
             )}

            <div className="hidden md:block flex-shrink-0">
                <Sidebar 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    isOpen={true} 
                    setIsOpen={() => {}}
                    isSuperAdmin={isSuperAdmin}
                    onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative" ref={mainContentRef}>
                 <Header 
                    activeView={activeView}
                    user={{ name: currentUser?.name || 'User', email: currentUser?.email || '', profilePicture: userProfile.profilePicture }}
                    userStatus={userStatus}
                    onLogout={() => { msalInstance.logoutPopup(); }}
                    onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                    onSync={() => loadData(false)}
                    onOpenAnnouncementModal={() => setIsCreateAnnouncementModalOpen(true)}
                    onOpenProfileModal={() => setIsProfileModalOpen(true)}
                    isSyncing={isBackgroundSyncing}
                    globalSearchQuery={globalSearchQuery}
                    onGlobalSearchChange={handleGlobalSearchChange}
                    searchResults={searchResults}
                    isSearchResultsVisible={isSearchResultsVisible}
                    onResultClick={handleResultClick}
                    onSearchResultsBlur={handleSearchResultsBlur}
                />

                <main className="flex-1 overflow-y-auto bg-slate-800 relative">
                    {error ? (
                        <div className="flex items-center justify-center h-full flex-col gap-4">
                            <p className="text-red-400 text-lg">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 rounded text-white hover:bg-slate-600">Reload</button>
                        </div>
                    ) : (
                        <>
                             {activeView === 'Dashboard' && (
                                <DashboardPage
                                    userName={currentUser?.firstName || 'User'}
                                    schools={currentUserData.schools}
                                    tasks={currentUserData.tasks}
                                    notes={currentUserData.notes}
                                    callLogs={currentUserData.callLogs}
                                    emails={currentUserData.emails}
                                    recentlyViewedSchools={recentlyViewedSchools}
                                    setActiveView={setActiveView}
                                    onSelectSchool={handleSelectSchool}
                                    onUpdateTask={handleUpdateTaskFromDashboard}
                                    coachReport={coachReport}
                                    coachChatHistory={coachChatHistory}
                                    onSendCoachMessage={handleSendCoachMessage}
                                    isCoachResponding={isCoachResponding}
                                />
                            )}
                            {activeView === 'Schools' && (
                               <SchoolsPage 
                                    schools={currentUserData.schools} 
                                    onAddSchool={(s) => {
                                        const taskId = addBackgroundTask(`Adding school: ${s.name}...`);
                                        const newRow = [s.name, s.location, s.contactNumber, currentUser!.name, s.coverManager, s.email, s.contact2, s.contact2Email, false, s.emailName, s.switchboard, '', '', ''];
                                        
                                        addSchool(msalInstance, account!, worksheetMap.schools, newRow)
                                            .then(() => {
                                                updateBackgroundTask(taskId, 'success', `Added ${s.name}.`);
                                                loadData(false);
                                            })
                                            .catch((e: any) => {
                                                updateBackgroundTask(taskId, 'error', `Failed to add ${s.name}.`);
                                                console.error(e);
                                            });
                                    }}
                                    onBulkAddSchools={async (schools) => {
                                         if (!account) return { success: 0, failed: 0 };
                                        let success = 0;
                                        let failed = 0;
                                        const taskId = addBackgroundTask(`Bulk adding ${schools.length} schools...`);
                                        for (const s of schools) {
                                             const newRow = [s.name, s.location, s.contactNumber, currentUser?.name || '', s.coverManager, s.email, s.contact2, s.contact2Email, false, s.emailName, s.switchboard, '', '', ''];
                                             try {
                                                await addSchool(msalInstance, account, worksheetMap.schools, newRow);
                                                success++;
                                             } catch (e) {
                                                 failed++;
                                                 console.error(e);
                                             }
                                        }
                                        updateBackgroundTask(taskId, failed === 0 ? 'success' : 'info', `Added ${success} schools. ${failed} failed.`);
                                        await loadData(false);
                                        return { success, failed };
                                    }}
                                    onSelectSchool={handleSelectSchool}
                                    onStartCall={handleStartCall}
                                    onToggleSpokenStatus={async (s) => {
                                        await updateSpokenToCoverManagerStatus(msalInstance, account!, worksheetMap.schools, s.excelRowIndex, !s.spokeToCoverManager);
                                        await loadData(false);
                                    }}
                                    onAddToPriorityQueue={() => {}}
                               />
                           )}
                           {activeView === 'School Profile' && selectedSchool && (
                               <SchoolProfilePage 
                                   school={selectedSchool}
                                   schools={currentUserData.schools}
                                   users={currentUserData.users}
                                   currentUser={currentUser!}
                                   tasks={currentUserData.tasks}
                                   notes={currentUserData.notes}
                                   emails={currentUserData.emails}
                                   callLogs={currentUserData.callLogs}
                                   opportunities={currentUserData.opportunities}
                                   jobAlerts={currentUserData.jobAlerts}
                                   onStartCall={handleStartCall}
                                   onOpenLogCallModal={() => {}}
                                   onOpenAddNoteModal={handleOpenAddNoteModal}
                                   onOpenAddTaskModal={handleOpenAddTaskModal}
                                   onOpenSendEmailModal={handleOpenSendEmailModal}
                                   onOpenUploadTranscriptModal={handleOpenUploadTranscriptForSchool}
                                   onAddOpportunity={(opp) => {
                                       const newRow = [opp.name, opp.schoolName, opp.progressStage, opp.accountManager, getExcelSerialDate(new Date()), '[]'];
                                       addOpportunity(msalInstance, account!, worksheetMap.opportunities, newRow).then(() => loadData(false));
                                   }}
                                   onUpdateSchool={handleUpdateSchool}
                                   onToggleSpokenStatus={async (s) => {
                                        await updateSpokenToCoverManagerStatus(msalInstance, account!, worksheetMap.schools, s.excelRowIndex, !s.spokeToCoverManager);
                                        await loadData(false);
                                    }}
                                   onToggleTaskStatus={handleToggleTaskStatus}
                                   onDeleteNote={async (note) => { await deleteNote(msalInstance, account!, worksheetMap.notes, note.excelRowIndex); await loadData(false); }}
                                   onDeleteTask={async (task) => { await deleteTask(msalInstance, account!, worksheetMap.tasks, task.excelRowIndex); await loadData(false); }}
                                   onDeleteCallLog={async (log) => { await deleteCallLog(msalInstance, account!, worksheetMap.callLogs, log.excelRowIndex); await loadData(false); }}
                                   onUpdateCallLog={onUpdateCallLog}
                                   onGenerateAiNotes={handleGenerateAiNotes}
                                   isGeneratingForTranscript={isGeneratingForTranscript}
                                   onBack={handleBack}
                                   onUpdateContactDetails={handleUpdateContactDetails}
                                   onUpdateJobs={handleUpdateJobs}
                               />
                           )}
                           {activeView === 'Tasks, Notes & Emails' && (
                               <TasksAndNotesPage 
                                   tasks={currentUserData.tasks}
                                   notes={currentUserData.notes}
                                   emails={currentUserData.emails}
                                   schools={currentUserData.schools}
                                   user={currentUser!}
                                   onToggleTask={handleToggleTaskStatus}
                                   onOpenAddTaskModal={handleOpenAddTaskModal}
                                   onOpenAddNoteModal={handleOpenAddNoteModal}
                                   onSelectSchool={handleSelectSchool}
                                   onDeleteTask={async (task) => { await deleteTask(msalInstance, account!, worksheetMap.tasks, task.excelRowIndex); await loadData(false); }}
                                   onDeleteNote={async (note) => { await deleteNote(msalInstance, account!, worksheetMap.notes, note.excelRowIndex); await loadData(false); }}
                                   isSuperAdmin={isSuperAdmin}
                               />
                           )}
                            {activeView === 'Emails' && (
                               <EmailsPage 
                                   emails={currentUserData.emails}
                                   emailTemplates={currentUserData.emailTemplates}
                                   onSaveTemplate={async (template) => {
                                       if (template.id) {
                                           await updateEmailTemplate(msalInstance, account!, worksheetMap.emailTemplates, template.excelRowIndex!, [template.id, template.name, template.subject, template.body, '']);
                                           await loadData(false);
                                       } else {
                                           const newId = `template_${Date.now()}`;
                                            await addEmailTemplate(msalInstance, account!, worksheetMap.emailTemplates, [newId, template.name, template.subject, template.body, '']);
                                           await loadData(false);
                                       }
                                   }}
                                   onDeleteTemplate={async (template) => { await deleteEmailTemplate(msalInstance, account!, worksheetMap.emailTemplates, template.excelRowIndex!); await loadData(false); }}
                                   onClearAllTemplates={async () => { await clearAllEmailTemplates(msalInstance, account!, worksheetMap.emailTemplates); await loadData(false); }}
                                   onUpdateTemplateAttachments={async (templateId, attachments) => {}}
                                   msalInstance={msalInstance}
                                   account={account!}
                               />
                           )}
                           {activeView === 'Calls' && (
                               <CallsPage 
                                   callLogs={currentUserData.callLogs}
                                   schools={currentUserData.schools}
                                   onSelectSchool={handleSelectSchool}
                                   onDeleteCallLog={async (log) => { await deleteCallLog(msalInstance, account!, worksheetMap.callLogs, log.excelRowIndex); await loadData(false); }}
                               />
                           )}
                           {activeView === 'Dialer' && (
                               <CallsDialerPage 
                                   schools={currentUserData.schools}
                                   notes={currentUserData.notes}
                                   callLogs={currentUserData.callLogs}
                                   onStartCall={handleStartCall}
                                   activeCall={activeCall}
                                   elapsedTime={elapsedTime}
                                   onEndAndLogCall={handleEndAndLogCall}
                                   activeCallNotes={activeCallNotes}
                                   setActiveCallNotes={setActiveCallNotes}
                                   onSelectSchool={handleSelectSchool}
                                   onUpdateSchool={handleUpdateSchool}
                                   onOpenSendEmailModal={handleOpenSendEmailModal}
                                   currentUser={currentUser!}
                                   transcription={transcription}
                                   isTranscribing={isTranscribing}
                                   startTranscription={startTranscription}
                                   stopTranscription={stopTranscription}
                               />
                           )}
                           {activeView === 'Reports' && (
                               <ReportsPage 
                                   callLogs={currentUserData.callLogs}
                                   users={currentUserData.users}
                                   schools={currentUserData.schools}
                                   tasks={currentUserData.tasks}
                                   notes={currentUserData.notes}
                                   emails={currentUserData.emails}
                                   opportunities={currentUserData.opportunities}
                                   bookings={currentUserData.bookings}
                                   currentUser={currentUser!}
                                   isSuperAdmin={isSuperAdmin}
                               />
                           )}
                           {activeView === 'Opportunities' && (
                               <OpportunitiesPage 
                                   opportunities={currentUserData.opportunities}
                                   schools={currentUserData.schools}
                                   users={currentUserData.users}
                                   currentUser={currentUser!}
                                   onAddOpportunity={(opp) => {
                                       const newRow = [opp.name, opp.schoolName, opp.progressStage, opp.accountManager, getExcelSerialDate(new Date()), '[]'];
                                       addOpportunity(msalInstance, account!, worksheetMap.opportunities, newRow).then(() => loadData(false));
                                   }}
                                   onUpdateOpportunity={async (opp) => {
                                       await updateOpportunity(msalInstance, account!, worksheetMap.opportunities, opp.excelRowIndex, [opp.name, opp.schoolName, opp.progressStage, opp.accountManager, getExcelSerialDate(parseUKDateTimeString(opp.dateCreated)!), JSON.stringify(opp.notes)]);
                                       await loadData(false);
                                   }}
                                   onDeleteOpportunity={async (opp) => { await deleteOpportunity(msalInstance, account!, worksheetMap.opportunities, opp.excelRowIndex); await loadData(false); }}
                                   onSelectOpportunity={(opp) => { setSelectedOpportunity(opp); setActiveView('Opportunity Detail'); }}
                                   onSelectSchool={handleSelectSchool}
                               />
                           )}
                           {activeView === 'Opportunity Detail' && selectedOpportunity && (
                               <OpportunityDetailPage 
                                   opportunity={selectedOpportunity}
                                   users={currentUserData.users}
                                   currentUser={currentUser!}
                                   onUpdateOpportunity={async (opp) => {
                                       await updateOpportunity(msalInstance, account!, worksheetMap.opportunities, opp.excelRowIndex, [opp.name, opp.schoolName, opp.progressStage, opp.accountManager, getExcelSerialDate(parseUKDateTimeString(opp.dateCreated)!), JSON.stringify(opp.notes)]);
                                       await loadData(false);
                                   }}
                                   onDeleteOpportunity={async (opp) => { await deleteOpportunity(msalInstance, account!, worksheetMap.opportunities, opp.excelRowIndex); await loadData(false); handleBack(); }}
                                   onAddNote={async (opp, note) => {
                                       const newNotes = [...(opp.notes || []), note];
                                       await updateOpportunityNotes(msalInstance, account!, worksheetMap.opportunities, opp.excelRowIndex, JSON.stringify(newNotes));
                                       await loadData(false);
                                   }}
                                   onBack={handleBack}
                               />
                           )}
                           {activeView === 'Candidates' && (
                               <CandidatesPage 
                                   candidates={currentUserData.candidates}
                                   onSelectCandidate={handleSelectCandidate}
                                   onOpenAddCandidateModal={() => setIsAddCandidateModalOpen(true)}
                               />
                           )}
                           {activeView === 'Candidate Profile' && selectedCandidate && (
                               <CandidateProfilePage 
                                   candidate={selectedCandidate}
                                   onBack={handleBack}
                                   onUpdateCandidate={async (cand) => {
                                       const row = [
                                           cand.id, cand.name, getExcelSerialDate(parseUKDate(cand.dob)!), cand.location, cand.drives, cand.willingToTravelMiles,
                                           cand.email, cand.phone, cand.dbs, cand.onUpdateService, cand.dbsCertificateUrl, cand.cvUrl,
                                           cand.availability.monday, cand.availability.tuesday, cand.availability.wednesday, cand.availability.thursday, cand.availability.friday,
                                           cand.notes
                                       ];
                                       await updateCandidate(msalInstance, account!, worksheetMap.candidates, cand.excelRowIndex, row);
                                       await loadData(false);
                                   }}
                                   msalInstance={msalInstance}
                                   account={account!}
                               />
                           )}
                           {activeView === 'JAY-AI Hub' && (
                               <StrategicAiHub 
                                   crmData={currentUserData}
                                   onOpenSendEmailModal={handleOpenSendEmailModal}
                                   onOpenAddTaskModal={handleOpenAddTaskModal}
                                   onSelectSchool={handleSelectSchool}
                                   onSelectCandidate={handleSelectCandidate}
                                   onUpdateCallLog={onUpdateCallLog}
                                   onAddNewJobAlert={handleAddNewJobAlert}
                                   isJobSearching={isJobSearching}
                                   jobSearchLog={jobSearchLog}
                                   jobSearchSummary={jobSearchSummary}
                                   onStartJobSearch={startJobSearch}
                                   onStopJobSearch={stopJobSearch}
                                   onSaveCustomDialerList={handleSaveCustomDialerList}
                                   coachReport={coachReport}
                                   salesStrategistReport={salesStrategistReport}
                                   onGenerateSalesStrategistReport={() => generateAndStoreSalesStrategistReport()}
                                   strategicPlannerReport={strategicPlannerReport}
                                   onGenerateStrategicPlannerReport={() => generateAndStoreStrategicPlannerReport()}
                                   onPruneJobAlerts={handlePruneJobAlerts}
                                   coachChatHistory={coachChatHistory}
                                   onSendCoachMessage={handleSendCoachMessage}
                                   isCoachResponding={isCoachResponding}
                                   onUpdateSchool={handleUpdateSchool}
                                   openDebug={openDebug}
                               />
                           )}
                           {activeView === 'Book of Business' && (
                               <BookOfBusinessPage 
                                   bookings={currentUserData.bookings}
                                   onOpenAddBookingModal={() => setIsAddBookingModalOpen(true)}
                                   onDeleteMasterBooking={async (id) => {
                                       const booking = currentUserData.bookings.find(b => b.id === id);
                                       if (booking) {
                                           await deleteBooking(msalInstance, account!, worksheetMap.bookings, booking.excelRowIndex);
                                           await loadData(false);
                                       }
                                   }}
                                   onUpdateBooking={async (b) => {
                                       const row = [
                                           b.schoolName, b.schoolId, b.candidateName, b.candidateId, b.durationDays, b.schoolHourlyRate * 6, b.candidateHourlyRate * 6,
                                           b.schoolDailyRate, b.candidateDailyRate, b.hourlyProfit, b.dailyProfit, b.schoolWeekCharge, b.candidateWeekCharge, b.weekProfit,
                                           b.totalSchoolCharge, b.totalCandidateCharge, b.amendments, b.totalProfit, getExcelSerialDate(parseUKDate(b.startDate)!), b.id, b.accountManager
                                       ];
                                       await updateBooking(msalInstance, account!, worksheetMap.bookings, b.excelRowIndex, row);
                                       await loadData(false);
                                   }}
                                   onSelectSchool={handleSelectSchool}
                                   schools={currentUserData.schools}
                               />
                           )}
                           {activeView === 'Settings' && (
                               <AdminMappingManager 
                                   isJayNortonAdminView={isJayNortonAdminView}
                                   onToggleJayNortonView={() => setIsJayNortonAdminView(!isJayNortonAdminView)}
                                   isJoshColeAdminView={isJoshColeAdminView}
                                   onToggleJoshColeView={() => setIsJoshColeAdminView(!isJoshColeAdminView)}
                                   isSuperAdmin={isSuperAdmin}
                                   isJayNorton={isJayNorton}
                                   isJoshCole={isJoshCole}
                               />
                           )}
                        </>
                    )}
                </main>

                {isAddCallLogModalOpen && schoolForAction && (
                    <AddCallLogModal 
                        isOpen={isAddCallLogModalOpen}
                        onClose={handleCloseLogCallModal}
                        onSubmit={handleSaveCallLogFromModal as any}
                        school={schoolForAction}
                        initialData={callLogInitialData}
                        callLogsForSchool={currentUserData.callLogs.filter(c => c.schoolName === schoolForAction.name) || []}
                    />
                )}
                <AddNoteModal 
                    isOpen={isAddNoteModalOpen}
                    onClose={() => { setIsAddNoteModalOpen(false); setNoteToEdit(null); }}
                    onSubmit={handleSaveNote}
                    school={schoolForAction}
                    schools={currentUserData.schools}
                    noteToEdit={noteToEdit}
                />
                <AddTaskModal 
                    isOpen={isAddTaskModalOpen}
                    onClose={() => { setIsAddTaskModalOpen(false); setTaskToEdit(null); }}
                    onSubmit={handleSaveTask}
                    school={schoolForAction}
                    schools={currentUserData.schools}
                    taskToEdit={taskToEdit}
                />
                {isSendEmailModalOpen && schoolForAction && (
                    <SendEmailModal 
                        isOpen={isSendEmailModalOpen}
                        onClose={() => setIsSendEmailModalOpen(false)}
                        onSubmit={async (emailData) => {
                            await sendEmail(msalInstance, account!, emailData.to, emailData.subject, emailData.body, emailData.attachments);
                            await addEmail(msalInstance, account!, worksheetMap.emails, [schoolForAction.name, currentUser!.name, schoolForAction.coverManager, getExcelSerialDate(new Date()), emailData.subject, emailData.body]);
                            await loadData(false);
                        }}
                        school={schoolForAction}
                        currentUser={currentUser!}
                        templates={currentUserData.emailTemplates || []}
                        msalInstance={msalInstance}
                        account={account!}
                    />
                )}
                <ProfileModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={(profile) => {
                        setUserProfile(prev => ({ ...prev, ...profile }));
                        localStorage.setItem(`userProfile_${currentUser!.email}`, JSON.stringify(profile));
                    }}
                    currentUser={currentUser!}
                />
                <QrCodeModal 
                    isOpen={isQrCodeModalOpen} 
                    onClose={() => setIsQrCodeModalOpen(false)} 
                    url={window.location.href} 
                />
                <CreateAnnouncementModal 
                    isOpen={isCreateAnnouncementModalOpen} 
                    onClose={() => setIsCreateAnnouncementModalOpen(false)} 
                    onSubmit={async (ann) => {
                        await addAnnouncement(msalInstance, account!, worksheetMap.announcements, [currentUser!.name, ann.title, ann.message, getExcelSerialDate(new Date())]);
                        await loadData(false);
                    }} 
                />
                {isViewAnnouncementModalOpen && latestAnnouncement && (
                    <ViewAnnouncementModal 
                        isOpen={isViewAnnouncementModalOpen}
                        onClose={() => setIsViewAnnouncementModalOpen(false)}
                        announcement={latestAnnouncement}
                        onAcknowledge={() => localStorage.setItem('lastAcknowledgedAnnouncementId', latestAnnouncement.id)}
                    />
                )}
                 <TaskSuggestionModal
                    isOpen={isTaskSuggestionModalOpen}
                    onClose={() => setIsTaskSuggestionModalOpen(false)}
                    onSave={handleSaveAiNotes}
                    suggestions={suggestedTasks}
                    schoolName={callLogForAi?.schoolName || ''}
                    notes={aiGeneratedNotes}
                    onAccept={handleAcceptAiTask}
                    onDecline={handleDeclineAiTask}
                    email={aiGeneratedEmail}
                    onSendEmail={handleSendAiEmail}
                />
                <AiNotesReadyModal 
                    isOpen={isAiNotesReadyModalOpen} 
                    onClose={() => setIsAiNotesReadyModalOpen(false)}
                    onView={() => {
                        const school = currentUserData.schools.find(s => s.name === callLogForAi?.schoolName);
                        if (school) handleSelectSchool(school);
                        setIsAiNotesReadyModalOpen(false);
                    }}
                    notes={aiGeneratedNotes}
                    schoolName={callLogForAi?.schoolName || ''}
                />
                 <AddBookingModal 
                    isOpen={isAddBookingModalOpen}
                    onClose={() => setIsAddBookingModalOpen(false)}
                    onSubmit={async (booking) => {
                         const school = currentUserData.schools.find(s => s.name === booking.schoolName);
                         const candidate = currentUserData.candidates.find(c => c.name === booking.candidateName);
                         if(!school || !candidate) return;

                         const sDaily = booking.schoolDayCharge;
                         const cDaily = booking.candidateDayCharge;
                         const sHourly = sDaily / 6;
                         const cHourly = cDaily / 6;
                         const hourlyProfit = sHourly - cHourly;
                         const dailyProfit = sDaily - cDaily;
                         const sWeek = sDaily * 5;
                         const cWeek = cDaily * 5;
                         const wProfit = sWeek - cWeek;
                         const totalS = sDaily * booking.days;
                         const totalC = cDaily * booking.days;
                         const totalP = dailyProfit * booking.days;
                         
                         const row = [
                             booking.schoolName, school.name, booking.candidateName, candidate.id, booking.days, sDaily, cDaily, sDaily, cDaily,
                             hourlyProfit, dailyProfit, sWeek, cWeek, wProfit, totalS, totalC, '{}', totalP, getExcelSerialDate(parseUKDate(booking.startDate)!),
                             `booking_${Date.now()}`, currentUser!.name
                         ];
                         await addBooking(msalInstance, account!, worksheetMap.bookings, row);
                         await loadData(false);
                    }}
                    schools={currentUserData.schools || []}
                    candidates={currentUserData.candidates || []}
                 />
                 <AddCandidateModal
                    isOpen={isAddCandidateModalOpen}
                    onClose={() => setIsAddCandidateModalOpen(false)}
                    onSubmit={async (cand) => {
                        const row = [
                            `cand_${Date.now()}`, cand.name, getExcelSerialDate(parseUKDate(cand.dob)!), cand.location, cand.drives, cand.willingToTravelMiles,
                            cand.email, cand.phone, cand.dbs, cand.onUpdateService, '', '', 
                            cand.availability.monday, cand.availability.tuesday, cand.availability.wednesday, cand.availability.thursday, cand.availability.friday,
                            cand.notes
                        ];
                        await addCandidate(msalInstance, account!, worksheetMap.candidates, row);
                        await loadData(false);
                    }}
                 />

                <AiDebugPanel
                    isOpen={isDebugOpen}
                    onClose={() => setIsDebugOpen(false)}
                    debugData={aiDebug}
                />

                {import.meta.env.DEV && <AIDebugPanel />}

                <BackgroundSyncStatus tasks={backgroundTasks} onDismiss={(id) => setBackgroundTasks(prev => prev.filter(t => t.id !== id))} />
                <JobAlertNotification notifications={jobAlertNotifications} onDismiss={(id) => setJobAlertNotifications(prev => prev.filter(n => n.excelRowIndex !== id))} />
            </div>
        </div>
    );
};

export default App;
