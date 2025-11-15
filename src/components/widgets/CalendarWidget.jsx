// src/components/widgets/CalendarWidget.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { checkServiceAuth } from '@/src/app/actions/auth-actions';
import { requestServiceAuth } from '@/src/lib/firebase/firebaseAuth';
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/src/lib/firebase/clientApp';

const CalendarWidget = ({ onItemClick }) => {
  const { user } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    if (!user) return;
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await checkServiceAuth('calendar', idToken);
      setIsAuthorized(result.isAuthorized);

      if (result.isAuthorized) {
        // TODO: Fetch calendar events
        setEvents([
          { id: '1', summary: 'Team Meeting', start: '2025-11-14T10:00:00', end: '2025-11-14T11:00:00' },
          { id: '2', summary: 'Project Review', start: '2025-11-14T14:00:00', end: '2025-11-14T15:00:00' },
        ]);
      }
    } catch (error) {
      console.error('Error checking calendar auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    requestServiceAuth('calendar', scopes);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Connect your Google Calendar to view upcoming events</p>
        <button
          onClick={handleConnect}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Connect Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        <span className="text-xs text-green-600 font-medium">Connected</span>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming events</p>
        ) : (
          events.map((event) => (
            <button
              key={event.id}
              onClick={() => onItemClick && onItemClick('calendar', event)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CalendarWidget;
