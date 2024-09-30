// src/app/topics[id]/page.jsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getTopicById, addTopic } from '@/src/lib/firebase/firestore';
import { db_viaClient } from '@/src/lib/firebase/clientApp';
import { getCategoryColor } from '@/src/components/TopicList/utils';
import { useUser } from '@/src/contexts/UserContext';
import ReactMarkdown from 'react-markdown';
import { FiEdit, FiPlusCircle } from 'react-icons/fi';
import { Dialog } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { devConfig } from '@/src/config/devConfig';

// import TopicModals from '@/src/components/TopicModals';
import TopicTableContainer from '@/src/components/TopicTableContainer';
import { updateTopic } from '@/src/lib/topicFirebaseOperations';

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
  const params = useParams();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingTopicType, setAddingTopicType] = useState(null);

  const rowHeight = devConfig.topicList.rowHeight;

  const refreshTopics = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchTopic() {
      if (params.id) {
        try {
          const topicData = await getTopicById(db_viaClient, params.id);
          setTopic(topicData);
          if (topicData.parents.length) {
            const parentData = await getTopicById(db_viaClient, topicData.parents[0]);
            setParentTopic(parentData);
          }
        } catch (error) {
          console.error("Error fetching topic:", error);
          setError("Failed to fetch topic. Please try again.");
        }
      }
    }
    fetchTopic();
  }, [params.id]);

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

  const handleSaveTopic = async () => {
    try {
      const updatedData = {
        title: topic.title,
        subtitle: topic.subtitle,
        text: topic.text
      };
      const updatedTopic = await updateTopic(topic.id, updatedData);
      setEditModalOpen(false);
      // Update the local state with the returned data
      setTopic(prevTopic => ({ ...prevTopic, ...updatedTopic }));
    } catch (error) {
      console.error("Error updating topic:", error);
      alert("Error updating topic: " + error.message);
    }
  };

  if (!user) return <div>Please sign in for access</div>;
  if (loading) return <div>Loading...</div>;
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
        <div className="px-6 py-4 bg-yellow-100 border-b border-yellow-200">
          <span className="text-1xl font-bold text-blue-500">
                {
                  topic_parent?.title 
                  ? <Link href={`/topics/${topic_parent?.id}`} className="text-blue-600 hover:underline">
                      {topic_parent?.title}
                    </Link>
                  : topic.title
                }
          </span>
          <TopicTableContainer
                parentId={topic.id}
                topic_type="topic"
                rowHeight={rowHeight}
              />          
        </div>
      </div>

      {/* <TopicModals 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editingTopic={topic}
        handleEditChange={handleEditChange}
        handleSaveTopic={handleSaveTopic}
        parentId={topic.id}
        topicType={addingTopicType}
        onTopicAdded={handleTopicAdded}
        userId={user.uid}
      /> */}
    </div>
    </>
  );
}