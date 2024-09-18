// src/components/GmailInbox.js

import React, { useState, useEffect } from 'react';
//import { useAuth } from '@/src/contexts/AuthContext'; // Assuming you have an auth context
import { useUser }               from '@/src/contexts/UserContext';


export default function GmailInbox() {
  const [emails, setEmails] = useState([]);
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, loading } = useUser();

  useEffect(() => {
    async function fetchEmails() {
      if (!currentUser) return;

      try {
        const response = await fetch(`/api/gmail?userId=${currentUser.uid}&maxResults=10`);
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        const data = await response.json();
        setEmails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Last 10 Emails</h2>
      <ul>
        {emails.map(email => (
          <li key={email.id}>
            <strong>{email.payload.headers.find(h => h.name === "From").value}</strong>
            <p>{email.payload.headers.find(h => h.name === "Subject").value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
