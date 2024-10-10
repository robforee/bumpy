// src/components/GoogleCalendar.jsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { queryGoogleCalendar } from "@/src/app/actions/google-actions";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const GoogleCalendar = () => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchEvents = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await getIdToken(auth.currentUser);
      const calendarEvents = await queryGoogleCalendar(idToken);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearEvents = () => {
    setEvents([]);
    setError(null);
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleFetchEvents}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Fetching...' : 'Fetch Upcoming Events'}
        </button>
        <button
          onClick={handleClearEvents}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Events
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {events.length > 0 ? (
        <ul className="space-y-2">
          {events.map(event => (
            <li key={event.id} className="border-b pb-2">
              <strong className="font-semibold">{event.summary}</strong>
              <span className="text-gray-600"> from {new Date(event.start).toLocaleString()} to {new Date(event.end).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No events to display.</p>
      )}
    </div>
  );
};

export default GoogleCalendar;
