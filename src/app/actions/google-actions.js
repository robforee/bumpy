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

export async function queryGmailInbox(userId,idToken) {

    try {
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            console.log( 'USER not authenticated ~~~~~~', currentUser )
            return [];
            throw new Error('User not authenticated');
        }else{
            console.log('USER AUTH authenticated ~~~~~~')
        }

        // Use ensureFreshTokens to get fresh tokens
        //const { scopes } = await getScopes_fromClient(userId, idToken);
        //const { accessToken } = await ensureFreshTokens(idToken,true);
        console.log('USER AUTH', userId,currentUser.displayName )
        //return [];


        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI            
        );
        // console.log(    process.env.GOOGLE_CLIENT_ID,
        //     process.env.GOOGLE_REDIRECT_URI)
        oauth2Client.setCredentials({ access_token: currentUser.accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
        });
        return [];

        const messages = response.data.messages || [];
        const messageDetails = await Promise.all(messages.map(async (message) => {
            const details = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From'],
            });

            const subject = details.data.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = details.data.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';

            return { id: message.id, subject, from };
        }));

        return messageDetails;

    } catch (error) {
        console.error('Error querying Gmail:', error);
        if (error.message === 'REAUTH_REQUIRED') {
            throw new Error('REAUTH_REQUIRED');
        }
        throw new Error('An error occurred while querying Gmail: ' + error.message);
    }
}

export async function queryRecentDriveFiles(idToken,config = {}) {
    try {
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Use ensureFreshTokens to get fresh tokens
        const { accessToken } = await ensureFreshTokens(idToken);

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Default query configuration
        const defaultConfig = {
            pageSize: 10,
            fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            orderBy: 'modifiedTime desc',
            q: "trashed = false"
        };

        // Merge default config with any provided config
        const queryConfig = { ...defaultConfig, ...config };

        const response = await drive.files.list(queryConfig);

        const files = response.data.files || [];

        return files.map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink
        }));

    } catch (error) {
        console.error('Error querying Drive files:', error);
        if (error.message === 'REAUTH_REQUIRED') {
            throw new Error('REAUTH_REQUIRED');
        }
        throw new Error('An error occurred while querying Drive files: ' + error.message);
    }
}

export async function queryGoogleCalendar(idToken) {
    try {
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
        
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Use ensureFreshTokens to get fresh tokens
        const { accessToken } = await ensureFreshTokens(idToken);

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: oneWeekFromNow.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        return events.map(event => ({
            id: event.id,
            summary: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
        }));

    } catch (error) {
        console.error('Error querying Google Calendar:', error);
        if (error.message === 'REAUTH_REQUIRED') {
            throw new Error('REAUTH_REQUIRED');
        }
        throw new Error('An error occurred while querying Google Calendar: ' + error.message);
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
