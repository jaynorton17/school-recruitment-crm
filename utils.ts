import { School, Task, Note, Email, CallLog, User, Candidate, Opportunity, OpportunityNote, EmailTemplate, ManualAttachment, SharePointAttachment, Announcement, Booking, BookingAmendment, JobAlert } from "./types";

/**
 * A robust function to parse a date from various formats into a
 * LOCAL TIME Date object, strictly expecting DD/MM/YYYY for string dates.
 * This is key for ensuring all date comparisons are consistent.
 */
export const parseUKDate = (dateInput: string | number | undefined | null): Date | null => {
    if (dateInput === undefined || dateInput === null || dateInput === '') return null;

    // 1. Handle Excel serial number first.
    if (typeof dateInput === 'number') {
        const utcMilliseconds = (dateInput - 25569) * 86400 * 1000;
        const date = new Date(utcMilliseconds);
        if (!isNaN(date.getTime())) {
            // Create a local date from UTC components to avoid timezone shifts during comparison.
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
        }
        return null;
    }

    const dateString = String(dateInput).trim();

    // 2. Handle ISO 8601 format (from Graph API).
    if (dateString.includes('T') && dateString.includes('Z')) {
        const isoDate = new Date(dateString);
        if (!isNaN(isoDate.getTime())) {
            isoDate.setHours(0, 0, 0, 0);
            return isoDate;
        }
    }

    // 3. Handle UK string format (DD/MM/YYYY)
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

        // Handle two-digit years like '25' -> 2025
        if (year < 100) {
            year += (year < 70 ? 2000 : 1900);
        }

        // Validate date components.
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
            // Create a date at midnight in local time. Month is 0-indexed for Date constructor.
            const date = new Date(year, month - 1, day, 0, 0, 0);
            // Verify that the created date is valid (e.g., handles 31/02/2025 correctly)
            if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                return date;
            }
        }
    }

    return null;
};


/**
 * Formats a date from various inputs into the standard UK format (DD/MM/YYYY) using local time.
 */
export const formatDateUK = (dateInput: string | number | Date | undefined): string => {
    if (dateInput instanceof Date) {
        const day = String(dateInput.getDate()).padStart(2, '0');
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const year = dateInput.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    const date = parseUKDate(dateInput);
    if (!date) return dateInput ? String(dateInput) : '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Formats an ISO date string into the UK format with time (DD/MM/YYYY HH:mm).
 */
export const formatDateTimeUK = (dateInput: string | undefined): string => {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput); // This works for ISO strings
        if (isNaN(date.getTime())) return formatDateUK(dateInput); // Fallback for serials etc.

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return formatDateUK(dateInput); // Fallback
    }
};

/**
 * Parses a string that could be "DD/MM/YYYY" or "DD/MM/YYYY HH:mm" into a Date object.
 */
export const parseUKDateTimeString = (dateTimeStr: string | undefined | null): Date | null => {
    if (!dateTimeStr) return null;
    const s = String(dateTimeStr).trim();

    // Try parsing as "DD/MM/YYYY HH:mm"
    const dtParts = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})$/);
    if (dtParts) {
        const [, day, month, year, hours, minutes] = dtParts.map(Number);
        const date = new Date(year, month - 1, day, hours, minutes);
        if (!isNaN(date.getTime())) return date;
    }

    // Fallback to parsing as just a date "DD/MM/YYYY"
    return parseUKDate(s);
};

/**
 * Formats an Excel serial date number into a UK date and time string (DD/MM/YYYY HH:mm).
 * Handles both date-only and date-time serials.
 */
