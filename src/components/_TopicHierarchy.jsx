// ./src/components/TopicHierarchy.jsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db_viaClient } from '@/src/lib/firebase/clientApp';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  const fetchTopic = async (topicId) => {
    const docRef = doc(db_viaClient, 'topics', topicId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data(), children: [] };
    }
    return null;
  };

  const fetchChildren = async (parentId) => {
    const q = query(
      collection(db_viaClient, 'topics'), 
      where('parents', 'array-contains', parentId),
      where('topic_type', '==', 'topic') // Filter by category
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), children: [] }));
  };

  const buildTopicModel = async (topicId) => {
    const topic = await fetchTopic(topicId);
    if (!topic) return null;

    const children = await fetchChildren(topicId);
    for (let child of children) {
      child.children = await buildTopicModel(child.id);
    }
    topic.children = children;

    return topic;
  };

  useEffect(() => {
    const loadTopicModel = async () => {
      try {
        const model = await buildTopicModel(rootTopicId);
        setTopicModel(model);
      } catch (error) {
        console.error("Error building topic model:", error);
        setError("Failed to load topic hierarchy. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTopicModel();
  }, [rootTopicId]);

  if (loading) {
    return <div>Loading topic hierarchy...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!topicModel) {
    return <div>Root topic not found</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Topic Hierarchy</h2>
      <TopicItem topic={topicModel} />
      {/* <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto">
        {JSON.stringify(topicModel, null, 2)}
      </pre> */}
    </div>
  );
};

export default TopicHierarchy;