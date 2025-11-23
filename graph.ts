import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from './authConfig';
import { ManualAttachment, SharePointAttachment } from './types';
import { parseJobAlerts } from './utils';

// The direct sharing link to the Excel file in SharePoint.
const SHARING_URL = "https://netorgft15399869.sharepoint.com/:x:/s/edutalentconnect.com/EYQUNSMsgr5KrFVmWwxXY7IBYv491n9GoLcFu7jpzk29jQ?e=LxiuZk";

/**
 * Acquires an access token from MSAL.
 */
// FIX: Export getAccessToken to make it available for use in other modules.
export async function getAccessToken(msalInstance: PublicClientApplication, account: AccountInfo): Promise<string> {
    const request = { ...loginRequest, account: account };
    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // FIX: Corrected typo from 'msinthtance' to 'msalInstance'.
            const response = await msalInstance.acquireTokenPopup(request);
            return response.accessToken;
        } else {
            console.error("MSAL access token error:", error);
            throw new Error("Could not acquire access token.");
        }
    }
}

// Helper to make a generic Graph API call
async function graphApiCall(accessToken: string, url: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: any) {
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Graph API call failed for ${method} ${url}:`, errorData);
        throw new Error(`Graph API call failed. Server said: ${errorData.error?.message || response.statusText}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    return response.json();
}

/**
 * Converts the sharing URL into a permanent, direct API path for the workbook.
 * This is the most robust method for locating a file in SharePoint.
 * The internal cache has been removed to ensure the link is resolved fresh on every data load.
 */
