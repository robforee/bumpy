// src/components/PromptEditor.jsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { functions } from '@/src/lib/firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
import { useUser } from '@/src/contexts/UserProvider';
import { updateDocument } from '@/src/lib/firebase/firestore';

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const PromptEditor = ({ topic }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState({
    id: topic.id,
    title: topic.title || '',
    system_prompt: topic.system_prompt || '',
    response_format: topic.response_format || '{ "type": "json_object" }',
    model: topic.model || 'gpt-4-mini',
    content: topic.content || '',
    user_prompt: topic.user_prompt || ''
  });

  const { user } = useUser();
  const runOpenAIAndAddTopic = httpsCallable(functions, 'runOpenAIAndAddTopic');

  const saveChanges = useCallback((newTopic) => {
    if (newTopic.id) {
      console.log("Saving topic:", newTopic);
      updateDocument('topics', newTopic.id, {
        title: newTopic.title,
        system_prompt: newTopic.system_prompt,
        response_format: newTopic.response_format,
        model: newTopic.model,
        content: newTopic.content,
        user_prompt: newTopic.user_prompt
      }).then(() => console.log("Save successful"))
        .catch(error => console.error("Error updating document:", error));
    } else {
      console.error("Cannot update topic: missing id");
    }
  }, []);

  const debouncedSave = useMemo(
    () => debounce(saveChanges, 1000),
    [saveChanges]
  );

  useEffect(() => {
    if (isEditing) {
      debouncedSave(editedTopic);
    }
  }, [editedTopic, isEditing, debouncedSave]);

  useEffect(() => {
    setEditedTopic({
      id: topic.id,
      title: topic.title || '',
      system_prompt: topic.system_prompt || '',
      response_format: topic.response_format || '{ "type": "json_object" }',
      model: topic.model || 'gpt-4-mini',
      content: topic.content || '',
      user_prompt: topic.user_prompt || ''
    });
  }, [topic]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTopic(prev => ({ ...prev, [name]: value }));
  };

  const toggleEditMode = () => {
    setIsEditing(prev => {
      if (prev) {
        debouncedSave(editedTopic);
      }
      return !prev;
    });
  };

  const handleRunPrompt = async () => {
    if (!user) {
      console.error("User must be logged in to run prompt");
      return;
    }

    try {
      const request = {
        model: editedTopic.model,
        temp: 0.1,
        response_format: JSON.parse(editedTopic.response_format),
        messages: [
          { role: "system", content: editedTopic.system_prompt },
          { role: "user", content: editedTopic.user_prompt }
        ],
        parentId: topic.id,
        title: editedTopic.title,
        owner: user.uid
      };
      const result = await runOpenAIAndAddTopic(request);

      const updatedTopic = { ...editedTopic, content: result.data.content };
      setEditedTopic(updatedTopic);
      
      // Trigger an immediate save
      saveChanges(updatedTopic);
      
      // Switch to view mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error running prompt:", error);
    }
  };

  const isRunPromptDisabled = !editedTopic.system_prompt || !editedTopic.user_prompt || 
                              !editedTopic.response_format || !editedTopic.model;

  if (isEditing) {
    return (
      <div className="space-y-4 transition-all duration-300 ease-in-out">
        <Input
          type="text"
          name="title"
          value={editedTopic.title}
          onChange={handleInputChange}
          placeholder="Enter title"
          className="w-full text-3xl font-bold"
        />
        <Input
          type="text"
          name="system_prompt"
          value={editedTopic.system_prompt}
          onChange={handleInputChange}
          placeholder="Enter system prompt"
        />
        <Input
          type="text"
          name="response_format"
          value={editedTopic.response_format}
          onChange={handleInputChange}
          placeholder="Enter response format"
        />
        <Input
          type="text"
          name="model"
          value={editedTopic.model}
          onChange={handleInputChange}
          placeholder="Enter model"
        />
        <Textarea
          name="user_prompt"
          value={editedTopic.user_prompt}
          onChange={handleInputChange}
          placeholder="Enter your prompt"
          className="h-32"
        />
        <Textarea
          name="content"
          value={editedTopic.content}
          onChange={handleInputChange}
          placeholder="Prompt response will appear here"
          className="h-64"
        />
        <div className="flex justify-end space-x-2">
          <Button onClick={handleRunPrompt} disabled={isRunPromptDisabled}>Run Prompt</Button>
          <Button onClick={toggleEditMode}>Save & View</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <h1 className="text-3xl font-bold border-b pb-2 cursor-pointer hover:bg-gray-100 transition duration-300" onClick={toggleEditMode}>
        {editedTopic.title}
      </h1>
      <div className="space-y-2">
        <p><strong>System Prompt:</strong> {editedTopic.system_prompt}</p>
        <p><strong>Response Format:</strong> {editedTopic.response_format}</p>
        <p><strong>Model:</strong> {editedTopic.model}</p>
        <p><strong>User Prompt:</strong> {editedTopic.user_prompt}</p>
      </div>
      <div className="border rounded p-4 bg-gray-50 h-96 overflow-y-auto cursor-pointer hover:bg-gray-100 transition duration-300" onClick={toggleEditMode}>
        {editedTopic.content ? (
          <pre>{editedTopic.content}</pre>
        ) : (
          <p className="text-gray-400 italic">No content available. Click here to add content.</p>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button onClick={handleRunPrompt} disabled={isRunPromptDisabled}>Run Prompt</Button>
        <Button onClick={toggleEditMode}>Edit</Button>
      </div>
    </div>
  );
};

export default PromptEditor;