export const formatExcelDateTimeUK = (serial: number | undefined): string => {
    if (typeof serial !== 'number' || isNaN(serial)) return '';

    // Excel's epoch is 1899-12-30 due to a bug. JS's is 1970-01-01. The difference is 25569 days.
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return '';

    // The serial number is timezone-agnostic (days since epoch). We interpret it as UTC and format the UTC parts.
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    // Check if the serial number had a time component (a fractional part).
    // If not, just return the date.
    if (serial % 1 === 0) {
        return `${day}/${month}/${year}`;
    }

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatDateTimeUS_Excel = (date: Date): string => {
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours);

    // Example: 11/18/2025 9:55:00 AM
    return `${month}/${day}/${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
};


/**
 * Formats a duration from an Excel time serial number (fraction of a day)
 * into a "m:ss" string. Handles pre-formatted strings gracefully.
 */
export const formatExcelDuration = (serial: any): string => {
    // If it's already a string with a colon, assume it's formatted correctly.
    if (typeof serial === 'string' && serial.includes(':')) {
        return serial;
    }

    let numSerial = Number(serial);

    // If it's not a valid number or it's negative, return original value as string.
    if (isNaN(numSerial) || numSerial < 0) {
        return String(serial || '');
    }

    // The value from Excel seems to be off by a factor of 60, likely due to h:mm vs m:ss interpretation.
    // This corrects for that discrepancy.
    if (numSerial > 0 && numSerial < 1) {
      numSerial = numSerial / 60;
    }

    // Excel time is a fraction of a 24-hour day.
    const totalSeconds = Math.round(numSerial * 86400);

    // Handle edge case where input is '0' but we don't want to show "0:00" for empty cells.
    if (totalSeconds === 0 && String(serial).trim() !== '0') return '';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// FIX: Added missing getExcelSerialDate function to convert JS Date to Excel serial number.
/**
 * Converts a JavaScript Date object into an Excel serial date number.
 * This function is timezone-agnostic by using the UTC values of the date components.
 */
export const getExcelSerialDate = (date: Date): number => {
    // Date.UTC returns milliseconds from 1970-01-01 00:00:00 UTC
    const utcMilliseconds = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    );

    // Milliseconds in one day
    const msPerDay = 86400000; // 1000 * 60 * 60 * 24

    // The number of days between JS epoch (1970-01-01) and Excel's epoch (1900-01-01),
    // accounting for Excel's incorrect 1900 leap year. The value is 25569.
    const excelSerial = (utcMilliseconds / msPerDay) + 25569;

    return excelSerial;
};


const getStartOfTodayLocal = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

export const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

export const getStartOfMonth = (date: Date): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const isOverdue = (dateStr: string | undefined): boolean => {
    const dueDate = parseUKDate(dateStr);
    if (!dueDate) return false;
    // Overdue if due date is before the start of today
    return dueDate.getTime() < getStartOfTodayLocal().getTime();
};

export const isDueInNext7Days = (dateStr: string | undefined): boolean => {
    const dueDate = parseUKDate(dateStr);
    if (!dueDate) return false;
    const today = getStartOfTodayLocal();
    if (dueDate.getTime() < today.getTime()) return false;

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return dueDate.getTime() <= sevenDaysFromNow.getTime();
};

export const isToday = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    // Use the robust parser that handles both date and date-time strings
    const itemDate = parseUKDateTimeString(dateStr);
    if (!itemDate) return false;
    
    const today = new Date();
    
    // Compare year, month, and day components, ignoring the time.
    return (
        itemDate.getFullYear() === today.getFullYear() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getDate() === today.getDate()
    );
};


/**
 * Checks if a date falls between Monday of the current week and today (inclusive).
 * All calculations are done in the user's local timezone.
 */
export const isThisWeek = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    const date = parseUKDateTimeString(dateStr);
    if (!date) return false;
    date.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Use end of today for comparison
    
    // An item can't be from the future.
    if (date.getTime() > today.getTime()) {
        return false;
    }

    const startOfWeek = getStartOfWeek(new Date());

    return date.getTime() >= startOfWeek.getTime();
};

export const isLastWeek = (dateStr: string): boolean => {
    const date = parseUKDate(dateStr);
    if (!date) return false;

    const today = new Date();
    const lastWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    
    const startOfLastWeek = getStartOfWeek(lastWeekDate);
    
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    return date.getTime() >= startOfLastWeek.getTime() && date.getTime() <= endOfLastWeek.getTime();
};

/**
 * Checks if a date falls within the last 7 days (today + previous 6 days).
 * All calculations are done in the user's local timezone.
 */
export const isInLast7Days = (dateStr: string): boolean => {
    const date = parseUKDateTimeString(dateStr);
    if (!date) return false;
    date.setHours(0, 0, 0, 0);

    const today = getStartOfTodayLocal();

    // A call can't be made in the future.
    if (date.getTime() > today.getTime()) {
        return false;
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    return date.getTime() >= sevenDaysAgo.getTime();
};

/**
 * Automatically formats a string as a date (DD/MM/YYYY) as the user types.
 * It only formats the part of the string before the first space, preserving any time information.
 */
export const autoformatDateInput = (value: string): string => {
    // Only format the date part, leave time part untouched.
    const parts = value.split(' ');
    const datePart = parts[0];
    const timePart = parts.length > 1 ? ` ${parts.slice(1).join(' ')}` : '';

    const digitsOnly = datePart.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return timePart.trim();

    if (digitsOnly.length <= 2) {
        return digitsOnly + timePart;
    }
    if (digitsOnly.length <= 4) {
        return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}` + timePart;
    }
    
    let formattedDate = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    
    return formattedDate + timePart;
};


export const parseSchools = (data: any[][]): School[] => {
    return data
        .map((row, index) => ({
            name: String(row[0] || ''),
            location: String(row[1] || ''),
            contactNumber: String(row[2] || ''),
            accountManager: normalizeManagerName(String(row[3] || '')),
            coverManager: String(row[4] || ''),
            email: String(row[5] || ''),
            contact2: row[6] ? String(row[6]) : undefined,
            contact2Email: row[7] ? String(row[7]) : undefined,
            spokeToCoverManager: row[8] === true || String(row[8]).toLowerCase() === 'true',
            emailName: row[9] ? String(row[9]) : undefined,
            switchboard: row[10] ? String(row[10]) : undefined,
            engagementScore: row[11] ? String(row[11]) as School['engagementScore'] : '',
            website: row[12] ? String(row[12]) : undefined,
            status: row[13] ? String(row[13]) : undefined,
            excelRowIndex: index + 2, // Excel is 1-based, and we sliced the header row.
        }))
        .filter(school => school.name); // Filter out empty rows
};

export const parseTasks = (data: any[][]): Task[] => {
    return data
        .map((row, index) => ({
            schoolName: row[0] || '', // A
            type: row[1] || 'General or other', // B
            phoneNumber: row[2], // C
            accountManager: normalizeManagerName(row[3] || ''), // D
            coverManager: row[4], // E
            coverManagerEmail: row[5], // F
            contact2: row[6], // G
            contact2Email: row[7], // H
            dateCreated: formatExcelDateTimeUK(row[8]), // I
            taskDescription: row[9] || '', // J
            dueDate: formatDateUK(row[10]), // K
            // L is row[11], which is skipped.
            dueTime: row[12] ? String(row[12]) : undefined, // M (index 12)
            isCompleted: row[13] === true || String(row[13]).toLowerCase() === 'true', // N (index 13)
            reminderDate: undefined, // No longer mapped from the sheet.
            excelRowIndex: index + 2,
        }))
        .filter(task => task.schoolName && task.taskDescription); // Filter out empty rows
};

export const parseNotes = (data: any[][]): Note[] => {
    return data
        .map((row, index) => ({
            schoolName: row[0] || '',
            accountManager: normalizeManagerName(row[1] || ''),
            coverManager: row[2],
            contact2: row[3],
            date: formatExcelDateTimeUK(row[4]),
            note: row[5] || '',
            excelRowIndex: index + 2,
        }))
        .filter(note => note.schoolName && note.note); // Filter out empty rows
};

export const parseEmails = (data: any[][]): Email[] => {
    return data
        .map(row => {
            let subject = row[4] || '';
            let direction: 'sent' | 'received' = 'sent'; // Default to sent
            if (subject.startsWith('[Received] ')) {
                direction = 'received';
                subject = subject.substring(11); // Remove the prefix
            }

            return {
                schoolName: row[0] || '',
                accountManager: normalizeManagerName(row[1] || ''),
                coverManager: row[2] || '',
                date: formatExcelDateTimeUK(row[3]),
                subject: subject,
                body: row[5] || '',
                direction: direction,
            };
        })
        .filter(email => email.schoolName && email.subject); // Filter out empty rows
};

