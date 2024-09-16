// src/app/topics/[id]/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTopicById } from '../../../lib/firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import TopicEditor from '../../../components/TopicEditor';
import Link from 'next/link';

export default function TopicPage() {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    async function fetchTopic() {
      try {
        const topicData = await getTopicById(db, params.id);
        setTopic(topicData);
      } catch (error) {
        console.error("Error fetching topic:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchTopic();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Topic not found</h2>
        <Link href="/admin" className="text-blue-500 hover:text-blue-600 transition duration-300">
          ← Back to Admin Page
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-yellow-100 border-b border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800">Topic Type: {topic.topic_type}</p>
        </div>
        <div className="p-6">
          <TopicEditor topic={topic} />
        </div>
      </div>
    </div>
  );
}