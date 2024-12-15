// src/app/topics/[id]/page.jsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/src/contexts/UserProvider';
import { devConfig } from '@/src/config/devConfig';
import { fetchTopic } from '@/src/app/actions/topic-actions';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

import TopicTableContainer from '@/src/components/TopicTableContainer';

import {topicTypes} from '@/src/lib/TopicTypes'

const markdownStyles = `
  .markdown-content ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  .markdown-content ol {
    list-style-type: decimal;
    padding-left: 20px;
  }
  .markdown-content li {
    margin-bottom: 5px;
  }
`;
const terms = topicTypes;

export default function TopicPage() {
  const { user, loading: userLoading } = useUser();
  const [topic, setTopic] = useState(null);
  const [parentTopic, setParentTopic] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addingTopicType, setAddingTopicType] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const params = useParams();
  const router = useRouter();

  const rowHeight = devConfig.topicList.rowHeight;

  const refreshTopics = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchTopicData() {
      if (!params.id || !user) return;

      setLoading(true);
      setError(null);
      
      try {
        const idToken = await getIdToken(auth.currentUser);
        const topicData = await fetchTopic(params.id, idToken);
        console.log('topicData',topicData);

        if (!topicData) {
          setError("Topic not found");
          return;
        }

        setTopic(topicData);

        // Only fetch parent if it exists
        if (topicData.parents && topicData.parents.length > 0) {
          const parentData = await fetchTopic(topicData.parents[0], idToken);
          setParentTopic(parentData);
        }
      } catch (error) {
        console.error("Error fetching topic:", error);
        setError("Failed to fetch topic. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTopicData();
  }, [params.id, user, refreshTrigger]);

  if (userLoading) {
    return <div className="animate-pulse">Loading user data...</div>;
  }

  if (!user) {
    return <div>Please sign in to view topics</div>;
  }

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!topic) {
    return <div className="text-gray-600">Topic not found</div>;
  }

  return (
    <div className="space-y-6">
      <style jsx global>{markdownStyles}</style>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          {parentTopic && (
            <Link href={`/topics/${parentTopic.id}`} className="text-blue-500 hover:underline">
              ← Back to {parentTopic.title}
            </Link>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-4">{topic.title}</h1>
        
        <TopicTableContainer
          topicId={params.id}
          parentId={topic?.parents?.[0] || null}
          topic_type={topic?.topic_type || 'default'}
          rowHeight={rowHeight}
          terms={terms}
          addingTopicType={addingTopicType}
          setAddingTopicType={setAddingTopicType}
          isAddModalOpen={isAddModalOpen}
          setIsAddModalOpen={setIsAddModalOpen}
          editModalOpen={editModalOpen}
          setEditModalOpen={setEditModalOpen}
        />
      </div>
    </div>
  );
}