// src/app/topics[id]/page.jsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link                     from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getTopicById, addTopic } from '@/src/lib/firebase/firestore';
import { db_viaClient }                    from '@/src/lib/firebase/clientApp';
import TopicEditor               from '@/src/components/TopicEditor';
import TopicListContainer        from '@/src/components/TopicListContainer';
import TopicHierarchy            from '@/src/components/TopicHierarchy';
import TopicList                 from '@/src/components/TopicList';
import {getCategoryColor}        from '@/src/components/TopicList/utils';
import { useUser }               from '@/src/contexts/UserContext';
import PromptEditor from '@/src/components/PromptEditor';


const topicConfig = {
  "divForEach": [
    "topic",
    "comment",
    "artifact",
    "prompt",
    "prompt-response"
  ],
  "singleDivForGroup-A": {
    "items": [
      "procedure",
      "preference"
    ],
    "defaultToggle": "closed"
  },
  "singleDivForGroup-B": [
    "ideas",
    "claims",
    "arguments",
    "values"
  ],
  "singleDivForGroup-C": [
    "problems",
    "solutions",
    "outcomes",
    "threats",
    "experiments"
  ],
  "singleDivForGroup-D": [
    "people-organizations",
    "models-frames",
    "projects"
  ],
  "singleDivForGroup-E": [
    "funding-sources",
    "regulation-sources",
    "data-souces"
  ]
};

export default function TopicPage() {
  const { user, loading } = useUser();
  const [topic, setTopic] = useState(null);
  const [topic_parent, setParentTopic] = useState(null);
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);  

  const refreshTopics = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchTopic() {
      if (params.id) {
        try {
          const topicData = await getTopicById(db_viaClient, params.id);
          setTopic(topicData);
          if(topicData.parents.length){
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


  const handleAddTopic = async () => {
    if (!user) {
      setError("You must be logged in to add a topic");
      return;
    }
    console.log('TopicPage app/topic/[]',user.uid,params.id)
    try {
      const newTopicId = await addTopic(db_viaClient, params.id, { 
        topic_type: 'topic', 
        title: 'New Topic'
      }, user.uid);
      router.push(`/topics/${newTopicId}`);
    } catch (error) {
      console.error("Error adding new topic:", error);
      setError("Failed to add new topic. Please try again.");
    }
  };

  if (!user) return <div>Please sign in for access</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!topic) return <div>Topic not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-yellow-100 border-b border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800">Topic Type: {topic.topic_type}</p>
        </div>
        <div className="p-6">
          {/* <TopicHierarchy 
            rootTopicId={topic.parents[0] ? topic.parents[0] : topic.id}/> */}
          

          {/* the topic sit rep */}
          <p className="text-base">
            <span className="text-1xl font-bold text-blue-500"> 
              <Link href={`/topics/${topic_parent?.id}`} className="text-blue-600 hover:underline">
                {topic_parent?.title  }
              </Link>            
              </span>
            <span className="text-2xl font-bold text-blue-500">( {topic.title} )</span>
            <span className="text-base"> {topic.subtitle} </span>
            <span className="text-xxs text-green-500">{topic.id}</span>
            <span className="text-tiny text-red-500">{topic.id}</span>
            <span className="text-super-tiny text-blue-500">{topic.id}</span>
          </p>  
          <div className="flex flex-wrap gap-2 mb-4">
              {/* the add button array? */}
              {'topic,comment'.split(',').map(category => {
                const buttonColor = getCategoryColor(category);
                return (
                  <button
                    key={category}
                    onClick={() => handleAddTopic(category)}
                    className={`${buttonColor} text-white text-sm font-bold py-1 px-2 rounded transition duration-300`}
                  >
                    + {category}
                  </button>
                );
              })}
            </div>                  
          <div >
            <TopicList 
                type="category" 
                categories={['topic']} 
                parentId={topic.id} 
                showAddButtons={false}
              />
          </div>
          {/* TOPIC AND PROMPT EDITORS */}
          <div className='border border-red-500'>
            {topic.topic_type === 'prompt' ? (
              <PromptEditor topic={topic} />
            ) : (
              <TopicEditor topic={topic} />
            )}
          </div>

          <button 
            onClick={handleAddTopic}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            + Add Sub-Topic
          </button>
          <TopicListContainer config={topicConfig} parentId={params.id} refreshTrigger={refreshTrigger} refreshTopics={refreshTopics} />          

        </div>
      </div>
    </div>
  );
}