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
  const { user, loading } = useUser();
  const [topic, setTopic] = useState(null);
  const [topic_parent, setParentTopic] = useState(null);
  const [error, setError] = useState(null);
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
    async function fetchTopicX() {
      if (params.id && user) {
        try {
          const idToken = await getIdToken(auth.currentUser);
          const topicData = await fetchTopic(params.id, idToken);


          setTopic(topicData);
          if (topicData.parents[0]) {
            const parentData = await fetchTopic(topicData.parents[0], idToken);
            setParentTopic(parentData);
          }
        } catch (error) {
          console.error("Error fetching topic:", error);
          setError("Failed to fetch topic. Please try again.");
        }
      }
    }
    if (user) {
      fetchTopicX();
    }
  }, [params.id, user, refreshTrigger]);

  const handleAddTopic = (topicType) => {
    setAddingTopicType(topicType);
    setIsAddModalOpen(true);
  };

  const handleTopicAdded = () => {
    refreshTopics();
    setIsAddModalOpen(false);
  };

  const handleEditTopic = () => {
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setTopic(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in for access</div>;
  if (error) return <div>Error: {error}</div>;
  if (!topic) return <div>Topic not found</div>;

  return (
    <>
    <style jsx global>{markdownStyles}</style>
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">

{/*         
        yellow header
*/}
        <div className="TOPIC_PAGE px-6 py-4 bg-yellow-100 border-b border-yellow-200">
          <span className="TOPIC_TITLE text-1xl font-bold text-blue-500">
                {
                  topic_parent?.title 
                  ? <Link href={`/topics/${topic_parent?.id}`} className="text-blue-600 hover:underline">
                      {topic_parent?.title} 
                    </Link> 
                  : topic.title
                }
                {topic_parent?.subtitle && (
                  <span className="text-red-700 ">&nbsp;{topic_parent.subtitle}</span>
                )}
          </span>
          <TopicTableContainer className="TOPIC_TABLE_CONATINER"
                parentId={topic.id}
                topic_type="topic"
                rowHeight={rowHeight}
              />          
        </div>
      </div>
    </div>
    </>
  );
}