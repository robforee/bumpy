// ./src/components/TopicList.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/src/lib/firebase/clientApp';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

const TopicList = ({ parentId = null }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topicsRef = collection(db, 'topics');
        let q = query(topicsRef, orderBy('updated_at', 'desc'));
        
        if (parentId) {
          q = query(q, where('parents', 'array-contains', parentId));
        }

        const querySnapshot = await getDocs(q);
        const topicsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          updated_at: doc.data().updated_at?.toDate()
        }));
        setTopics(topicsData);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [parentId]);

  if (loading) {
    return <div>Loading topics...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Title</th>
            <th className="py-3 px-6 text-left">Type</th>
            <th className="py-3 px-6 text-left">Last Updated</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {topics.map((topic) => (
            <tr key={topic.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">
                <Link href={`/topics/${topic.id}`} className="font-medium">
                  {topic.title}
                </Link>
              </td>
              <td className="py-3 px-6 text-left">{topic.topic_type}</td>
              <td className="py-3 px-6 text-left">
                {topic.updated_at ? topic.updated_at.toLocaleString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopicList;
