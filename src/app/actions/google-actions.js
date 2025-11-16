// src/app/actions/google-actions.js
"use server";

import { google } from 'googleapis';
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { decrypt, encrypt } from './auth-actions';

/**
 * Helper function to get valid access token, refreshing if needed
 */
async function getValidAccessToken(db, currentUser, service, tokens) {
    const now = Date.now();
    const isExpired = tokens.expiresAt && tokens.expiresAt < now;

    console.log(`🔑 [getValidAccessToken] Token status for ${service}:`, {
        isExpired,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : 'unknown',
        hasRefreshToken: !!tokens.refreshToken
    });

    if (!isExpired) {
        // Token is still valid
        const accessToken = await decrypt(tokens.accessToken);
        return { accessToken, refreshed: false };
    }

    // Token expired - need to refresh
    if (!tokens.refreshToken) {
        throw new Error('Access token expired and no refresh token available. Please reconnect.');
    }

    console.log(`🔄 [getValidAccessToken] Refreshing ${service} token...`);

    const refreshToken = await decrypt(tokens.refreshToken);
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;
        const newExpiresAt = credentials.expiry_date || (now + 3600000); // 1 hour default

        // Encrypt and store new access token
        const encryptedAccessToken = await encrypt(newAccessToken);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_${service}`);

        await setDoc(serviceCredsRef, {
            ...tokens,
            accessToken: encryptedAccessToken,
            expiresAt: newExpiresAt,
            lastRefreshed: now
        });

        console.log(`✅ [getValidAccessToken] ${service} token refreshed successfully`);

        return { accessToken: newAccessToken, refreshed: true };
    } catch (error) {
        console.error(`❌ [getValidAccessToken] Token refresh failed:`, error);
        throw new Error(`Token refresh failed: ${error.message}. Please reconnect.`);
    }
}

export async function queryGmailInbox(userId, idToken) {
    try {
        console.log('Starting Gmail inbox query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }
        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore (service_credentials collection)
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_gmail`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Gmail credentials found for user');
            return { success: false, error: 'No Gmail credentials found. Please authorize Gmail first.' };
        }
        console.log('Found Gmail credentials in Firestore');

        const tokens = serviceCredsSnap.data();

        try {
            // Get valid access token (will refresh if expired)
            const { accessToken, refreshed } = await getValidAccessToken(db, currentUser, 'gmail', tokens);

            if (refreshed) {
                console.log('📧 [queryGmailInbox] Using refreshed access token');
            }

            console.log('[BUMPY_AUTH] queryGmailInbox:', JSON.stringify({ scopes: tokens.scopes, timestamp: new Date().toISOString() }));

            // Set up Gmail client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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

/**
 * Fetch upcoming calendar events
 */
export async function queryCalendarEvents(userId, idToken, maxResults = 10) {
    try {
        console.log('Starting Calendar events query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_calendar`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Calendar credentials found for user');
            return { success: false, error: 'No Calendar credentials found. Please authorize Calendar first.' };
        }

        const tokens = serviceCredsSnap.data();

        try {
            // Get valid access token (will refresh if expired)
            const { accessToken, refreshed } = await getValidAccessToken(db, currentUser, 'calendar', tokens);

            if (refreshed) {
                console.log('📅 [queryCalendarEvents] Using refreshed access token');
            }

            // Set up Calendar client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // Get upcoming events
            console.log('Fetching upcoming calendar events...');
            const now = new Date().toISOString();
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: now,
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = response.data.items || [];
            console.log(`Found ${events.length} upcoming events`);

            return {
                success: true,
                events: events.map(event => ({
                    id: event.id,
                    summary: event.summary || '(No title)',
                    description: event.description || '',
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                    location: event.location || '',
                    attendees: event.attendees?.map(a => a.email) || [],
                    htmlLink: event.htmlLink
                }))
            };

        } catch (error) {
            console.error('Calendar API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Calendar API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryCalendarEvents:', error);
        return { success: false, error: `Error in queryCalendarEvents: ${error.message}` };
    }
}

/**
 * Fetch recent Drive files
 */
export async function queryDriveFiles(userId, idToken, maxResults = 10) {
    try {
        console.log('Starting Drive files query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_drive`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Drive credentials found for user');
            return { success: false, error: 'No Drive credentials found. Please authorize Drive first.' };
        }

        const tokens = serviceCredsSnap.data();

        try {
            // Get valid access token (will refresh if expired)
            const { accessToken, refreshed } = await getValidAccessToken(db, currentUser, 'drive', tokens);

            if (refreshed) {
                console.log('📁 [queryDriveFiles] Using refreshed access token');
            }

            // Set up Drive client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            // Get recent files
            console.log('Fetching recent Drive files...');
            const response = await drive.files.list({
                pageSize: maxResults,
                fields: 'files(id, name, mimeType, modifiedTime, webViewLink, iconLink, thumbnailLink, size)',
                orderBy: 'modifiedTime desc'
            });

            const files = response.data.files || [];
            console.log(`Found ${files.length} recent files`);

            return {
                success: true,
                files: files.map(file => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    modifiedTime: file.modifiedTime,
                    webViewLink: file.webViewLink,
                    iconLink: file.iconLink,
                    thumbnailLink: file.thumbnailLink,
                    size: file.size
                }))
            };

        } catch (error) {
            console.error('Drive API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Drive API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryDriveFiles:', error);
        return { success: false, error: `Error in queryDriveFiles: ${error.message}` };
    }
}

/**
 * Fetch Google Chat spaces and recent messages
 */
