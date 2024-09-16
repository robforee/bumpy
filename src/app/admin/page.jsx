// src/app/admin/page.jsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
import { serverWriteAsImpersonatedUser, ServerWriteWithServiceAccount } from "@/src/app/actions.js";
import { writeToUserOwnedPath } from "@/src/app/actions.js"; 
import { fetchEmailsFromServer } from "@/src/lib/gmail/clientOperations";
//import { createRootTopic } from '@/src/lib/topicOperations'; 
import { useUser } from '@/src/contexts/UserContext';

const AdminPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();

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
      const result = await serverWriteAsImpersonatedUser(idToken);
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
    try {
      const emails = await fetchEmailsFromServer();
      console.log('Fetched emails:', emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* <createRootTopic /> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <button onClick={handleFetchEmails} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Fetch Emails
        </button>
      </div>
    </div>
  );
};

export default AdminPage;