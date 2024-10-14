// src/components/EditPropertyModal.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

const EditPropertyModal = ({ isOpen, onClose, onSave, topic, propertyToEdit }) => {
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (topic) {
      setEditedContent(topic[propertyToEdit] || '');
    }
  }, [topic, propertyToEdit]);

  const handleSave = () => {
    onSave(topic.id, propertyToEdit, editedContent);
    onClose();
  };

  return (
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] w-full h-full flex flex-col">
              <DialogHeader>
                <DialogTitle>topic.{propertyToEdit} of "{topic.title}"" </DialogTitle>
                
                {/* Buttons container inside the header */}
                <div className="flex justify-end space-x-2 mt-2">
                  <Button onClick={onClose}>Cancel</Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>

              </DialogHeader>

              <div className="flex-grow flex flex-col min-h-0">
                <textarea
                  style={{ height: 80 + 'em' }}
                  className="flex-grow w-full p-2 border rounded resize-none overflow-auto"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              </div>
              
              {/* Optional: Buttons at the bottom */}
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>

            </DialogContent>
          </Dialog>

  );
};

export default EditPropertyModal;