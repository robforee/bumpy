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
import { updateTopicTitle } from '@/src/lib/topicFirebaseOperations';
import { Dialog } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { devConfig } from '@/src/config/devConfig';

import TopicModals from '@/src/components/TopicModals';
import TopicListTable from '@/src/components/TopicListTable';

import { FiEdit, FiPlusCircle } from 'react-icons/fi';

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

  const handleEditTopic = () => {
    setEditModalOpen(true);
  };

  const handleSaveTopic = async (updatedTopic) => {
    try {
      await updateTopicTitle(topic.id, updatedTopic.title);
      setTopic({ ...topic, ...updatedTopic });
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  const handleAddTopic = (topicType) => {
    setAddingTopicType(topicType);
    setIsAddModalOpen(true);
  };

  const handleTopicAdded = () => {
    refreshTopics();
    setIsAddModalOpen(false);
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
        <div className="px-6 py-4 bg-yellow-100 border-b border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800">Topic Type: {topic.topic_type}</p>
        </div>
        <div className="p-6">
          <p className="text-base">
            <span className="text-1xl font-bold text-blue-500">
              <Link href={`/topics/${topic_parent?.id}`} className="text-blue-600 hover:underline">
                {topic_parent?.title}
              </Link>
            </span>
          </p>
{/* 
          ADD COMMENT
*/}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              key={'comment'}
              onClick={() => handleAddTopic('comment')}
              className={`${getCategoryColor('comment')} text-white text-sm font-bold py-1 px-2 rounded transition duration-300`}>
              + {'comment'}
            </button>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{topic.title} 
                &nbsp;
              <button
                onClick={handleEditTopic}
                className="text-gray-500 hover:text-gray-700">
                <FiEdit size={15} />
              </button>


              </h1>
            </div>
            {topic.subtitle && <h2 className="text-xl text-gray-600 mt-2">{topic.subtitle}</h2>}
{/*             
            TEXT in MARKDOWN
*/}
            {topic.text && <p className="mt-2">            
              <div className="max-w-full overflow-x-auto px-4">
                  <ReactMarkdown className={`markdown-content text-red-600`}>
                    {topic.text}
                  </ReactMarkdown>
                </div>            
              </p>}


          </div>
{/* 
          Prompts
*/}
          <div className="border-3 border-blue-500 text-green-500">
            <div className="flex items-center">
              Questions 
              <button
                onClick={() => handleAddTopic('prompt')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <FiPlusCircle size={18} />
              </button>
            </div>
            <TopicListTable
                parentId={topic.id}
                topic_type="prompt"
                rowHeight={rowHeight}
              />
          </div>
          <br/>
{/*           
          TOPICS
 */}
          <div className="border-3 border-blue-500 text-blue-500">
            <div className="flex items-center">
              Topics
              <button
                onClick={() => handleAddTopic('topic')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <FiPlusCircle size={18} />
              </button>
            </div>
            <TopicListTable
              parentId={topic.id}
              topic_type="topic"
              rowHeight={rowHeight}
            />
          </div>
        </div>
      </div>
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Edit Topic</h2>
          <Input
            type="text"
            value={topic?.title || ''}
            onChange={(e) => setTopic({ ...topic, title: e.target.value })}
            className="mb-4"
            placeholder="Title"
          />
          <Input
            type="text"
            value={topic?.subtitle || ''}
            onChange={(e) => setTopic({ ...topic, subtitle: e.target.value })}
            className="mb-4"
            placeholder="Subtitle"
          />
          <Textarea
            value={topic?.text || ''}
            onChange={(e) => setTopic({ ...topic, text: e.target.value })}
            className="mb-4"
            placeholder="Text"
            rows={5}
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => handleSaveTopic(topic)}>Save</Button>
          </div>
        </div>
      </Dialog>
      <TopicModals 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        parentId={topic.id}
        topicType={addingTopicType}
        onTopicAdded={handleTopicAdded}
      />
    </div>
    </>
  );
}