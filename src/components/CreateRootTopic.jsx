// src/components/CreateRootTopic.jsx
"use client";

import React, { useState } from 'react';
import { createRootTopic } from '../lib/topicOperations';

const CreateRootTopic = ({ user }) => {
  const [title, setTitle] = useState("Root Topic");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!user) {
      setMessage("You must be logged in to create a root topic.");
      return;
    }

    try {
      const rootTopicId = await createRootTopic(title, user.uid);
      setMessage(`Root topic created successfully with ID: ${rootTopicId}`);
    } catch (error) {
      setMessage(`Error creating root topic: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Create Root Topic</h2>
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Root Topic Title"
      />
      <button onClick={handleCreate}>Create Root Topic</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateRootTopic;