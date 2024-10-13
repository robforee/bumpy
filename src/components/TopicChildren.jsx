// src/components/TopicChildren.jsx
'use client';

import React, { useState } from 'react';
import { fetchTopicsByCategory } from "@/src/app/actions/topic-actions";
import { useUser } from '@/src/contexts/UserProvider';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const TopicChildren = () => {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();

  const fetchTopicChildren = async () => {
    if (!user) {
      setError('User not authenticated. Please sign in.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
        const idToken = await getIdToken(auth.currentUser);
        const fetchedTopics = await fetchTopicsByCategory(['topic'], 'qqIGRbzwrQSwpwn5UXt5', idToken);
        setTopics(fetchedTopics);
    } catch (err) {
      console.error('Error fetching topic children:', err);
      if (err.message === 'User not authenticated') {
        setError('Server authentication failed. Please try signing out and signing in again.');
      } else {
        setError(`Error fetching topic children: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">Topic Children</h2>
      {isLoading ? (
        <div>Loading topic children...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : topics.length > 0 ? (
        <ul className="list-disc pl-5">
          {topics.map((topic) => (
            <li key={topic.id} className="mb-2">{topic.title}</li>
          ))}
        </ul>
      ) : (
        <p>No topic children fetched. Click the button to load children.</p>
      )}
      <div className="mt-4">
        <button 
          onClick={fetchTopicChildren}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={!user}
        >
          {topics.length === 0 ? 'Fetch Topic Children' : 'Refresh Topic Children'}
        </button>
      </div>
    </div>
  );
};

export default TopicChildren;