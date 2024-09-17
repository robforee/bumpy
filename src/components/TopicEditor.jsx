// src/components/TopicEditor.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { updateDocument } from '../lib/firebase/firestore';

const TopicEditor = ({ topic }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState({
    id: topic.id,
    title: topic.title || '',
    subtitle: topic.subtitle || '',
    text: topic.text || ''
  });
  
  const debouncedSave = useCallback(
    debounce((newTopic) => {
      if (newTopic.id) {
        updateDocument('topics', newTopic.id, {
          title: newTopic.title,
          subtitle: newTopic.subtitle,
          text: newTopic.text
        }).catch(error => console.error("Error updating document:", error));
      } else {
        console.error("Cannot update topic: missing id");
      }
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
        <div className="border rounded p-2 bg-gray-50">
          <textarea
            name="text"
            value={editedTopic.text}
            onChange={handleInputChange}
            className="w-full h-96 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300 bg-white resize-none overflow-y-auto"
            placeholder="Topic content (Markdown supported)"
          />
        </div>
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
      <h1 
        className="text-3xl font-bold border-b pb-2 cursor-pointer hover:bg-gray-100 transition duration-300" 
        onClick={toggleEditMode}
      >
        {editedTopic.title}
      </h1>
      <h2 
        className="text-xl text-gray-600 italic cursor-pointer hover:bg-gray-100 transition duration-300" 
        onClick={toggleEditMode}
      >
        {editedTopic.subtitle}
      </h2>
      <div 
        className="border rounded p-4 bg-gray-50 h-96 overflow-y-auto cursor-pointer hover:bg-gray-100 transition duration-300" 
        onClick={toggleEditMode}
      >
        {editedTopic.text ? (
          <div className="prose max-w-none">
            <ReactMarkdown>{editedTopic.text}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 italic">No content available. Click here to add content.</p>
        )}
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