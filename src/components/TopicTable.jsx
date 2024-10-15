import React, { useState } from 'react';
import { DeleteConfirmationDialog } from '@/src/components/ui/dialog';
import TopicRow from './TopicRow';
import TopicParentRow from './TopicParentRow';

const TopicTable = ({ 
  thisTopic,
  topics, 
  topicTypes,
  rowHeight, 
  expandedTopicIds, 
  toggleTopicExpansion,
  isParentTopicExpanded,
  toggleParentTopicExpansion,

  handleAddTopic, 
  handleEditTopic, 
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  handleDeleteTopic,
  handleAutoSubtopics,
  handleSaveTopic,
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
      
      <TopicParentRow
        thisTopic={thisTopic}
        isParentTopicExpanded={isParentTopicExpanded}
        toggleParentTopicExpansion={toggleParentTopicExpansion}

        handleEditTopic={handleEditTopic}
        handleAddTopic={handleAddTopic}
        handleAddComment={handleAddComment}
        handleAddPrompt={handleAddPrompt}
        handleAddArtifact={handleAddArtifact}
        handleAutoSubtopics={handleAutoSubtopics}
        handleSaveTopic={handleSaveTopic}
        handleConceptQuery={handleConceptQuery}
        handleFetchContext={handleFetchContext}

        rowHeight={rowHeight}
        
      />

      {/* LOOP THROUGH TOPICS */}
      <div className="px-6">SUB-TOPICS of {thisTopic.title} </div>
      {topics.length == 0 ? <div className="px-8 py-2 text-red-800">no sub-topics found</div> : ''}
      
      {topics.slice(0, 100).map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          rowHeight={rowHeight}
          expandedTopicIds={expandedTopicIds}
          toggleTopicExpansion={toggleTopicExpansion}
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
      <div className="px-6"> ACTIONS for {thisTopic.title} </div>
      {topicTypes.length == 0 ? <div className="px-8 py-2 text-red-800">no actions found</div> : ''}
      {topicTypes.slice(0, 100).map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          rowHeight={rowHeight}
          expandedTopicIds={expandedTopicIds}
          toggleTopicExpansion={toggleTopicExpansion}
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