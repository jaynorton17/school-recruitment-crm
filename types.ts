
import React from 'react';

export interface School {
    name: string;
    location: string;
    contactNumber: string;
    accountManager: string;
    coverManager: string;
    email: string;
    contact2?: string;
    contact2Email?: string;

    lastCalledDate?: string;
    spokeToCoverManager: boolean;
    excelRowIndex: number;
    emailName?: string;
    switchboard?: string;
    engagementScore?: '' | 'CM Not Known' | 'CM Confirmed' | 'CM Spoken To';
    website?: string;
    status?: string;
}

export interface Task {
    schoolName: string;
    type: string;
    phoneNumber?: string;
    accountManager: string;
    coverManager?: string;
    coverManagerEmail?: string;
    contact2?: string;
    contact2Email?: string;
    dateCreated: string;
    taskDescription: string;
    dueDate?: string;
    dueTime?: string;
    reminderDate?: string;
    isCompleted: boolean;
    excelRowIndex: number;
}

export interface Note {
    schoolName: string;
    accountManager: string;
    coverManager?: string;
    contact2?: string;
    date: string;
    note: string;
    excelRowIndex: number;
    source?: 'ai' | 'manual';
}

export interface Email {
    schoolName: string;
    accountManager: string;
    coverManager: string;
    date: string;
    subject: string;
    body: string;
    direction?: 'sent' | 'received';
}

export interface CallLog {
    schoolName: string;
    location: string;
    phoneNumber: string;
    accountManager: string;
    contactCalled: string;
    dateCalled: string;
    spokeToCoverManager: boolean;
    duration: string;
    notes: string;
    transcript?: string;
    coverManager?: string;
    excelRowIndex: number;
}

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    name: string;
    profilePicture?: string;
    address?: string;
    mobileNumber?: string;
    lastSeen?: string; // ISO String
    status?: 'Online' | 'Away' | 'On a Call' | 'Offline';
}

export interface ManualAttachment {
    type: 'manual';
    name: string;
    contentType: string;
    contentBytes: string; // base64
    excelRowIndex?: number;
    // FIX: Added optional 'size' property to align with SharePointAttachment and resolve a destructuring error.
    size?: number;
}

export interface SharePointAttachment {
    type: 'sharepoint';
    name: string;
    contentType: string;
    fileId: string; // itemId from Graph API
    driveId: string;
    excelRowIndex?: number;
    size?: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    attachments: (ManualAttachment | SharePointAttachment)[];
    excelRowIndex?: number;
}

export interface Candidate {
    id: string;
    name: string;
    dob?: string;
    location: string;
    drives: boolean;
    willingToTravelMiles?: number;
    email: string;
    phone: string;
    dbs: boolean;
    onUpdateService: boolean;
    dbsCertificateUrl?: string;
    cvUrl?: string;
    availability: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
    };
    notes?: string;
    excelRowIndex: number;
}

export interface OpportunityNote {
    author: string;
    date: string; // ISO String
    note: string;
}

export interface Opportunity {
    id: string;
    name: string; // This will be the description
    schoolName: string;
    progressStage: '5% - Opportunity identified' | '15% - Reached out' | '50% - Engagement' | '75% - Negotiation' | '100% - Closed Won' | '100% - Closed Lost';
    accountManager: string;
    dateCreated: string;
    notes?: OpportunityNote[];
    excelRowIndex: number;
}

// FIX: Added missing type definition for PerformanceFeedback to resolve import error.
export interface PerformanceFeedback {
    id: string;
    dateRange: string;
    strengths: string[];
    areasForImprovement: string[];
    tips: string[];
}

// FIX: Add missing SuggestedTask interface to resolve import error.
export interface SuggestedTask {
    id: string;
    description: string;
    dueDate?: string;
    dueTime?: string;
}

export interface Announcement {
    id: string; // Generated unique ID
    author: string;
    title: string;
    message: string;
    createdAt: string; // Formatted date
}

export interface Mapping {
    id: string;
    crmField: string;
    spreadsheet: string;
    sheetName: string;
    column: string;
}

export interface CustomDialerList {
    id: number;
    name: string;
    filters: {
        searchTerm: string;
        spokenFilter: 'any' | 'yes' | 'no';
        selectedLocations: string[];
        selectedEngagements: string[];
        dateFilterType?: 'any' | 'specific' | 'between' | 'before' | 'after' | 'blank';
        date1?: string;
        date2?: string;
    };
    staticSchoolIndices?: number[];
}

export interface SuggestedCallList {
    name: string;
    reason: string;
    filters: CustomDialerList['filters'];
}

export type SearchResult =
  | { type: 'school'; data: School }
  | { type: 'task'; data: Task }
  | { type: 'note'; data: Note }
  | { type: 'call'; data: CallLog }
  | { type: 'opportunity'; data: Opportunity }
  | { type: 'candidate'; data: Candidate }
  | { type: 'job'; data: JobAlert };

export interface AiEmailDraft {
  subject: string;
  body: string;
}

export interface AiSuggestion {
    id: string;
    suggestion: string;
    schoolName: string;
    category: 'Engage' | 'Nurture' | 'Convert' | 'Recover';
    confidence: 'Low' | 'Medium' | 'High';
    reason: string;
    action?: {
        type: 'email' | 'task';
        data: AiEmailDraft | { description: string };
    };
}

export interface BookingAmendment {
    schoolDeduction: number;
    candidateDeduction: number;
    notes?: string;
}

export interface Booking {
    id: string;
    schoolName: string;
    schoolId?: string;
    candidateName: string;
    candidateId?: string;
    durationDays: number;
    schoolHourlyRate: number;
    candidateHourlyRate: number;
    schoolDailyRate: number;
    candidateDailyRate: number;
    hourlyProfit: number;
    dailyProfit: number;
    schoolWeekCharge: number;
    candidateWeekCharge: number;
    weekProfit: number;
    totalSchoolCharge: number;
    totalCandidateCharge: number;
    amendments: string; // JSON string for daily amendments
    parsedAmendments?: Record<string, BookingAmendment>; // Date string 'DD/MM/YYYY' -> Amendment
    totalProfit: number;
    startDate: string; // DD/MM/YYYY
    excelRowIndex: number;
    accountManager: string;

    // FIX: Added missing properties to support daily booking updates and master booking references.
    masterBookingId?: string;
    date?: string;
    schoolDeduction?: number;
    candidateDeduction?: number;
    notes?: string;
}

export interface JobAlert {
    schoolId: string;
    schoolName: string;
    jobTitle: string;
    subject: string;
    salary: string;
    closeDate: string;
    location: string;
    jobDescription: string;
    notes: string;
    excelRowIndex: number;
    sourceUrl?: string;
}


// --- New Types for AI Coach ---

export interface CoachKPIs {
    callsMade: number;
    emailVolume: number;
    emailReplies: number;
    taskCompletion: number;
    followUpsMissed: number;
    schoolsWithEngagement: number;
}

export interface CoachKeyInsight {
    title: 'Critical Gaps Detected' | 'High-Value Wins' | 'Behaviour Patterns' | 'Priority Fixes';
    description: string;
}

export interface CoachRecommendedAction {
    description: string;
    schoolName?: string;
}

export interface CoachReportData {
    kpis: CoachKPIs;
    keyInsights: CoachKeyInsight[];
    strengths: string[];
    weaknesses: string[];
    recommendedActions: CoachRecommendedAction[];
}

export interface CoachChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// --- End New Types for AI Coach ---


// FIX: Added missing CrmData interface to resolve import error in StrategicAiHub.tsx.
export interface CrmData {
  schools: School[];
  tasks: Task[];
  notes: Note[];
  emails: Email[];
  callLogs: CallLog[];
  users: User[];
  candidates: Candidate[];
  opportunities: Opportunity[];
  emailTemplates: EmailTemplate[];
  performanceFeedback: PerformanceFeedback[];
  announcements: Announcement[];
  bookings: Booking[];
  jobAlerts: JobAlert[];
}
