// src/components/TopicEditor.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { updateDocument } from '../lib/firebase/firestore';

const TopicEditor = ({ topic }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState(topic);
  
  const debouncedSave = useCallback(
    debounce((newTopic) => {
      updateDocument('topics', newTopic.id, newTopic).catch(console.error);
    }, 1000),
    []
  );

  useEffect(() => {
    if (isEditing) {
      debouncedSave(editedTopic);
    }
  }, [editedTopic, isEditing, debouncedSave]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTopic(prev => ({ ...prev, [name]: value }));
  };

  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
  };

  if (isEditing) {
    return (
      <div className="space-y-4 transition-all duration-300 ease-in-out">
        <input
          type="text"
          name="title"
          value={editedTopic.title}
          onChange={handleInputChange}
          className="w-full text-3xl font-bold p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300"
          placeholder="Topic Title"
        />
        <input
          type="text"
          name="subtitle"
          value={editedTopic.subtitle}
          onChange={handleInputChange}
          className="w-full text-xl text-gray-600 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300"
          placeholder="Subtitle"
        />
        <textarea
          name="text"
          value={editedTopic.text}
          onChange={handleInputChange}
          className="w-full h-64 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300"
          placeholder="Topic content (Markdown supported)"
        />
        <button 
          onClick={toggleEditMode} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Save & View
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <h1 className="text-3xl font-bold">{editedTopic.title}</h1>
      <h2 className="text-xl text-gray-600">{editedTopic.subtitle}</h2>
      <div className="prose max-w-none mt-4">
        <ReactMarkdown>{editedTopic.text}</ReactMarkdown>
      </div>
      <button 
        onClick={toggleEditMode} 
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        Edit
      </button>
    </div>
  );
};

// Debounce function (same as before)
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

export default TopicEditor;