export async function queryChatSpaces(userId, idToken, maxResults = 10) {
    try {
        console.log('Starting Chat spaces query for user:', userId);
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }

        // Get tokens from Firestore
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_messenger`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Chat credentials found for user');
            return { success: false, error: 'No Chat credentials found. Please authorize Chat first.' };
        }

        const tokens = serviceCredsSnap.data();

        try {
            // Get valid access token (will refresh if expired)
            const { accessToken, refreshed } = await getValidAccessToken(db, currentUser, 'messenger', tokens);

            if (refreshed) {
                console.log('💬 [queryChatSpaces] Using refreshed access token');
            }

            // Set up Chat client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const chat = google.chat({ version: 'v1', auth: oauth2Client });

            // Get spaces (rooms/DMs)
            console.log('Fetching Chat spaces...');
            const spacesResponse = await chat.spaces.list({
                pageSize: maxResults
            });

            const spaces = spacesResponse.data.spaces || [];
            console.log(`Found ${spaces.length} Chat spaces`);

            // For each space, get recent messages
            const spacesWithMessages = [];
            for (const space of spaces.slice(0, 5)) { // Limit to 5 spaces
                try {
                    const messagesResponse = await chat.spaces.messages.list({
                        parent: space.name,
                        pageSize: 3,
                        orderBy: 'create_time desc'
                    });

                    const messages = messagesResponse.data.messages || [];

                    spacesWithMessages.push({
                        id: space.name,
                        displayName: space.displayName || 'Direct Message',
                        spaceType: space.spaceType,
                        messages: messages.map(msg => ({
                            id: msg.name,
                            text: msg.text,
                            sender: {
                                displayName: msg.sender?.displayName || 'Unknown',
                                avatarUrl: msg.sender?.avatarUrl
                            },
                            createTime: msg.createTime
                        }))
                    });
                } catch (msgError) {
                    console.error(`Error fetching messages for space ${space.name}:`, msgError);
                    // Continue with other spaces
                }
            }

            return {
                success: true,
                spaces: spacesWithMessages
            };

        } catch (error) {
            console.error('Chat API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Chat API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in queryChatSpaces:', error);
        return { success: false, error: `Error in queryChatSpaces: ${error.message}` };
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

        // Get tokens from Firestore (service_credentials collection)
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_drive`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Drive credentials found for user');
            return { success: false, error: 'No Drive credentials found. Please authorize Drive first.' };
        }
        console.log('Found Drive credentials in Firestore');

        const tokens = serviceCredsSnap.data();

        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('[BUMPY_AUTH] queryRecentDriveFiles:', JSON.stringify({ scopes: tokens.scopes, timestamp: new Date().toISOString() }));
            const authorizedScopes = tokens.scopes;

            // Set up Drive client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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

        // Get tokens from Firestore (service_credentials collection)
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_calendar`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Calendar credentials found for user');
            return { success: false, error: 'No Calendar credentials found. Please authorize Calendar first.' };
        }
        console.log('Found Calendar credentials in Firestore');

        const tokens = serviceCredsSnap.data();

        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('[BUMPY_AUTH] queryGoogleCalendar:', JSON.stringify({ scopes: tokens.scopes, timestamp: new Date().toISOString() }));
            const authorizedScopes = tokens.scopes;

            // Set up Calendar client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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

export async function sendGmailMessage(idToken, to, subject, body) {
    try {
        console.log('Starting Gmail send for:', { to, subject });
        const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

        if (!currentUser) {
            console.log('User not authenticated');
            return { success: false, error: 'User not authenticated' };
        }
        console.log('Got authenticated user:', currentUser.uid);

        // Get tokens from Firestore (service_credentials collection)
        const db = getFirestore(firebaseServerApp);
        const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_gmail`);
        const serviceCredsSnap = await getDoc(serviceCredsRef);

        if (!serviceCredsSnap.exists()) {
            console.log('No Gmail credentials found for user');
            return { success: false, error: 'No Gmail credentials found. Please authorize Gmail first.' };
        }
        console.log('Found Gmail credentials in Firestore');

        const tokens = serviceCredsSnap.data();

        try {
            const accessToken = await decrypt(tokens.accessToken);
            console.log('[BUMPY_AUTH] sendGmailMessage:', JSON.stringify({
                scopes: tokens.scopes,
                timestamp: new Date().toISOString()
            }));

            // Set up Gmail client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

            // Create email message in RFC 2822 format
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            const messageParts = [
                `To: ${to}`,
                'Content-Type: text/plain; charset=utf-8',
                'MIME-Version: 1.0',
                `Subject: ${utf8Subject}`,
                '',
                body
            ];
            const message = messageParts.join('\n');

            // Encode message to base64url
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Send the email
            console.log('Sending email...');
            const response = await gmailClient.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage
                }
            });

            console.log(`Email sent successfully. Message ID: ${response.data.id}`);
            return {
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId
            };

        } catch (error) {
            console.error('Gmail API error:', error);
            if (error.message.includes('invalid_grant')) {
                return { success: false, error: 'Token needs refresh' };
            }
            return { success: false, error: `Gmail API error: ${error.message}` };
        }

    } catch (error) {
        console.error('Error in sendGmailMessage:', error);
        return { success: false, error: `Error in sendGmailMessage: ${error.message}` };
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

        // Get Gmail access token using new service-specific system
        const { getServiceToken } = await import('./auth-actions');
        const tokenResult = await getServiceToken('gmail', idToken);

        if (!tokenResult.success) {
            const msg = `Error: ${tokenResult.error}`;
            console.error('❌ [demoGmailToken]', msg);
            results.push(msg);
            return results;
        }

        const accessToken = tokenResult.accessToken;
        console.log('✅ [demoGmailToken] Got Gmail access token');

        try {
            // Set up Gmail client
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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