export const parseSyncedEmails = (graphEmails: any[], schools: School[], currentUser: { name: string; email: string; }, allUserEmails: string[]): Email[] => {
    if (!graphEmails || graphEmails.length === 0 || allUserEmails.length === 0) return [];

    const schoolEmailMap = new Map<string, School>();
    schools.forEach(school => {
        if (school.email) schoolEmailMap.set(school.email.toLowerCase(), school);
        if (school.contact2Email) schoolEmailMap.set(school.contact2Email.toLowerCase(), school);
    });

    const userEmailsSet = new Set(allUserEmails.map(e => e.toLowerCase()));
    const syncedEmails: Email[] = [];

    graphEmails.forEach(email => {
        const fromEmail = email.from?.emailAddress?.address?.toLowerCase();
        if (!fromEmail) return;

        const recipientEmails = [
            ...(email.toRecipients || []),
            ...(email.ccRecipients || [])
        ].map((r: any) => r.emailAddress?.address?.toLowerCase()).filter(Boolean);

        const allParticipantEmails = [fromEmail, ...recipientEmails];
        
        // Find if any participant is a known school contact.
        const schoolParticipants = allParticipantEmails
            .map(email => ({ email, school: schoolEmailMap.get(email) }))
            .filter(p => p.school);

        // If the email doesn't involve a known school, skip it.
        if (schoolParticipants.length === 0) {
            return;
        }

        const isSentByUser = userEmailsSet.has(fromEmail);
        const direction: 'sent' | 'received' = isSentByUser ? 'sent' : 'received';
        const processedSchools = new Set<string>();

        schoolParticipants.forEach(({ school, email: schoolEmail }) => {
            if (school && !processedSchools.has(school.name)) {
                let contactName = school.coverManager; // Default
                if (school.email?.toLowerCase() === schoolEmail) {
                    contactName = school.coverManager;
                } else if (school.contact2Email?.toLowerCase() === schoolEmail) {
                    contactName = school.contact2 || school.coverManager;
                }

                syncedEmails.push({
                    schoolName: school.name,
                    accountManager: currentUser.name,
                    coverManager: contactName || 'Unknown Contact',
                    date: formatDateTimeUK(email.sentDateTime || email.receivedDateTime),
                    subject: email.subject || 'No Subject',
                    body: email.body?.content || '',
                    direction: direction,
                });

                processedSchools.add(school.name);
            }
        });
    });

    return syncedEmails;
};

/**
 * Normalizes account manager names to handle data inconsistencies.
 * - Corrects the specific "Jay Norton" typo.
 * - Extracts the primary manager name from compound entries like "Jay Norton Adam Young".
 */
const normalizeManagerName = (name: string): string => {
    if (!name) return '';
    let normalized = name.trim();

    // Correct the specific typo first.
    normalized = normalized.replace(/nortor/ig, 'Norton');
    
    // If the name seems to be a combination of the manager and contact,
    // and we recognize the manager's name, extract it.
    if (normalized.toLowerCase().startsWith('jay norton')) {
        return 'Jay Norton';
    }

    return normalized;
};


export const parseCallLogs = (data: any[][]): CallLog[] => {
    return data
        .map((row, index): CallLog | null => {
            const schoolName = row[0] || '';
            const excelRowIndex = index + 2;
            if (!schoolName) return null; 

            const contact = String(row[4] || '');
            return {
                schoolName: schoolName,
                location: String(row[1] || ''),
                phoneNumber: String(row[2] || ''),
                accountManager: normalizeManagerName(String(row[3] || '')),
                contactCalled: contact,
                coverManager: contact,
                dateCalled: formatExcelDateTimeUK(row[5]),
                spokeToCoverManager: row[6] === true || String(row[6]).toLowerCase() === 'true',
                duration: formatExcelDuration(row[7]),
                notes: String(row[8] || ''),
                transcript: row[9] ? String(row[9]) : undefined,
                excelRowIndex: excelRowIndex,
            };
        })
        .filter((log): log is CallLog => log !== null && !!log.schoolName && !!log.dateCalled);
};

export const parseUsers = (data: any[][]): User[] => {
    return data
        .map(row => ({
            firstName: (row[0] || '').trim(),
            lastName: (row[1] || '').trim(),
            email: (row[2] || '').trim().toLowerCase(),
            name: `${(row[0] || '').trim()} ${(row[1] || '').trim()}`.trim(),
            mobileNumber: row[3] ? String(row[3]) : undefined,
            address: row[4] ? String(row[4]) : undefined,
            lastSeen: row[5] ? String(row[5]) : undefined,
            status: row[6] ? String(row[6]) as User['status'] : 'Offline',
        }))
        .filter(user => user.email); // Filter out empty rows
};

