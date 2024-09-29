// src/components/TopicListTable.jsx
import React, { useState, useEffect } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import { useUser } from '@/src/contexts/UserContext';  // Add this import

import { fetchTopicsByCategory, updateTopic } from '@/src/lib/topicFirebaseOperations';
import TopicTable from './TopicTable';
import TopicModals from './TopicModals';


const TopicListTable = ({ parentId, topic_type, rowHeight }) => {
  const { user } = useUser();  // Add this line to get the user
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedTopicIds, setExpandedTopicIds] = useState(new Set());
  const [addingCommentToTopicId, setAddingCommentToTopicId] = useState(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const fetchedTopics = await fetchTopicsByCategory([topic_type], parentId);
      const sortedTopics = fetchedTopics.sort((a, b) => a.title.localeCompare(b.title));
      setTopics(sortedTopics);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching topics:", err);
      setError("Failed to load topics. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
    const savedExpandedIds = localStorage.getItem(`expandedTopics_${parentId}_${topic_type}`);
    if (savedExpandedIds) {
      setExpandedTopicIds(new Set(JSON.parse(savedExpandedIds)));
    }
  }, [parentId, topic_type]);

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

  const handleAddTopic = () => {
    setIsAddModalOpen(true);
  };

  const handleAddComment = (topicId) => {
    setAddingCommentToTopicId(topicId);
    setIsAddModalOpen(true);
  };

  const handleTopicAdded = () => {
    loadTopics();
    setIsAddModalOpen(false);
    setAddingCommentToTopicId(null);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
    setHasChanges(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTopic(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSaveTopic = async () => {
    try {
      if (!editingTopic || !editingTopic.id) {
        throw new Error("Invalid topic data");
      }
      const updatedTopic = await updateTopic(editingTopic.id, {
        title: editingTopic.title,
        subtitle: editingTopic.subtitle,
        text: editingTopic.text
      });
      setEditModalOpen(false);
      setTopics(prevTopics => 
        prevTopics.map(t => t.id === updatedTopic.id ? {...t, ...updatedTopic} : t)
      );
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
{/* 
      big add topic button when empty table
*/}
        <TopicTable 
          topics={topics}
          rowHeight={rowHeight}
          handleAddTopic={handleAddTopic}
          handleEditTopic={handleEditTopic}
          expandedTopicIds={expandedTopicIds}
          toggleTopicExpansion={toggleTopicExpansion}
          handleAddComment={handleAddComment}
        />


      {/* Modals */}
      <TopicModals 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editingTopic={editingTopic}
        handleEditChange={handleEditChange}
        handleSaveTopic={handleSaveTopic}
        parentId={addingCommentToTopicId || parentId}
        topicType={addingCommentToTopicId ? 'comment' : topic_type}
        onTopicAdded={handleTopicAdded}
        userId={user?.uid}  // Add this line to pass the user ID
      />
    </div>
  );
};

export default TopicListTable;