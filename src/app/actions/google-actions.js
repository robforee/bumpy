// src/app/actions/google-actions.js
"use server";

import { google } from 'googleapis';
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { ensureFreshTokens } from './auth-actions';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getScopes_fromClient } from './auth-actions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { decrypt } from './auth-actions';

export async function queryGmailInbox(userId, idToken) {
    try {
        console.log('Starting Gmail inbox query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }
        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
        const userTokensSnap = await getDoc(userTokensRef);

        if (!userTokensSnap.exists()) {
            console.log('No tokens found for user');
            return { success: false, error: 'No tokens found for user' };
        }
        console.log('Found tokens in Firestore');

        const tokens = userTokensSnap.data();
        
        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('Successfully decrypted access token');
            const authorizedScopes = tokens.authorizedScopes;
            console.log('Authorized scopes:', authorizedScopes);

            // Set up Gmail client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

            // Get messages from inbox
            console.log('Fetching messages from inbox...');
            const maxResults = 10;
            const messageList = await gmailClient.users.messages.list({
                userId: 'me',
                maxResults: maxResults,
                labelIds: ['INBOX']  // Only get messages from inbox
            });

            if (!messageList.data.messages) {
                console.log('No messages found in inbox');
                return { success: true, messages: [] };
            }
            console.log(`Found ${messageList.data.messages.length} messages`);

            // Get full message details
            const messages = [];
            for (const message of messageList.data.messages) {
                const fullMessage = await gmailClient.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full'
                });

                // Extract relevant message data
                const headers = fullMessage.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
                const from = headers.find(h => h.name === 'From')?.value || '';
                const date = headers.find(h => h.name === 'Date')?.value || '';
                const snippet = fullMessage.data.snippet || '';

                messages.push({
                    id: message.id,
                    threadId: message.threadId,
                    subject,
                    from,
                    date,
                    snippet
                });
            }
            console.log(`Successfully retrieved details for ${messages.length} messages`);

            return { success: true, messages };

        } catch (error) {
            console.error('Gmail API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Gmail API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryGmailInbox:', error);
        return { success: false, error: `Error in queryGmailInbox: ${error.message}` };
    }
}

export async function queryRecentDriveFiles(userId, idToken) {
    try {
        console.log('Starting Drive files query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }
        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
        const userTokensSnap = await getDoc(userTokensRef);

        if (!userTokensSnap.exists()) {
            console.log('No tokens found for user');
            return { success: false, error: 'No tokens found for user' };
        }
        console.log('Found tokens in Firestore');

        const tokens = userTokensSnap.data();
        
        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('Successfully decrypted access token');
            const authorizedScopes = tokens.authorizedScopes;
            console.log('Authorized scopes:', authorizedScopes);

            // Set up Drive client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const driveClient = google.drive({ version: 'v3', auth: oauth2Client });

            // Get recent files
            console.log('Fetching recent files...');
            const response = await driveClient.files.list({
                pageSize: 10,
                fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            if (!response.data.files) {
                console.log('No files found');
                return { success: true, files: [] };
            }
            console.log(`Found ${response.data.files.length} files`);

            return { success: true, files: response.data.files };

        } catch (error) {
            console.error('Drive API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Drive API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryRecentDriveFiles:', error);
        return { success: false, error: `Error in queryRecentDriveFiles: ${error.message}` };
    }
}

export async function queryGoogleCalendar(userId, idToken) {
    try {
        console.log('Starting Calendar events query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }
        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
        const userTokensSnap = await getDoc(userTokensRef);

        if (!userTokensSnap.exists()) {
            console.log('No tokens found for user');
            return { success: false, error: 'No tokens found for user' };
        }
        console.log('Found tokens in Firestore');

        const tokens = userTokensSnap.data();
        
        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('Successfully decrypted access token');
            const authorizedScopes = tokens.authorizedScopes;
            console.log('Authorized scopes:', authorizedScopes);

            // Set up Calendar client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const calendarClient = google.calendar({ version: 'v3', auth: oauth2Client });

            // Get upcoming events
            console.log('Fetching upcoming events...');
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const response = await calendarClient.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: oneWeekFromNow.toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime'
            });

            if (!response.data.items) {
                console.log('No events found');
                return { success: true, events: [] };
            }
            console.log(`Found ${response.data.items.length} events`);

            // Format events
            const events = response.data.items.map(event => ({
                id: event.id,
                summary: event.summary,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                description: event.description,
                htmlLink: event.htmlLink
            }));

            return { success: true, events };

        } catch (error) {
            console.error('Calendar API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Calendar API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryGoogleCalendar:', error);
        return { success: false, error: `Error in queryGoogleCalendar: ${error.message}` };
    }
}

export async function demoGmailToken(idToken) {
    const results = [];
    try {
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            const msg = 'User not authenticated';
            console.log(msg);
            results.push(msg);
            return results;
        }

        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const userTokensRef = doc(db, 'user_tokens', currentUser.uid);
        const userTokensSnap = await getDoc(userTokensRef);

        if (!userTokensSnap.exists()) {
            const msg = 'No tokens found for user';
            console.log(msg);
            results.push(msg);
            return results;
        }

        console.log('Found tokens in Firestore');
        const tokens = userTokensSnap.data();
        
        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('Successfully decrypted access token');
            const authorizedScopes = tokens.authorizedScopes;
            console.log('Authorized scopes:', authorizedScopes);

            // Set up Gmail client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

            // Get labels
            try {
                const labels = await gmailClient.users.labels.list({ userId: 'me' });
                const msg = `Success: Found ${labels.data.labels.length} labels`;
                console.log(msg);
                results.push(msg);
            } catch (error) {
                if (error.message.includes('invalid_grant')) {
                    const msg = 'Error: Invalid grant - token needs refresh';
                    console.error(msg);
                    results.push(msg);
                    return results;
                }
                throw error;
            }

            // Get message list
            const maxResults = 10;
            const messageList = await gmailClient.users.messages.list({
                userId: 'me',
                maxResults: maxResults
            });
            const msg = `Success: Found ${messageList.data.messages?.length || 0} messages`;
            console.log(msg);
            results.push(msg);

            // Get message bodies
            let messageCount = 0;
            for (const message of messageList.data.messages || []) {
                const fullMessage = await gmailClient.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full'
                });
                messageCount++;
            }
            const finalMsg = `Success: Retrieved ${messageCount} message bodies`;
            console.log(finalMsg);
            results.push(finalMsg);

        } catch (decryptError) {
            const msg = `Error decrypting token: ${decryptError.message}`;
            console.error(msg);
            results.push(msg);
            return results;
        }

        return results;

    } catch (error) {
        const errorMsg = `Error in demoGmailToken: ${error.message}`;
        console.error(errorMsg);
        results.push(errorMsg);
        return results;
    }
}
