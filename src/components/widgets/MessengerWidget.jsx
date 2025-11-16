// src/components/widgets/MessengerWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, X } from 'lucide-react';
import { checkServiceAuth, disconnectService } from '@/src/app/actions/auth-actions';
import { queryChatSpaces } from '@/src/app/actions/google-actions';
import { requestServiceAuth } from '@/src/lib/firebase/firebaseAuth';
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/clientApp';

const MessengerWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    if (!user) return;
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await checkServiceAuth('messenger', idToken);
      setIsAuthorized(result.isAuthorized);

      if (result.isAuthorized) {
        // Fetch real Chat spaces and messages
        const spacesResult = await queryChatSpaces(user.uid, idToken, 5);
        if (spacesResult.success) {
          setSpaces(spacesResult.spaces);
        } else {
          console.error('Error fetching chat spaces:', spacesResult.error);
          setSpaces([]);
        }
      }
    } catch (error) {
      console.error('Error checking messenger auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const scopes = [
      'https://www.googleapis.com/auth/chat.messages',
      'https://www.googleapis.com/auth/chat.messages.create',
      'https://www.googleapis.com/auth/chat.spaces'
    ];
    requestServiceAuth('messenger', scopes);
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Chat? You will need to re-authorize to access Chat again.')) {
      return;
    }

    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await disconnectService('messenger', idToken);
      if (result.success) {
        setIsAuthorized(false);
        setSpaces([]);
      } else {
        console.error('Error disconnecting:', result.error);
        alert('Failed to disconnect Chat. Please try again.');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect Chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Chat</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Chat</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Connect to Google Chat to view recent messages and spaces</p>
        <button
          onClick={handleConnect}
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Connect Chat
        </button>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-600 font-medium">Connected</span>
          <button
            onClick={handleDisconnect}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Disconnect Chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {spaces.length === 0 ? (
          <p className="text-sm text-gray-500">No recent chat spaces</p>
        ) : (
          spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => onItemClick && onItemClick('chat', space)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{space.displayName}</p>
                    <p className="text-xs text-gray-500">{space.messages?.length || 0} recent messages</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{space.spaceType}</span>
              </div>
              {space.messages && space.messages.length > 0 && (
                <p className="text-sm text-gray-700 line-clamp-2 ml-10">
                  {space.messages[0].sender?.displayName}: {space.messages[0].text}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {spaces.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="https://chat.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Open Google Chat
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
};

export default MessengerWidget;