export const parseCandidates = (data: any[][]): Candidate[] => {
    return data
        .map((row, index): Candidate | null => {
            const name = String(row[1] || '');
            if (!name) return null;

            const parseBool = (val: any) => val === true || String(val).toLowerCase() === 'true';

            return {
                id: String(row[0] || ''),
                name: name,
                dob: formatDateUK(row[2]),
                location: String(row[3] || ''),
                drives: parseBool(row[4]),
                willingToTravelMiles: row[5] ? parseInt(String(row[5]), 10) : undefined,
                email: String(row[6] || ''),
                phone: String(row[7] || ''),
                dbs: parseBool(row[8]),
                onUpdateService: parseBool(row[9]),
                dbsCertificateUrl: String(row[10] || ''),
                cvUrl: String(row[11] || ''),
                availability: {
                    monday: parseBool(row[12]),
                    tuesday: parseBool(row[13]),
                    wednesday: parseBool(row[14]),
                    thursday: parseBool(row[15]),
                    friday: parseBool(row[16]),
                },
                notes: String(row[17] || ''),
                excelRowIndex: index + 2,
            };
        })
        .filter((candidate): candidate is Candidate => candidate !== null);
};

export const parseOpportunities = (data: any[][]): Opportunity[] => {
    return data
        .map((row, index) => {
            if (!row || (!row[0] && !row[1])) return null;

            // An old format row has data in the account manager column (G). A new/migrated row will have it empty.
            const isOldFormat = row.length > 6 && row[6] && String(row[6]).trim() !== ''; 

            let name: string, schoolName: string, progressStage: any, accountManager: string, dateCreated: any, notesJson: any;

            if (isOldFormat) {
                // Old format mapping: A:name, B:school, C:stage, G:manager, H:date, J:notes
                name = String(row[0] || '');
                schoolName = String(row[1] || '');
                progressStage = row[2];
                accountManager = normalizeManagerName(String(row[6] || ''));
                dateCreated = row[7];
                notesJson = row[9];
            } else {
                // New/migrated format mapping: A:name, B:school, C:stage, D:manager, E:date, F:notes
                name = String(row[0] || '');
                schoolName = String(row[1] || '');
                progressStage = row[2];
                accountManager = normalizeManagerName(String(row[3] || ''));
                dateCreated = row[4];
                notesJson = row[5];
            }
            
            let notes: OpportunityNote[] = [];
            if (notesJson && typeof notesJson === 'string' && notesJson.trim().startsWith('[')) {
                try {
                    const parsedNotes = JSON.parse(notesJson);
                    if (Array.isArray(parsedNotes)) {
                        notes = parsedNotes;
                    }
                } catch (e) {
                    console.warn(`Could not parse notes JSON for opportunity at row ${index + 2}:`, notesJson);
                }
            }

            const opp: Opportunity = {
                id: String(index + 2),
                name: name,
                schoolName: schoolName,
                progressStage: progressStage || '5% - Opportunity identified',
                accountManager: accountManager,
                dateCreated: formatExcelDateTimeUK(dateCreated),
                notes: notes,
                excelRowIndex: index + 2,
            };
            
            return opp;
        })
        .filter((opp): opp is Opportunity => !!(opp && opp.name && opp.schoolName));
};

// A temporary type used internally by the parsers to link attachments to templates.
type ParsedAttachment = (ManualAttachment | SharePointAttachment) & { templateId: string };

/**
 * Parses rows from the new `EmailTemplateAttachments` worksheet.
 */
export const parseEmailTemplateAttachments = (data: any[][]): ParsedAttachment[] => {
    return data
        .map((row, index): ParsedAttachment | null => {
            const templateId = row[0];
            if (!templateId) return null; // Skip if no linking ID

            const type = row[1];
            if (type === 'sharepoint') {
                return {
                    templateId,
                    type: 'sharepoint',
                    name: row[2] || '',
                    contentType: row[3] || '',
                    fileId: row[4] || '',
                    driveId: row[5] || '',
                    excelRowIndex: index + 2,
                };
            }
            if (type === 'manual') {
                return {
                    templateId,
                    type: 'manual',
                    name: row[2] || '',
                    contentType: row[3] || '',
                    contentBytes: row[6] || '',
                    excelRowIndex: index + 2,
                };
            }
            return null;
        })
        .filter((att): att is ParsedAttachment => att !== null);
};

/**
 * Parses email templates, merging attachments from both the new normalized sheet
 * and the legacy JSON column for backward compatibility.
 */