// FIX: Export getWorkbookPath to make it available for use in other modules.
export async function getWorkbookPath(accessToken: string): Promise<string> {
    try {
        // 1. Encode the sharing URL into a special format for the Graph API.
        const base64Url = btoa(SHARING_URL);
        const encodedUrl = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const apiUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem?$select=id,parentReference`;

        // 2. Call the Graph API to get the file's unique drive and item IDs.
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Graph API error resolving sharing link:", errorData);
            throw new Error(`Could not find the Excel file using the sharing link. Server said: ${errorData.error?.message || 'Unknown error'}`);
        }

        const driveItem = await response.json();

        // 3. Ensure the response from Microsoft contains the necessary IDs.
        if (!driveItem.parentReference?.driveId || !driveItem.id) {
            throw new Error("The API response for the sharing link was invalid and did not contain the necessary IDs.");
        }
        
        // 4. Construct the permanent base path for all future workbook API calls.
        const path = `/drives/${driveItem.parentReference.driveId}/items/${driveItem.id}/workbook`;
        return path;

    } catch (error) {
        console.error("Critical error in getWorkbookPath:", error);
        throw error; // Re-throw the error to be displayed to the user.
    }
}


/**
 * Returns a map of worksheet names that MUST EXACTLY match the tab names in your Excel file.
 */
export const getWorksheetMap = () => {
    return {
        schools: 'Schools',
        tasks: 'Task',
        notes: 'Notes',
        emails: 'Email',
        callLogs: 'Call Log',
        users: 'Users',
        candidates: 'Candidates',
        opportunities: 'Opportunities',
        emailTemplates: 'EmailTemplates',
        emailTemplateAttachments: 'EmailTemplateAttachments',
        announcements: 'Announcements',
        bookings: 'Bookings',
        jobAlerts: 'Jobs',
    };
};

/**
 * Fetches all data from the specified worksheets in the Excel file using a single batch request.
 */
export async function getAllCRMData(msalInstance: PublicClientApplication, account: AccountInfo, worksheetMap: ReturnType<typeof getWorksheetMap>) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const headers = { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };
    
    const sheetRanges: { [key: string]: string } = {
        schools: 'A1:N5000', // Updated to N to include Status
        tasks: 'A1:N5000',
        notes: 'A1:F5000',
        emails: 'A1:F5000',
        callLogs: 'A1:J5000',
        users: 'A1:G100',
        candidates: 'A1:R5000',
        opportunities: 'A1:J5000',
        emailTemplates: 'A1:E500',
        emailTemplateAttachments: 'A1:G5000',
        announcements: 'A1:E500',
        bookings: 'A1:U5000',
        jobAlerts: 'A1:I2000',
    };

    // 1. Construct the batch request payload
    const batchRequests = Object.entries(worksheetMap).map(([key, worksheetName]) => {
        const range = sheetRanges[key];
        if (!worksheetName || !range) return null;

        return {
            id: key, // Use the key as the unique ID for the request
            method: "GET",
            url: `${workbookPath}/worksheets('${worksheetName}')/range(address='${range}')?$select=values`,
            headers: {
                'Cache-Control': 'no-store'
            }
        };
    }).filter(Boolean);

    if (batchRequests.length === 0) {
        return {};
    }

    const batchRequestBody = {
        requests: batchRequests
    };

    // 2. Make the single batch request
    const batchUrl = 'https://graph.microsoft.com/v1.0/$batch';
    const batchResponse = await fetch(batchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(batchRequestBody)
    });

    if (!batchResponse.ok) {
        const errorData = await batchResponse.json().catch(() => ({}));
        console.error("Graph API batch request failed:", errorData);
        throw new Error(`Could not fetch CRM data. The batch request failed. Server said: ${errorData.error?.message || 'Unknown error'}`);
    }

    const batchResult = await batchResponse.json();
    const crmData: { [key: string]: any[][] } = {};
    const worksheetKeys = Object.keys(worksheetMap);
    
    // Initialize crmData with empty arrays for all expected keys
    for (const key of worksheetKeys) {
        crmData[key] = [];
    }

    // 3. Parse the batch response
    for (const response of batchResult.responses) {
        const key = response.id;
        if (response.status === 200) {
            const data = response.body;
             // The first row is the header, so we slice it off.
            crmData[key] = (data.values && data.values.length > 1) ? data.values.slice(1) : [];
        } else {
            console.warn(`Batch request for worksheet '${worksheetMap[key as keyof typeof worksheetMap]}' failed with status ${response.status}.`, response.body);
            // crmData[key] will remain an empty array, so the app doesn't crash
        }
    }

    return crmData;
}


/**
 * Fetches the user's primary email and all associated aliases.
 */
export async function getUserProfile(msalInstance: PublicClientApplication, account: AccountInfo) {
    const accessToken = await getAccessToken(msalInstance, account);
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const url = "https://graph.microsoft.com/v1.0/me?$select=mail,proxyAddresses,userPrincipalName";
    
    try {
        const response = await fetch(url, { headers });
        if (response.ok) {
            return await response.json();
        }
        console.error('Failed to fetch user profile', await response.json());
        return null;
    } catch (error) {
        console.error('Exception fetching user profile:', error);
        return null;
    }
}

/**
 * Helper function to fetch emails from a specific folder with pagination.
 */
async function fetchEmailsFromFolder(accessToken: string, folderId: string, orderBy: 'receivedDateTime' | 'sentDateTime'): Promise<any[]> {
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    let allEmails: any[] = [];
    let nextLink: string | undefined = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages?$top=999&$orderby=${orderBy} desc&$select=id,sentDateTime,receivedDateTime,subject,body,toRecipients,ccRecipients,from`;

    // Increased page fetch to 5 to improve email sync history.
    const maxPagesToFetch = 5;
    let pagesFetched = 0;

    try {
        while (nextLink && pagesFetched < maxPagesToFetch) {
            const response = await fetch(nextLink, { headers });
            pagesFetched++;

            if (response.ok) {
                const data = await response.json();
                if (data.value) {
                    allEmails = allEmails.concat(data.value);
                }
                nextLink = data['@odata.nextLink'];
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Could not fetch user emails from ${folderId}. Status: ${response.status}`, errorData);
                break;
            }
        }
        return allEmails;
    } catch (error) {
        console.error(`Exception fetching user emails from ${folderId}:`, error);
        return [];
    }
}

/**
 * Fetches recent emails from the user's mailbox, including subfolders of the Inbox.
 */
export async function getUserEmails(msalInstance: PublicClientApplication, account: AccountInfo) {
    const accessToken = await getAccessToken(msalInstance, account);
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const allFolderIds: string[] = [];
    
    const getChildFolderIds = async (folderId: string) => {
        allFolderIds.push(folderId);
        let childFolderUrl: string | undefined = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/childFolders?$select=id`;
        
        while (childFolderUrl) {
            try {
                const response = await fetch(childFolderUrl, { headers });
                if (!response.ok) break;
                const data = await response.json();
                for (const child of data.value) {
                    await getChildFolderIds(child.id);
                }
                childFolderUrl = data['@odata.nextLink'];
            } catch (e) {
                console.error("Error fetching child folders for", folderId, e);
                break;
            }
        }
    };
    
    try {
        const topLevelFoldersResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$select=id,displayName', { headers });
        if (!topLevelFoldersResponse.ok) throw new Error("Could not fetch top-level mail folders.");
        const topLevelFolders = await topLevelFoldersResponse.json();

        const inboxFolder = topLevelFolders.value.find((f: any) => f.displayName.toLowerCase() === 'inbox');
        const sentItemsFolder = topLevelFolders.value.find((f: any) => f.displayName.toLowerCase() === 'sent items');

        if (inboxFolder) {
            await getChildFolderIds(inboxFolder.id);
        } else {
             await getChildFolderIds('inbox');
        }

        if (sentItemsFolder) {
            allFolderIds.push(sentItemsFolder.id);
        } else {
            allFolderIds.push('sentitems');
        }

        const uniqueFolderIds = [...new Set(allFolderIds)];
        console.log("Syncing emails from folders:", uniqueFolderIds);

        const emailPromises = uniqueFolderIds.map(folderId => 
            fetchEmailsFromFolder(accessToken, folderId, (folderId === 'sentitems' || (sentItemsFolder && folderId === sentItemsFolder.id)) ? 'sentDateTime' : 'receivedDateTime')
        );

        const emailArrays = await Promise.all(emailPromises);
        const allEmails = emailArrays.flat();
        
        return Array.from(new Map(allEmails.map(email => [email.id, email])).values());

    } catch (error) {
        console.error(`Exception fetching user emails comprehensively:`, error);
        // Fallback to old, simpler behavior if the new logic fails for any reason
        const [sentEmails, inboxEmails] = await Promise.all([
            fetchEmailsFromFolder(accessToken, 'sentitems', 'sentDateTime'),
            fetchEmailsFromFolder(accessToken, 'inbox', 'receivedDateTime')
        ]);
        return [...sentEmails, ...inboxEmails];
    }
}

// Helper to convert a Blob to a base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = (reader.result as string).split(',')[1];
            if (result) {
                resolve(result);
            } else {
                reject(new Error("Could not convert blob to base64."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// FIX: Added missing function to get SharePoint file content.
export async function getDriveItemContentAsBlob(msalInstance: PublicClientApplication, account: AccountInfo, driveId: string, itemId: string): Promise<Blob> {
    const accessToken = await getAccessToken(msalInstance, account);
    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Could not fetch file content. Server said: ${error.error?.message}`);
    }
    return response.blob();
}

// FIX: Added missing function to list SharePoint drive items.
export async function listDriveItems(msalInstance: PublicClientApplication, account: AccountInfo, itemId?: string): Promise<any[]> {
    const accessToken = await getAccessToken(msalInstance, account);
    const folderPath = itemId ? `/items/${itemId}/children` : '/root/children';
    // Select additional properties like size for the file picker UI.
    const url = `https://graph.microsoft.com/v1.0/me/drive${folderPath}?$select=id,name,folder,file,size,parentReference,lastModifiedDateTime`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Could not list drive items. Server said: ${error.error?.message}`);
    }
    const data = await response.json();
    return data.value || [];
}


/**
 * Resolves a SharePoint sharing URL to its drive and item IDs.
 */
async function getDriveItemBySharingUrl(accessToken: string, sharingUrl: string): Promise<{ driveId: string, itemId: string } | null> {
    try {
        const base64Url = btoa(sharingUrl);
        const encodedUrl = base64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const apiUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem?$select=id,parentReference`;
        
        const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (!response.ok) {
            console.warn(`Could not resolve sharing URL via Graph. Status: ${response.status}`, await response.text());
            return null;
        }

        const driveItem = await response.json();
        if (!driveItem.parentReference?.driveId || !driveItem.id) {
            console.warn("Resolved drive item from URL is missing necessary IDs.");
            return null;
        }
        
        return { driveId: driveItem.parentReference.driveId, itemId: driveItem.id };
    } catch (e) {
        console.error("Error resolving sharing URL:", e);
        return null;
    }
}

/**
 * Scans email HTML, finds a SharePoint-hosted image, and returns an updated HTML body
 * with a CID link and the corresponding inline attachment payload for Graph API.
 */
async function processHtmlForInlineSignature(
    msalInstance: PublicClientApplication,
    account: AccountInfo,
    bodyHtml: string
): Promise<{ newBodyHtml: string; inlineAttachment: any | null; }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyHtml, 'text/html');
    
    // Find the first image hosted on SharePoint.
    const signatureImg = doc.querySelector('img[src*="sharepoint.com"]');
    if (!signatureImg) {
        return { newBodyHtml: bodyHtml, inlineAttachment: null };
    }

    const originalUrl = signatureImg.getAttribute('src');
    if (!originalUrl) {
         return { newBodyHtml: bodyHtml, inlineAttachment: null };
    }

    try {
        const accessToken = await getAccessToken(msalInstance, account);
        const driveItemInfo = await getDriveItemBySharingUrl(accessToken, originalUrl);

        if (!driveItemInfo) {
            console.warn("Could not resolve signature image URL to a drive item:", originalUrl);
            return { newBodyHtml: bodyHtml, inlineAttachment: null };
        }

        const blob = await getDriveItemContentAsBlob(msalInstance, account, driveItemInfo.driveId, driveItemInfo.itemId);
        
        if (blob.size > 3 * 1024 * 1024) {
            console.warn(`Signature image is large (${(blob.size / 1024 / 1024).toFixed(2)} MB). Consider compressing it.`);
        }

        const contentBytes = await blobToBase64(blob);
        const contentId = 'sig-logo-1'; // A unique identifier for the inline content.

        signatureImg.setAttribute('src', `cid:${contentId}`);
        const newBodyHtml = doc.body.innerHTML; // Use innerHTML to avoid full document structure.

        const inlineAttachment = {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'signature.png',
            contentType: blob.type || 'image/png',
            isInline: true,
            contentId: contentId,
            contentBytes: contentBytes,
        };
        
        return { newBodyHtml, inlineAttachment };

    } catch (error) {
        console.error("Failed to process inline signature image:", error);
        // Fallback to original body if anything fails.
        return { newBodyHtml: bodyHtml, inlineAttachment: null };
    }
}

// FIX: Added missing functions for CRUD operations on the Excel file.

// Helper to get the last used row in a worksheet to append new data.
async function getLastUsedRow(accessToken: string, workbookPath: string, worksheetName: string): Promise<number> {
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/usedRange(valuesOnly=true)?$select=rowCount`;
    try {
        const response = await graphApiCall(accessToken, url, 'GET');
        // If the sheet is empty, usedRange can return an error or empty object. Default to 0.
        return response?.rowCount || 0;
    } catch (e) {
        console.warn(`Could not get used range for ${worksheetName}, assuming it's empty.`, e);
        return 0; // If sheet is empty, it might error.
    }
}

// Generic function to add a new row to a sheet.
async function addRowToSheet(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const lastRow = await getLastUsedRow(accessToken, workbookPath, worksheetName);
    const newRowIndex = lastRow + 1;
    const endColumn = String.fromCharCode('A'.charCodeAt(0) + values.length - 1);
    const rangeAddress = `A${newRowIndex}:${endColumn}${newRowIndex}`;
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${rangeAddress}')`;
    const body = { values: [values] };
    const result = await graphApiCall(accessToken, url, 'PATCH', body);
    return { ...result, excelRowIndex: newRowIndex };
}

// Generic function to update a row in a sheet.
async function updateRowInSheet(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const endColumn = String.fromCharCode('A'.charCodeAt(0) + values.length - 1);
    const rangeAddress = `A${rowIndex}:${endColumn}${rowIndex}`;
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${rangeAddress}')`;
    const body = { values: [values] };
    return await graphApiCall(accessToken, url, 'PATCH', body);
}

// Generic function to delete a row from a sheet.
async function deleteRowFromSheet(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const rangeAddress = `${rowIndex}:${rowIndex}`;
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${rangeAddress}')/delete`;
    const body = { shift: 'Up' };
    const apiResult = await graphApiCall(accessToken, url, 'POST', body);
    // The delete API returns 204 No Content, which graphApiCall translates to `null`.
    // We'll return a success marker to make it easier to handle in the calling code.
    if (apiResult === null) {
        return { success: true };
    }
    // This case shouldn't be reached for a successful delete, but included for robustness.
    return apiResult;
}

// --- Add Functions ---
export const addSchool = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addCallLog = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addNote = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addTask = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addEmail = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addOpportunity = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addEmailTemplate = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addEmailTemplateAttachment = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addAnnouncement = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addBooking = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addCandidate = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);
export const addJobAlert = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, values: any[]) => addRowToSheet(msalInstance, account, worksheetName, values);

// --- Update Functions ---
export const updateTask = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateSchool = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateNote = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateOpportunity = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateEmailTemplate = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateCallLog = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateBooking = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);
export const updateCandidate = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, values: any[]) => updateRowInSheet(msalInstance, account, worksheetName, rowIndex, values);


// --- Delete Functions ---
export const deleteTask = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteNote = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteOpportunity = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteCallLog = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteEmailTemplate = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteEmailTemplateAttachment = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
export const deleteBooking = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);
// FIX: Export the deleteJobAlert function to resolve the import error in App.tsx.
export const deleteJobAlert = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number) => deleteRowFromSheet(msalInstance, account, worksheetName, rowIndex);


