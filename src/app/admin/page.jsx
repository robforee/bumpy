// src/app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
import { ServerWriteAsImpersonatedUser, ServerWriteWithServiceAccount, writeToUserOwnedPath } from "@/src/app/actions.js";
import { fetchEmailsFromServer } from "@/src/lib/gmail/gmailClientOperations";
import { useUser } from '@/src/contexts/UserContext';
import GmailInbox from '@/src/components/GmailInbox';

const AdminPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [emails, setEmails] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleAddSampleRestaurants = async () => {
    try {
      await addFakeRestaurantsAndReviews();
      console.log('Sample restaurants added successfully');
    } catch (error) {
      console.error('Error adding sample restaurants:', error);
    }
  };

  const handleWriteToUserOwnedPath = async () => {
    try {
      const rating = {
        text: "This is a test rating.",
        rating: 4,
        timestamp: new Date().toISOString()
      };
      await writeToUserOwnedPath(user.uid, rating);
      console.log('Rating written successfully to user-owned path');
    } catch (error) {
      console.error('Error writing to user-owned path:', error);
    }
  };

  const handleServerSideUserWrite = async () => {
    try {
      const idToken = await user.getIdToken();
      const result = await ServerWriteAsImpersonatedUser(idToken);
      console.log('Document written successfully from server-side as user');
    } catch (error) {
      console.error('Error writing document from server-side as user:', error);
    }
  };

  const handleServerSideWrite = async () => {
    try {
      await ServerWriteWithServiceAccount();
      console.log('Review written successfully from server-side');
    } catch (error) {
      console.error('Error writing review from server-side:', error);
    }
  };

  const handleFetchEmails = async () => {
    setEmailLoading(true);
    try {
      const fetchedEmails = await fetchEmailsFromServer('', user.uid); // Pass user ID if needed
      setEmails(fetchedEmails);
      console.log('Fetched emails:', fetchedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setEmailLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={handleAddSampleRestaurants} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Add Sample Restaurants
        </button>
        <button onClick={handleWriteToUserOwnedPath} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Write to User-Owned Path
        </button>
        <button onClick={handleServerSideUserWrite} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Server-Side User Write
        </button>
        <button onClick={handleServerSideWrite} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Server-Side Service Account Write
        </button>
        <button 
          onClick={handleFetchEmails} 
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          disabled={emailLoading}
        >
          {emailLoading ? 'Fetching...' : 'Fetch Emails'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Fetched Emails</h2>
        {emailLoading ? (
          <p>Loading emails...</p>
        ) : emails.length > 0 ? (
          <ul className="space-y-4">
            {emails.map((email, index) => (
              <li key={index} className="border p-4 rounded shadow">
                <p className="font-bold">{email.subject || 'No Subject'}</p>
                <p className="text-sm text-gray-600">{email.from || 'Unknown Sender'}</p>
                <p className="mt-2">{email.snippet || 'No preview available'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No emails fetched yet. Click the "Fetch Emails" button to get started.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Gmail Inbox Component</h2>
        <GmailInbox />
      </div>
    </div>
  );
};

export default AdminPage;
