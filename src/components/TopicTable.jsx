// src/components/TopicTable.jsx

import React, { useState } from 'react';
import { DeleteConfirmationDialog } from '@/src/components/ui/dialog';
import TopicRow from './TopicRow';
import TopicHeaderRow from './TopicHeaderRow';

const TopicTable = ({ 
  currentTopic,
  topics, 
  topicTypes,
  rowHeight, 
  expandedSubTopicIds, 
  toggleSubTopicExpansion,
  isCurrentTopicExpanded,
  toggleCurrentTopicExpansion,
  
  handleAddTopic, 
  handleSaveTopic,
  handleEditTopic, 
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  handleDeleteTopic,
  handleAutoSubtopics,
  handleConceptQuery,
  handleFetchContext
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  const openDeleteConfirm = (topic) => {
    setTopicToDelete(topic);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (topicToDelete) {
      handleDeleteTopic(topicToDelete.id);
      setDeleteConfirmOpen(false);
      setTopicToDelete(null);
    }
  };

  return (
    <div className="min-w-full bg-white shadow-[0_0_10px_rgba(0,255,0,0.5)] border border-green-300">
      
      <TopicHeaderRow
        currentTopic={currentTopic}
        isCurrentTopicExpanded={isCurrentTopicExpanded}
        toggleCurrentTopicExpansion={toggleCurrentTopicExpansion}

        handleSaveTopic={handleSaveTopic}
        handleEditTopic={handleEditTopic}

        handleFetchContext={handleFetchContext}
        handleConceptQuery={handleConceptQuery}

        handleAddTopic={handleAddTopic}
        handleAddComment={handleAddComment}
        handleAddPrompt={handleAddPrompt}
        handleAddArtifact={handleAddArtifact}
        handleAutoSubtopics={handleAutoSubtopics}

        rowHeight={rowHeight}
      />

      {/* LOOP THROUGH TOPICS */}
      {/* <div className="px-6">SUB-TOPICS of {currentTopic.title} </div> */}
      {topics.length === 0 ? <div className="px-8 py-2 text-red-800">no sub-topics found</div> : ''}
      
      {topics.slice(0, 100).map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          rowHeight={rowHeight}
          expandedSubTopicIds={expandedSubTopicIds}
          toggleSubTopicExpansion={toggleSubTopicExpansion}
          handleEditTopic={handleEditTopic}
          handleAddComment={handleAddComment}
          handleAddPrompt={handleAddPrompt}
          handleAddArtifact={handleAddArtifact}
          openDeleteConfirm={openDeleteConfirm}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          handleSaveTopic={handleSaveTopic}
        />
      ))}

      {/* LOOP THROUGH TOPIC TYPES */}
      <div className="px-6"> ACTIONS for {currentTopic.title} </div>
      {topicTypes.length === 0 ? <div className="px-8 py-2 text-red-800">no actions found</div> : ''}
      {topicTypes.slice(0, 100).map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          rowHeight={rowHeight}
          expandedSubTopicIds={expandedSubTopicIds}
          toggleSubTopicExpansion={toggleSubTopicExpansion}
          handleEditTopic={handleEditTopic}
          handleAddComment={handleAddComment}
          handleAddPrompt={handleAddPrompt}
          handleAddArtifact={handleAddArtifact}
          openDeleteConfirm={openDeleteConfirm}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          handleSaveTopic={handleSaveTopic}
        />
      ))}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TopicTable;