// --- Specific Update Functions ---
export async function updateSpokenToCoverManagerStatus(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, status: boolean) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const cellAddress = `I${rowIndex}`; // Column I for 'spokeToCoverManager' in 'Schools' sheet
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${cellAddress}')`;
    const body = { values: [[status]] };
    return await graphApiCall(accessToken, url, 'PATCH', body);
}

export async function updateOpportunityNotes(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, notesJson: string) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const cellAddress = `F${rowIndex}`; // Column F for notes in 'Opportunities' sheet
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${cellAddress}')`;
    const body = { values: [[notesJson]] };
    return await graphApiCall(accessToken, url, 'PATCH', body);
}

export async function updateCallLogTranscript(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string, rowIndex: number, transcript: string) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const cellAddress = `J${rowIndex}`; // Column J for transcript in 'Call Log' sheet
    const url = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${cellAddress}')`;
    const body = { values: [[transcript]] };
    return await graphApiCall(accessToken, url, 'PATCH', body);
}

// --- Functions to clear entire sheets (leaving header) ---
async function clearSheet(msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string) {
    const accessToken = await getAccessToken(msalInstance, account);
    const workbookPath = await getWorkbookPath(accessToken);
    const usedRangeUrl = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/usedRange(valuesOnly=true)`;
    const usedRange = await graphApiCall(accessToken, usedRangeUrl, 'GET');
    if (usedRange.rowCount <= 1) return null; // Sheet is empty or only has header
    
    const address = usedRange.address.split('!')[1];
    const firstRow = parseInt((address.match(/^\D+(\d+)/) || ['','1'])[1], 10);
    const lastRow = firstRow + usedRange.rowCount - 1;
    
    // Calculate the address to clear, from the second row to the last used row.
    const startColumn = (address.match(/^(\D+)/) || ['','A'])[1];
    const endColumn = (address.match(/(\D+)\d+$/) || ['','A'])[1];
    const rangeToClearAddress = `${startColumn}${firstRow + 1}:${endColumn}${lastRow}`;

    const clearUrl = `https://graph.microsoft.com/v1.0${workbookPath}/worksheets('${worksheetName}')/range(address='${rangeToClearAddress}')/clear`;
    return await graphApiCall(accessToken, clearUrl, 'POST', { applyTo: 'Contents' });
}
export const clearAllEmailTemplates = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string) => clearSheet(msalInstance, account, worksheetName);
export const clearAllEmailTemplateAttachments = (msalInstance: PublicClientApplication, account: AccountInfo, worksheetName: string) => clearSheet(msalInstance, account, worksheetName);

