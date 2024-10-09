// src/components/topicTableContainer.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { fetchTopicsByCategory, updateTopic, deleteTopic, fetchTopic } from '@/src/lib/topicFirebaseOperations';
import TopicTable from './TopicTable';
import TopicModals from './TopicModals';

const TopicTableContainer = ({ parentId, topic_type, rowHeight }) => {
  const { user } = useUser();
  const [topics, setTopics] = useState([]);
  const [topicTypes, setTopicTypes] = useState([]);
  const [parentTopic, setParentTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [expandedTopicIds, setExpandedTopicIds] = useState(new Set());
  const [isParentTopicExpanded, setIsParentTopicExpanded] = useState(false);
  const [addingTopicType, setAddingTopicType] = useState(null);
  const [addingToTopicId, setAddingToTopicId] = useState(null);

  const loadTopicsAndParent = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedTopics, fetchedTopicTypes, fetchedParentTopic] = await Promise.all([        
        fetchTopicsByCategory([topic_type], parentId),
        fetchTopicsByCategory('-topic', parentId),
        fetchTopic(parentId)
      ]);
      const sortedTopics = fetchedTopics.sort((a, b) => a.title.localeCompare(b.title));
      const sortedTypes = fetchedTopicTypes.sort((a, b) => {
        const topicTypeComparison = a.topic_type.localeCompare(b.topic_type);
        if (topicTypeComparison === 0) {
          return a.title.localeCompare(b.title);
        }
        return topicTypeComparison;
      });      
      setTopics(sortedTopics);
      setTopicTypes(sortedTypes)
      setParentTopic(fetchedParentTopic);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  }, [parentId, topic_type]);

  useEffect(() => {
    loadTopicsAndParent();
    const savedExpandedIds = localStorage.getItem(`expandedTopics_${parentId}_${topic_type}`);
    if (savedExpandedIds) {
      setExpandedTopicIds(new Set(JSON.parse(savedExpandedIds)));
    }
    const savedParentExpanded = localStorage.getItem(`parentTopicExpanded_${parentId}`);
    setIsParentTopicExpanded(savedParentExpanded === 'true');
  }, [parentId, topic_type, loadTopicsAndParent]);

  const toggleTopicExpansion = (topicId) => {
    setExpandedTopicIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      localStorage.setItem(`expandedTopics_${parentId}_${topic_type}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const toggleParentTopicExpansion = () => {
    setIsParentTopicExpanded(prev => {
      const newState = !prev;
      localStorage.setItem(`parentTopicExpanded_${parentId}`, newState.toString());
      return newState;
    });
  };

  const handleAddTopic = (topicType = topic_type, toTopicId = parentId) => {
    setAddingTopicType(topicType);
    setAddingToTopicId(toTopicId);
    setIsAddModalOpen(true);
  };

  const handleAddComment = (topicId) => handleAddTopic('comment', topicId);
  const handleAddPrompt = (topicId) => handleAddTopic('prompt', topicId);
  const handleAddArtifact = (topicId) => handleAddTopic('artifact', topicId);

  const handleTopicAdded = () => {
    loadTopicsAndParent();
    setIsAddModalOpen(false);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTopic = async (updatedTopic) => {
    try {
      if (!updatedTopic || !updatedTopic.id) {
        throw new Error("Invalid topic data");
      }
      
      // Create an object with all fields that should be updated
      const updatedFields = {
        title: updatedTopic.title,
        subtitle: updatedTopic.subtitle,
        text: updatedTopic.text,
        prompt: updatedTopic.prompt,
        // Include any other fields that might be edited
      };
  
      // Remove undefined fields
      Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);
  
      // Log the updated fields for debugging
  
      await updateTopic(updatedTopic.id, updatedFields);
      setEditModalOpen(false);
      loadTopicsAndParent();
    } catch (error) {
      console.error("Error updating topic:", error);
      // Optionally, show an error message to the user
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await deleteTopic(topicId);
      loadTopicsAndParent();
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="TOPIC_TABLE_CONTAINER overflow-x-auto">
      <TopicTable 
        parentTopic={parentTopic}
        topics={topics}
        topicTypes={topicTypes}
        rowHeight={rowHeight}
        handleAddTopic={handleAddTopic}
        handleEditTopic={handleEditTopic}
        expandedTopicIds={expandedTopicIds}
        toggleTopicExpansion={toggleTopicExpansion}
        isParentTopicExpanded={isParentTopicExpanded}
        toggleParentTopicExpansion={toggleParentTopicExpansion}
        handleAddComment={handleAddComment}
        handleAddPrompt={handleAddPrompt}
        handleAddArtifact={handleAddArtifact}
        handleDeleteTopic={handleDeleteTopic}
      />

      <TopicModals 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editingTopic={editingTopic}
        handleEditChange={handleEditChange}
        handleSaveTopic={handleSaveTopic}
        parentId={addingToTopicId || parentId}
        topicType={addingTopicType || topic_type}
        onTopicAdded={handleTopicAdded}
        userId={user?.uid}
      />
    </div>
  );
};

export default TopicTableContainer;