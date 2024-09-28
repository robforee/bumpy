// src/components/TopicModals.jsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { addTopic } from '@/src/lib/firebase/firestore';
import { db_viaClient } from '@/src/lib/firebase/clientApp';

const TopicModals = ({
  isAddModalOpen,
  setIsAddModalOpen,
  editModalOpen,
  setEditModalOpen,
  editingTopic,
  handleEditChange,
  handleSaveTopic,
  parentId,
  topicType,
  onTopicAdded,
  userId  // Add this new prop
}) => {
  const [newTopic, setNewTopic] = useState({ title: '', subtitle: '', text: '' });

  const handleAddTopicChange = (e) => {
    const { name, value } = e.target;
    setNewTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTopicSubmit = async () => {
    try {
      if (!userId) {
        throw new Error("User ID is required to create a topic");
      }
      await addTopic(db_viaClient, parentId, {
        ...newTopic,
        topic_type: topicType
      }, userId);  // Pass the userId here
      setNewTopic({ title: '', subtitle: '', text: '' });
      setIsAddModalOpen(false);
      if (onTopicAdded) onTopicAdded();
    } catch (error) {
      console.error("Error adding new topic:", error);
      // You might want to show this error to the user
      alert("Error adding new topic: " + error.message);
    }
  };

  return (
    <>
      {/* Add Topic Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {topicType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              name="title"
              value={newTopic.title}
              onChange={handleAddTopicChange}
              placeholder="Title"
            />
            <Input
              name="subtitle"
              value={newTopic.subtitle}
              onChange={handleAddTopicChange}
              placeholder="Subtitle"
            />
            <Textarea
              name="text"
              value={newTopic.text}
              onChange={handleAddTopicChange}
              placeholder="Text"
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleAddTopicSubmit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              name="title"
              value={editingTopic?.title || ''}
              onChange={handleEditChange}
              placeholder="Title"
            />
            <Input
              name="subtitle"
              value={editingTopic?.subtitle || ''}
              onChange={handleEditChange}
              placeholder="Subtitle"
            />
            <Textarea
              name="text"
              value={editingTopic?.text || ''}
              onChange={handleEditChange}
              placeholder="Text"
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleSaveTopic}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopicModals;