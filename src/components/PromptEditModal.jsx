import React, { useState, useEffect, useRef } from 'react';
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
  const promptTextareaRef = useRef(null);

  useEffect(() => {
    setLocalTopic(editingTopic);
  }, [editingTopic]);

  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, [localTopic.prompt]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    handleSaveTopic(localTopic);
    onClose();
  };

  const handlePromoteText = () => {
    setLocalTopic(prev => ({ ...prev, prompt: prev.text }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <FiX size={18} />
          </button>
        </DialogHeader>
        <div className="flex-grow grid gap-4 py-4 overflow-y-auto">
          <Input
            id="title"
            name="title"
            value={localTopic.title || ''}
            onChange={handleLocalChange}
            placeholder="Title"
          />
          <Input
            id="subtitle"
            name="subtitle"
            value={localTopic.subtitle || ''}
            onChange={handleLocalChange}
            placeholder="Subtitle"
          />
          <Textarea
            ref={promptTextareaRef}
            id="prompt"
            name="prompt"
            value={localTopic.prompt || ''}
            onChange={handleLocalChange}
            placeholder="Prompt"
            className="min-h-[100px] resize-none overflow-hidden"
          />
          <Textarea
            id="text"
            name="text"
            value={localTopic.text || ''}
            onChange={handleLocalChange}
            placeholder="Text"
            rows={10}
            className="min-h-[250px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePromoteText}>
            Promote Text to Prompt
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