export const parseEmailTemplates = (
    templatesData: any[][],
    parsedAttachments: ParsedAttachment[]
): EmailTemplate[] => {
    // Group normalized attachments by their template ID for efficient lookup.
    const attachmentsByTemplateId = new Map<string, (ManualAttachment | SharePointAttachment)[]>();
    parsedAttachments.forEach(att => {
        const { templateId, ...rest } = att;
        if (!attachmentsByTemplateId.has(templateId)) {
            attachmentsByTemplateId.set(templateId, []);
        }
        attachmentsByTemplateId.get(templateId)!.push(rest as ManualAttachment | SharePointAttachment);
    });

    return templatesData
        .map((row, index): EmailTemplate | null => {
            const id = row[0] || '';
            if (!id) return null; // Skip empty rows

            // Handle legacy attachments stored as a JSON string for backward compatibility.
            let legacyAttachments: (ManualAttachment | SharePointAttachment)[] = [];
            try {
                if (row[4] && typeof row[4] === 'string' && row[4].trim().startsWith('[')) {
                    const rawAttachments = JSON.parse(row[4]);
                    if (Array.isArray(rawAttachments)) {
                        legacyAttachments = rawAttachments.map((att: any) => {
                             // Handle old "compacted" array format
                            if (Array.isArray(att) && att[0] === 'sp') {
                                return {
                                    type: 'sharepoint', driveId: att[1], fileId: att[2], name: att[3], contentType: att[4],
                                } as SharePointAttachment;
                            }
                            // Handle old object format
                            if (typeof att === 'object' && att !== null && att.type) {
                                return att;
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }
            } catch (e) {
                console.error(`Failed to parse legacy attachments for template ID ${id}:`, e);
            }

            const newAttachments = attachmentsByTemplateId.get(id) || [];
            
            return {
                id: id,
                name: row[1] || '',
                subject: row[2] || '',
                body: row[3] || '',
                attachments: [...legacyAttachments, ...newAttachments],
                excelRowIndex: index + 2,
            };
        })
        .filter((template): template is EmailTemplate => template !== null);
};

export const parseAnnouncements = (data: any[][]): Announcement[] => {
    return data
        .map((row): Announcement | null => {
            const author = row[0] || 'Admin';
            const title = row[1] || 'Announcement';
            const message = row[2] || '';
            const createdAtRaw = row[3];
            const createdAt = formatExcelDateTimeUK(createdAtRaw);
            
            if (!createdAt || !author || !message) return null;

            // Generate a unique ID from the content to handle acknowledgements
            const id = `${author}-${createdAtRaw}-${title}`;

            return {
                id,
                author,
                createdAt,
                title,
                message,
            };
        })
        .filter((ann): ann is Announcement => ann !== null)
        .sort((a, b) => (parseUKDateTimeString(b.createdAt)?.getTime() || 0) - (parseUKDateTimeString(a.createdAt)?.getTime() || 0)); // Sort descending
};

export const parseBookings = (data: any[][]): Booking[] => {
    return data
        .map((row, index): Booking | null => {
            if (!row[0] || !row[2]) return null; // Must have school and candidate name

            const amendmentsString = String(row[16] || '');
            let parsedAmendments: Record<string, BookingAmendment> | undefined = undefined;
            try {
                if (amendmentsString && amendmentsString.trim().startsWith('{')) {
                    parsedAmendments = JSON.parse(amendmentsString);
                }
            } catch (e) {
                console.warn(`Could not parse amendments JSON for booking at row ${index + 2}:`, amendmentsString);
            }

            return {
                schoolName: String(row[0]), // A
                schoolId: String(row[1] || ''), // B
                candidateName: String(row[2]), // C
                candidateId: String(row[3] || ''), // D
                durationDays: parseInt(String(row[4] || '0'), 10), // E
                schoolHourlyRate: parseFloat(String(row[5] || '0')), // F
                candidateHourlyRate: parseFloat(String(row[6] || '0')), // G
                schoolDailyRate: parseFloat(String(row[7] || '0')), // H
                candidateDailyRate: parseFloat(String(row[8] || '0')), // I
                hourlyProfit: parseFloat(String(row[9] || '0')), // J
                dailyProfit: parseFloat(String(row[10] || '0')), // K
                schoolWeekCharge: parseFloat(String(row[11] || '0')), // L
                candidateWeekCharge: parseFloat(String(row[12] || '0')), // M
                weekProfit: parseFloat(String(row[13] || '0')), // N
                totalSchoolCharge: parseFloat(String(row[14] || '0')), // O
                totalCandidateCharge: parseFloat(String(row[15] || '0')), // P
                amendments: amendmentsString, // Q
                totalProfit: parseFloat(String(row[17] || '0')), // R
                startDate: formatDateUK(row[18]), // S
                id: String(row[19] || `booking_${index + 2}`), // T
                accountManager: String(row[20] || ''), // U
                excelRowIndex: index + 2,
                parsedAmendments,
            };
        })
        .filter((booking): booking is Booking => booking !== null);
};

export const parseJobAlerts = (data: any[][]): JobAlert[] => {
    return data
        .map((row, index): JobAlert | null => {
            if (!row || !row[1] || !row[2]) return null; // School name and job title are required
            return {
                schoolId: String(row[0] || ''),
                schoolName: String(row[1] || ''),
                jobTitle: String(row[2] || ''),
                subject: String(row[3] || ''),
                salary: String(row[4] || ''),
                closeDate: formatDateUK(row[5]),
                location: String(row[6] || ''),
                jobDescription: String(row[7] || ''),
                sourceUrl: String(row[8] || ''),
                notes: '', // Notes are no longer parsed from the spreadsheet
                excelRowIndex: index + 2,
            };
        })
        .filter((job): job is JobAlert => job !== null);
};


export const stripHtml = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

export const parseDurationToSeconds = (durationStr: string | undefined | null): number => {
    if (!durationStr) return 0;
    const durationString = String(durationStr).trim();

    // Handle "m:ss" format (e.g., "2:07")
    const timeParts = durationString.split(':');
    if (timeParts.length === 2) {
        const minutes = parseInt(timeParts[0], 10);
        const seconds = parseInt(timeParts[1], 10);
        if (!isNaN(minutes) && !isNaN(seconds)) {
            return (minutes * 60) + seconds;
        }
    }
    
    // Fallback for old formats like "Xm Ys" or just numbers as minutes
    let totalSeconds = 0;
    const minMatch = durationString.match(/(\d+)\s*m/);
    const secMatch = durationString.match(/(\d+)\s*s/);
    
    if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
    if (secMatch) totalSeconds += parseInt(secMatch[1], 10);
    
    if (totalSeconds > 0) return totalSeconds;
    
    // If no units matched and it's just a number, parse as minutes for backward compatibility.
    const minutesOnly = parseInt(durationString, 10);
    if (!isNaN(minutesOnly)) {
        return minutesOnly * 60;
    }
    
    return 0;
};

export const parseUKDateTime = (dateStr?: string, timeStr?: string): Date | null => {
    const date = parseUKDate(dateStr);
    if (!date) return null;

    if (timeStr) {
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            if (!isNaN(hours) && !isNaN(minutes)) {
                date.setHours(hours, minutes, 0, 0);
            }
        }
    }
    return date;
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is in format "data:mime/type;base64,the-real-base64-string"
            // We only want the part after the comma
            const result = (reader.result as string).split(',')[1];
            if (result) {
                resolve(result);
            } else {
                reject(new Error("Could not read file as base64."));
            }
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * A utility function to wrap an asynchronous write operation with a retry mechanism
 * for common Excel file lock errors.
 */
export const resilientWrite = async <T>(
    writeFunction: () => Promise<T>,
    onFinalFailure: (error: Error) => void
): Promise<T | null> => {
    const RETRY_DELAYS = [10000, 20000, 30000]; // 10s, 20s, 30s
    let lastError: Error = new Error('Write operation failed after all retries.');

    for (let i = 0; i <= RETRY_DELAYS.length; i++) {
        try {
            return await writeFunction();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error.message?.toLowerCase() || '';
            const isLockError = errorMessage.includes('resourcelocked') ||
                                errorMessage.includes('editconflict') ||
                                errorMessage.includes('workbookbusy');

            if (isLockError && i < RETRY_DELAYS.length) {
                console.warn(`Write failed due to lock. Retrying in ${RETRY_DELAYS[i] / 1000}s... (Attempt ${i + 1})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[i]));
            } else {
                console.error('Final write attempt failed or a non-retryable error occurred:', error);
                onFinalFailure(lastError);
                return null;
            }
        }
    }
    onFinalFailure(lastError);
    return null;
};

export const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export const getInitialsColor = (name: string): string => {
    const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
    if (!name) return colors[0];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
};

export const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};
