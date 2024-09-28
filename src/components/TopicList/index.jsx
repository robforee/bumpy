// src/components/TopicList/index.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db_viaClient } from '@/src/lib/firebase/clientApp.js';
import { devConfig } from '@/src/config/devConfig';
import { useUser } from '@/src/contexts/UserContext';
import { fetchTopicsByCategory, fetchRelationshipTopics, updateTopicTitle, onTopicsChange } from '@/src/lib/topicFirebaseOperations';
import AddTopicModal from '../AddTopicModal';
import { Dialog } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { getCategoryColor } from './utils';
import TopicRelationships from './TopicRelationships';
import TopicTable from './TopicTable';

const TopicList = ({ categories, type, parentId, showAddButtons = true, refreshTrigger }) => {
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
      } else if (type === 'category') {          
        console.log('get categories')
        topicsData = await fetchTopicsByCategory(categories, parentId);
        console.log(topicsData);
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
  }, [fetchTopics, refreshTrigger]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onTopicsChange(type, categories, parentId, user?.uid, 
      (updatedTopics) => {
        setTopics(updatedTopics);
        setLoading(false);
      },
      (error) => {
        console.error("Error in real-time updates:", error);
        setError("Failed to get real-time updates. Please refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [type, categories, parentId, user?.uid]);

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
      await updateTopicTitle(editingTopic.id, editingTopic.title);
      setEditModalOpen(false);
      // Optimistic update
      setTopics(prevTopics => 
        prevTopics.map(t => t.id === editingTopic.id ? {...t, title: editingTopic.title} : t)
      );
    } catch (error) {
      console.error("Error updating topic title:", error);
    }
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {showAddButtons && categories && categories.map(category => {
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
      <div className="max-h-[calc(20*${rowHeight})] overflow-y-auto">
       
        
        {type === 'relationships' 
          ? <TopicRelationships topics={topics} />
          : <TopicTable topics={topics} rowHeight={rowHeight} handleEditTitle={handleEditTitle} />
        }
      </div>
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