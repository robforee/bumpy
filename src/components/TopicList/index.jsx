"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { devConfig } from '@/src/config/devConfig';
import { useUser } from '@/src/contexts/UserProvider';
import { fetchTopicsByCategory_fromClient, fetchRelationshipTopics_fromClient } from '@/src/app/actions/topic-client-actions';
import { setupTopicChangeListener_fromClient } from '@/src/app/actions/topic-realtime-actions';
import { setupRealtimeListener } from '@/src/lib/topic-realtime';
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
    if (!user) {
      console.error("User must be logged in to fetch topics");
      return;
    }

    try {
      setLoading(true);
      const idToken = await getIdToken(auth.currentUser);
      let result;
      
      if (type === 'relationships') {          
        result = await fetchRelationshipTopics_fromClient(parentId, idToken);
      } else if (type === 'category') {          
        console.log('get categories')
        result = await fetchTopicsByCategory_fromClient(categories, parentId, idToken);
      }
      
      if (result.success) {
        setTopics(result.data);
      } else {
        setError(result.error || "Failed to fetch topics");
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setError("Failed to fetch topics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [categories, type, parentId, user]);

  useEffect(() => {
    setLoading(true);
    let unsubscribe = null;

    const setupListener = async () => {
      try {
        if (!user) return;
        
        const idToken = await getIdToken(auth.currentUser);
        const result = await setupTopicChangeListener_fromClient(
          type, 
          categories, 
          parentId, 
          idToken
        );

        if (result.success) {
          const queryParams = JSON.parse(result.query);
          unsubscribe = setupRealtimeListener(
            queryParams,
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
        }
      } catch (error) {
        console.error("Error setting up topic listener:", error);
        setError("Failed to setup real-time updates. Please refresh the page.");
        setLoading(false);
      }
    };

    setupListener();
    return () => unsubscribe?.();
  }, [type, categories, parentId, user]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics, refreshTrigger]);

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
      // Removed updateTopicTitle call, assuming it's handled on the server
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