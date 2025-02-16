// src/components/AddTopicModal.jsx
"use client"

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { addTopic_fromClient } from '@/src/app/actions/topic-client-actions';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { useUser } from '@/src/contexts/UserProvider';

const AddTopicModal = ({ onClose, parentId, topicType, onTopicAdded }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const { user } = useUser();

  const handleSubmit = async () => {
    if (!user) {
      console.error("User must be logged in to add a topic");
      return;
    }

    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await addTopic_fromClient(parentId, { topic_type: topicType, title, text }, idToken);
      if (result.success) {
        console.log('New topic added:', result.id);
        onClose();
        onTopicAdded();
      } else {
        console.error("Error adding new topic:", result.error);
      }
    } catch (error) {
      console.error("Error adding new topic:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add New {topicType}</h2>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Enter ${topicType} title`}
        className="mb-4 w-full"
      />
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Enter ${topicType} content`}
        className="mb-4 w-full"
        rows={5}
      />
      <div className="flex justify-end space-x-2">
        <Button onClick={handleSubmit}>Save</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  );
};

export default AddTopicModal;