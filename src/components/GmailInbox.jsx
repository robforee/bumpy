// src/components/GmailInbox.jsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { queryGmailInbox } from "@/src/app/actions/google-actions";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const GmailComponent = () => {
  const { user } = useUser();
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchEmails = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // prove to firebase we are logged in as currentUser to get accessToken, or more
      const idToken = await getIdToken(auth.currentUser); // api call

      const response = await queryGmailInbox(auth.currentUser.uid, idToken);
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      if (response.messages.length === 0) {
        throw new Error('No emails found in inbox');
      }
      
      setEmails(response.messages);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearEmails = () => {
    setEmails([]);
    setError(null);
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleFetchEmails} 
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Fetching...' : 'Fetch Recent Emails'}
        </button>
        <button 
          onClick={handleClearEmails}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Emails
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {emails.length > 0 ? (
        <ul className="space-y-2">
          {emails.map(email => (
            <li key={email.id} className="border-b pb-2">
              <strong className="font-semibold">{email.subject}</strong> 
              <span className="text-gray-600"> from {email.from}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No emails to display.</p>
      )}
    </div>
  );
};

export default GmailComponent;