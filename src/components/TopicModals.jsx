// src/components/TopicModals.jsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import AddTopicModal from './AddTopicModal';

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
  onTopicAdded
}) => {
  return (
    <>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <AddTopicModal
          onClose={() => setIsAddModalOpen(false)}
          parentId={parentId}
          topicType={topicType}
          onTopicAdded={onTopicAdded}
        />
      </Dialog>

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