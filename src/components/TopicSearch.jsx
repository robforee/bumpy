// src/components/TopicSearch.jsx

import React, { useState, useEffect } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { fetchTopicsByCategory } from '@/src/app/actions/topic-actions';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { Button } from '@/src/components/ui/button';
import { Select } from '@/src/components/ui/select';

const TopicSearch = ({ onTopicSelect }) => {
  const { user } = useUser();
  const [topics, setTopics] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTopics();
  }, [selectedType]);

  const loadTopics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await getIdToken(auth.currentUser);
      //const types = selectedType === 'all' ? ['topic', 'prompt', 'comment'] : [selectedType];
      const fetchedTopics = await fetchTopicsByCategory('-all', null, idToken);
      const sortedTopics = fetchedTopics.sort((a, b) => b.updated_at - a.updated_at).slice(0, 10);
      setTopics(sortedTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Topic Search</h2>
      <Select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="mb-4"
      >
        <option value="all">All Types</option>
        <option value="topic">Topic</option>
        <option value="prompt">Prompt</option>
        <option value="comment">Comment</option>
      </Select>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li 
              key={topic.id}
              className="cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => onTopicSelect(topic)}
            >
              <span className="font-medium">{topic.title}</span>
              <span className="text-sm text-gray-500 ml-2">({topic.topic_type})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopicSearch;