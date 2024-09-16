// ./src/components/TopicHierarchy.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/src/lib/firebase/clientApp';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const TopicItem = ({ topic, fetchChildren }) => {
  const [children, setChildren] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = async () => {
    if (!isExpanded && children.length === 0) {
      const childTopics = await fetchChildren(topic.id);
      setChildren(childTopics);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ml-4 mt-2">
      <div className="flex items-center">
        <button onClick={toggleExpand} className="mr-2 text-gray-500">
          {isExpanded ? '▼' : '►'}
        </button>
        <Link href={`/topics/${topic.id}`} className="text-blue-600 hover:underline">
          {topic.title}
        </Link>
      </div>
      {isExpanded && children.map(childTopic => (
        <TopicItem key={childTopic.id} topic={childTopic} fetchChildren={fetchChildren} />
      ))}
    </div>
  );
};

const TopicHierarchy = ({ rootTopicId }) => {
  const [rootTopic, setRootTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTopic = async (topicId) => {
    const docRef = doc(db, 'topics', topicId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  };

  const fetchChildren = async (parentId) => {
    const q = query(collection(db, 'topics'), where('parents', 'array-contains', parentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  useEffect(() => {
    const loadRootTopic = async () => {
      try {
        const topic = await fetchTopic(rootTopicId);
        setRootTopic(topic);
      } catch (error) {
        console.error("Error fetching root topic:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRootTopic();
  }, [rootTopicId]);

  if (loading) {
    return <div>Loading topic hierarchy...</div>;
  }

  if (!rootTopic) {
    return <div>Root topic not found</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Topic Hierarchy</h2>
      <TopicItem topic={rootTopic} fetchChildren={fetchChildren} />
    </div>
  );
};

export default TopicHierarchy;