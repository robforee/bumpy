// ./src/components/TopicHierarchy.jsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { fetchTopicWithChildren_fromClient } from '@/src/app/actions/topic-hierarchy-actions';
import { useUser } from '@/src/contexts/UserProvider';

const TopicItem = ({ topic, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className={`ml-${depth * 4} mt-2`}>
      <div className="flex items-center">
        {topic.children.length > 0 && (
          <button onClick={toggleExpand} className="mr-2 text-gray-500">
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <Link href={`/topics/${topic.id}`} className="text-blue-600 hover:underline">
          {topic.title}
        </Link>
      </div>
      {isExpanded && topic.children.map(childTopic => (
        <TopicItem key={childTopic.id} topic={childTopic} depth={depth + 1} />
      ))}
    </div>
  );
};

const TopicHierarchy = ({ rootTopicId }) => {
  const [topicModel, setTopicModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchHierarchy = async () => {
      if (!user || !rootTopicId) {
        setLoading(false);
        return;
      }

      try {
        const idToken = await getIdToken(auth.currentUser);
        const result = await fetchTopicWithChildren_fromClient(rootTopicId, idToken);
        
        if (result.success) {
          setTopicModel(result.data);
        } else {
          setError(result.error || 'Failed to fetch topic hierarchy');
        }
      } catch (error) {
        console.error('Error fetching topic hierarchy:', error);
        setError('Failed to load topic hierarchy');
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, [rootTopicId, user]);

  if (loading) {
    return <div>Loading topic hierarchy...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!topicModel) {
    return <div>No topic found</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Topic Hierarchy</h2>
      <TopicItem topic={topicModel} />
    </div>
  );
};

export default TopicHierarchy;