export async function createShareLink(msalInstance: PublicClientApplication, account: AccountInfo, driveId: string, itemId: string): Promise<string | null> {
    const accessToken = await getAccessToken(msalInstance, account);
    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/createLink`;
    const body = {
        type: "view",
        scope: "organization"
    };
    try {
        const response = await graphApiCall(accessToken, url, 'POST', body);
        return response?.link?.webUrl || null;
    } catch (error) {
        console.error("Failed to create share link:", error);
        return null;
    }
}

// --- Send Email Functionality ---
export async function sendEmail(msalInstance: PublicClientApplication, account: AccountInfo, to: string, subject: string, body: string, attachments: (ManualAttachment | SharePointAttachment)[]) {
    const accessToken = await getAccessToken(msalInstance, account);

    const { newBodyHtml, inlineAttachment } = await processHtmlForInlineSignature(msalInstance, account, body);

    const attachmentPayloads: any[] = [];
    if (inlineAttachment) {
        attachmentPayloads.push(inlineAttachment);
    }
    
    for (const att of attachments) {
        let contentBytes = '';
        if (att.type === 'manual') {
            contentBytes = att.contentBytes;
        } else if (att.type === 'sharepoint') {
            const blob = await getDriveItemContentAsBlob(msalInstance, account, att.driveId, att.fileId);
            contentBytes = await blobToBase64(blob);
        }

        if (contentBytes) {
            attachmentPayloads.push({
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: att.name,
                contentType: att.contentType,
                contentBytes: contentBytes
            });
        }
    }
    
    const emailPayload = {
        message: {
            subject: subject,
            body: {
                contentType: 'HTML',
                content: newBodyHtml
            },
            toRecipients: [{
                emailAddress: {
                    address: to
                }
            }],
            attachments: attachmentPayloads
        },
        saveToSentItems: 'true'
    };

    const url = 'https://graph.microsoft.com/v1.0/me/sendMail';
    return await graphApiCall(accessToken, url, 'POST', emailPayload);
}
