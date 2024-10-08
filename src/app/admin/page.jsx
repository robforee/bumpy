// src/app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";

import { useUser } from '@/src/contexts/UserContextProvider';

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
      //await writeToUserOwnedPath(user.uid, rating);
      console.log('Rating written successfully to user-owned path');
    } catch (error) {
      console.error('Error writing to user-owned path:', error);
    }
  };

  const handleServerSideUserWrite = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }
    try {
      const idToken = await user.getIdToken(); // for firebase services
      console.log('idToken at this point')
      //const result = await ServerWriteAsImpersonatedUser(idToken);
      console.log('Document written successfully from server-side as user');
    } catch (error) {
      console.error('Error writing document from server-side as user:');
    }
  };

  const handleServerSideWrite = async () => {
    try {
      //await ServerWriteWithServiceAccount();
      console.log('Review written successfully from server-side');
    } catch (error) {
      console.error('Error writing review from server-side:', error);
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
      </div>






    </div>
  );
};

export default AdminPage;
