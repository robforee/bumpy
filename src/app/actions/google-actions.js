// src/app/actions/google-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { google } from 'googleapis';
import { ensureFreshTokens } from './auth-actions';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

export async function queryGmailInbox(idToken) {

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
        const { accessToken } = await ensureFreshTokens(idToken);

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
        });

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

