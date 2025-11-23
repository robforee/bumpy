// src/components/widgets/EmailWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Mail, ExternalLink, Star } from 'lucide-react';
import { checkServiceAuth } from '@/src/app/actions/auth-actions';
import { queryGmailInbox } from '@/src/app/actions/google-actions';
import { requestServiceAuth } from '@/src/lib/firebase/firebaseAuth';
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/clientApp';

const EmailWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    if (!user) return;
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await checkServiceAuth('gmail', idToken);
      setIsAuthorized(result.isAuthorized);

      if (result.isAuthorized) {
        // Fetch real emails from Gmail API
        console.log('📧 [EmailWidget] Fetching Gmail messages...');
        const gmailResult = await queryGmailInbox(user.uid, idToken);

        if (gmailResult.success && gmailResult.messages) {
          console.log(`📧 [EmailWidget] Loaded ${gmailResult.messages.length} messages`);

          // Transform Gmail API response to widget format
          const transformedEmails = gmailResult.messages.map(msg => ({
            id: msg.id,
            from: msg.from,
            subject: msg.subject,
            snippet: msg.snippet,
            timestamp: new Date(msg.date).toISOString(),
            unread: false // Gmail API doesn't provide unread status in basic list
          }));

          setEmails(transformedEmails);
          setNeedsReauth(false);
        } else {
          console.error('❌ [EmailWidget] Failed to fetch emails:', gmailResult.error);
          setEmails([]);

          // Check if token needs refresh - prompt user to re-authenticate
          if (gmailResult.error === 'Token needs refresh' ||
              gmailResult.error?.includes('invalid_grant') ||
              gmailResult.error?.includes('Token')) {
            console.log('🔄 [EmailWidget] Token expired, prompting re-authentication');
            setNeedsReauth(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking email auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ];
    requestServiceAuth('gmail', scopes);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Email</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Email</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Connect Gmail to view and respond to messages</p>
        <button
          onClick={handleConnect}
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Connect Gmail
        </button>
      </div>
    );
  }

  // Token expired - show reconnect prompt
  if (needsReauth) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Email</h3>
          </div>
          <span className="text-xs text-orange-600 font-medium">Needs Reconnection</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Your Gmail connection has expired. Please reconnect to continue viewing emails.</p>
        <button
          onClick={handleConnect}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Reconnect Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Email</h3>
        </div>
        <span className="text-xs text-green-600 font-medium">Connected</span>
      </div>

      <div className="space-y-3">
        {emails.length === 0 ? (
          <p className="text-sm text-gray-500">No recent emails</p>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onItemClick && onItemClick('email', email)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                email.unread
                  ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className={`text-sm font-medium text-gray-900 truncate ${email.unread ? 'font-bold' : ''}`}>
                      {email.from}
                    </p>
                    {email.unread && <div className="w-2 h-2 bg-purple-600 rounded-full" />}
                  </div>
                  <p className={`text-sm text-gray-700 truncate ${email.unread ? 'font-semibold' : ''}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {email.snippet}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default EmailWidget;
