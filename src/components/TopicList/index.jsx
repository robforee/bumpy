// src/components/TopicList/index.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/src/lib/firebase/clientApp.js';
import { devConfig } from '@/src/config/devConfig';
import { useUser } from '@/src/contexts/UserContext';
import { fetchTopicsByCategory, fetchRelationshipTopics, updateTopicTitle } from '@/src/lib/topicFirebaseOperations';
import AddTopicModal from '../AddTopicModal';
import { Dialog } from '@/src/components/ui/Dialog';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { getCategoryColor } from './utils';
import TopicRelationships from './TopicRelationships';
import TopicTable from './TopicTable';

// type category 
const TopicList = ({ categories, type, parentId, showAddButtons = true }) => {
  const { user } = useUser();
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const rowHeight = devConfig.topicList.rowHeight;

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      let topicsData;
      
      if (type === 'relationships') {          
        topicsData = await fetchRelationshipTopics(parentId);
      } 
      if (type === 'category' ) {          
        // if you pass multiple categories you will get multiple lists
        topicsData = await fetchTopicsByCategory(categories, parentId);
      }
      setTopics(topicsData);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setError("Failed to fetch topics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [categories, type, parentId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleAddTopic = (category) => {
    if (!user) {
      setError("You must be logged in to add a topic");
      return;
    }
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleEditTitle = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  const handleTitleChange = (e) => {
    setEditingTopic({ ...editingTopic, title: e.target.value });
  };

  const handleSaveTitle = async () => {
    try {
      if (!editingTopic || !editingTopic.id || !editingTopic.title) {
        throw new Error("Invalid topic data");
      }
      // Make sure updateTopicTitle is correctly imported and used
      await updateTopicTitle(editingTopic.id, editingTopic.title);
      setEditModalOpen(false);
      fetchTopics(); // Refresh the topics list
    } catch (error) {
      console.error("Error updating topic title:", error);
      // Optionally, you can set an error state here to display to the user
    }
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mb-4">
      {/* 1 or more topic buttons for each categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* the add button array? */}
        { showAddButtons && categories && categories.map(category => {
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
      {/* if type relationships show TopicRelationships
          if type category */}
      <div className="max-h-[calc(20*${rowHeight})] overflow-y-auto">
        {type === 'relationships' 
          ? <TopicRelationships topics={topics} />
          : <TopicTable topics={topics} rowHeight={rowHeight} handleEditTitle={handleEditTitle} />
        }
      </div>
      <AddTopicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        parentId={parentId}
        topicType={selectedCategory}
        onTopicAdded={fetchTopics}
      />
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Edit Topic Title</h2>
          <Input
            type="text"
            value={editingTopic?.title || ''}
            onChange={handleTitleChange}
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleSaveTitle}>Save</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TopicList;