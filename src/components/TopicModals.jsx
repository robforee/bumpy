
// src/components/TopicModals.jsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { createTopic } from '@/src/app/actions/topic-actions';
import PromptEditModal from './PromptEditModal';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const TopicModals = ({
  isAddModalOpen,
  setIsAddModalOpen,
  editModalOpen,
  setEditModalOpen,
  editingTopic,
  handleEditChange,handleSaveTopic,
  handleSavePrompt, handleGptQuery, handleConceptQuery,
  topicId,
  topicType,
  onTopicAdded,
  userId
}) => {
  const [newTopic, setNewTopic] = useState({ title: '', subtitle: '', text: '', prompt: '' });

  const handleAddTopicChange = (e) => {

    const { name, value } = e.target;
    setNewTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTopicSubmit = async () => {
    const idToken = await getIdToken(auth.currentUser);
    
    try {
      if (!userId) {
        throw new Error("User ID is required to create a topic");
      }
      const topicModel = {...newTopic, topic_type: topicType }
      const cleanedData = Object.entries(topicModel).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await createTopic(topicId,cleanedData, idToken);
      
      setNewTopic({ title: '', subtitle: '', text: '', prompt: '' });
      setIsAddModalOpen(false);

      if (onTopicAdded) onTopicAdded();
    } catch (error) {
      console.error("Error adding new topic:", error);
      alert("Error adding new topic: " + error.message);
    }
  };

  
  return (
    <>
      {/* Add New Topic Modal */}
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
            {topicType === 'prompt' && (
              <Textarea
                name="prompt"
                value={newTopic.prompt}
                onChange={handleAddTopicChange}
                placeholder="Prompt"
                rows={4}
              />
            )}
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
      {editingTopic && editingTopic.topic_type !== 'x-prompt' ? (
        <PromptEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          editingTopic={editingTopic}
          handleSaveTopic={handleSavePrompt}
          handleGptQuery={handleGptQuery}
          handleConceptQuery={handleConceptQuery}
        />
      ) : (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic:</DialogTitle>
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
              <Button onClick={() => handleSaveTopic(editingTopic)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TopicModals;