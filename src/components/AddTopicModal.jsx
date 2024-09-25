// src/components/AddTopicModal.jsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/src/components/ui/Dialog';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';

import { addTopic } from '@/src/lib/firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { db_viaClient, functions } from '@/src/lib/firebase/clientApp';
import { useUser } from '@/src/contexts/UserContext';

const AddTopicModal = ({ isOpen, onClose, parentId, topicType, onTopicAdded }) => {
  const [title, setTitle] = useState('');
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (openForEditing) => {
    if (!user) {
      console.error("User must be logged in to add a topic");
      return;
    }
    const addTopicFunction = httpsCallable(functions, 'addTopic');

    try {
      console.log('using cloud function')
      //const newTopicId = await addTopic(db, parentId, { topic_type: topicType, title }, user.uid);
      const result = await addTopicFunction({ parentId, topicData: { topic_type: topicType, title } });
      const newTopicId = result.data.id;
      console.log(newTopicId)
      //onClose();
      //onTopicAdded(); // Call the callback to trigger a refresh
      if (openForEditing) {
        router.push(`/topics/${newTopicId}?edit=true`);
      }
    } catch (error) {
      console.error("Error adding new topic:", error);
    }
  };

  return (
    
    <div>
      <h2 className="text-xl font-bold mb-4">Add New {topicType}</h2>
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Enter ${topicType} title`}
        className="mb-4"
      />
      <div className="flex justify-end space-x-2">
        <Button onClick={() => handleSubmit(false)}>Save</Button>
        <Button onClick={() => handleSubmit(true)}>Save and Edit</Button>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
      </div>
    </div>
  );
};

export default AddTopicModal;