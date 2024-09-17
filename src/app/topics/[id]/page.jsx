// src/app/topics[id]/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTopicById, addTopic } from '../../../lib/firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import TopicEditor from '../../../components/TopicEditor';
import TopicListContainer from '../../../components/TopicListContainer';
import { useUser } from '@/src/contexts/UserContext';
import TopicHierarchy from '@/src/components/TopicHierarchy';

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
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchTopic() {
      if (params.id) {
        try {
          const topicData = await getTopicById(db, params.id);
          setTopic(topicData);
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
      const newTopicId = await addTopic(db, params.id, { 
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
          <TopicHierarchy rootTopicId={topic.parents[0] ? topic.parents[0] : topic.id}/>
          <TopicEditor topic={topic} />
          <button 
            onClick={handleAddTopic}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            + Add Sub-Topic
          </button>
          <TopicListContainer config={topicConfig} parentId={params.id} />
        </div>
      </div>
    </div>
  );
}