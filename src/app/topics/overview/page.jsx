// ./src/app/topics/overview/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/src/contexts/UserContext';
import TopicList from '@/src/components/TopicList';
import TopicHierarchy from '@/src/components/TopicHierarchy';
import { db } from '@/src/lib/firebase/clientApp';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function TopicOverviewPage() {
  const { user, loading } = useUser();
  const [rootTopicId, setRootTopicId] = useState(null);

  useEffect(() => {
    const fetchRootTopic = async () => {
      if (user) {
        try {
          const q = query(
            collection(db, 'topics'),
            where('owner', '==', user.uid),
            where('parents', '==', []),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setRootTopicId(querySnapshot.docs[0].id);
          }
        } catch (error) {
          console.error("Error fetching root topic:", error);
        }
      }
    };

    fetchRootTopic();
  }, [user]);

  if (!user) return <div>Please sign in for access</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Topic Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Topic Hierarchy</h2>
            {rootTopicId ? (
              <TopicHierarchy rootTopicId={rootTopicId} />
            ) : (
              <div>No root topic found. Create one to get started!</div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Topics</h2>
            <TopicList />
          </div>
        </div>
      </div>
    </div>
  );
}
