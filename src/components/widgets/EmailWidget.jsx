// src/components/widgets/EmailWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Mail, ExternalLink, Star } from 'lucide-react';
import { checkServiceAuth } from '@/src/app/actions/auth-actions';
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/clientApp';

const EmailWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // TODO: Fetch recent emails from Gmail API
        setEmails([
          {
            id: '1',
            from: 'john@example.com',
            subject: 'Project Update',
            snippet: 'Here is the latest update on the project...',
            timestamp: new Date().toISOString(),
            unread: true
          },
          {
            id: '2',
            from: 'sarah@example.com',
            subject: 'Meeting Notes',
            snippet: 'Thanks for joining the meeting today...',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            unread: false
          },
        ]);
      }
    } catch (error) {
      console.error('Error checking email auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/auth/google?service=gmail';
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
