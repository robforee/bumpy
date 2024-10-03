import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { FiX } from 'react-icons/fi';

const PromptEditModal = ({
  isOpen,
  onClose,
  editingTopic,
  handleSaveTopic,
  handleGptQuery
}) => {
  const [localTopic, setLocalTopic] = useState(editingTopic);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalTopic(editingTopic);
  }, [editingTopic]);

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    setLocalTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitGptQuery = async () => {
    setIsLoading(true);
    try {
      const gptResponse = await handleGptQuery(localTopic.prompt);
      setLocalTopic(prev => ({ ...prev, text: gptResponse }));
    } catch (error) {
      console.error("Error submitting GPT query:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    handleSaveTopic(localTopic);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <FiX size={18} />
          </button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              value={localTopic.title || ''}
              onChange={handleLocalChange}
              placeholder="Title"
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="subtitle"
              name="subtitle"
              value={localTopic.subtitle || ''}
              onChange={handleLocalChange}
              placeholder="Subtitle"
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="prompt"
              name="prompt"
              value={localTopic.prompt || ''}
              onChange={handleLocalChange}
              placeholder="Prompt"
              className="col-span-4"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="text"
              name="text"
              value={localTopic.text || ''}
              onChange={handleLocalChange}
              placeholder="Text"
              className="col-span-4"
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmitGptQuery} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit to GPT'}
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditModal;