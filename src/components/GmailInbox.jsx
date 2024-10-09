// src/components/GmailInbox.js
// InboxIntel

'use client';

import React, { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { queryGmailInbox } from "@/src/app/actions.js";

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
      const idToken = await user.getIdToken();
      const emailDetails = await queryGmailInbox(idToken);
      setEmails(emailDetails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  console.log('im here')
  return (
    <div>
      <button onClick={handleFetchEmails} disabled={isLoading}>
        {isLoading ? 'Fetching...' : 'Fetch Recent Emails'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {emails.map(email => (
          <li key={email.id}>
            <strong>{email.subject}</strong> from {email.from}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GmailComponent;