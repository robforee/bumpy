import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { FiX, FiMaximize, FiMinimize } from 'react-icons/fi';

const PromptEditModal = ({
  isOpen,
  onClose,
  editingTopic,
  handleSaveTopic,
  handleGptQuery
}) => {
  const [localTopic, setLocalTopic] = useState(editingTopic);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const promptTextareaRef = useRef(null);
  const textTextareaRef = useRef(null);
  const dialogContentRef = useRef(null);

  useEffect(() => {
    setLocalTopic(editingTopic);
  }, [editingTopic]);

  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (dialogContentRef.current) {
        dialogContentRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleWheel = (e) => {
    e.stopPropagation();
  };

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    setLocalTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitGptQuery = async () => {
    setIsLoading(true);
    try {
      const gptResponse = await handleGptQuery(localTopic.prompt);
      const updatedTopic = { ...localTopic, text: gptResponse };
      setLocalTopic(updatedTopic);
      
      // Automatically save the topic after receiving the GPT response
      await handleSaveTopic(updatedTopic);
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

  const togglePromptExpansion = () => {
    setIsPromptExpanded(!isPromptExpanded);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full flex flex-col" ref={dialogContentRef}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Prompt</DialogTitle>
          <div className="flex justify-between items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePromoteText}>
              Promote Text to Prompt
            </Button>
            <Button variant="outline" size="sm" onClick={handleSubmitGptQuery} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit to GPT'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>Save</Button>
            <Button variant="outline" size="sm" onClick={togglePromptExpansion}>
              {isPromptExpanded ? <FiMinimize /> : <FiMaximize />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <FiX />
            </Button>
          </div>
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
            className={`resize-none overflow-auto ${isPromptExpanded ? 'h-[calc(100vh-300px)]' : 'h-[200px]'}`}
          />
          <Textarea
            ref={textTextareaRef}
            id="text"
            name="text"
            value={localTopic.text || ''}
            onChange={handleLocalChange}
            placeholder="Text"
            className={`resize-none overflow-auto ${isPromptExpanded ? 'h-0' : 'h-[200px]'}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditModal;