// src/components/TopicTable.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { DeleteConfirmationDialog } from '@/src/components/ui/dialog';
import TopicTableContainer from './TopicTableContainer';

const markdownStyles = `
  .markdown-content ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  .markdown-content ol {
    list-style-type: decimal;
    padding-left: 20px;
  }
  .markdown-content li {
    margin-bottom: 5px;
  }
`;

const formatDate = (date) => {
  if (!(date instanceof Date)) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const TopicTable = ({ 
  parentTopic,
  topics, 
  rowHeight, 
  handleAddTopic, 
  handleEditTopic, 
  expandedTopicIds, 
  toggleTopicExpansion, 
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  handleDeleteTopic
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

  if(!topics.length) return (<></>)

  return (
    
    <div className="min-w-full bg-white shadow-[0_0_10px_rgba(0,255,0,0.5)] border border-green-300">
      <style jsx global>{markdownStyles}</style>
      
      {/* {topics[0]?.topic_type} <span>about &nbsp;</span>{parentTopic.title} */}

        {parentTopic.text && 
              <p className="mt-2">            
                <div className="max-w-full overflow-x-auto px-4">
                  <ReactMarkdown className={`markdown-content text-blue-600 italic`}>
                    {parentTopic.text}
                  </ReactMarkdown>
                </div>            
              </p>}        
      {/* LOOP THROUGH TOPICS */}
      {topics.slice(0, 100).map((topic) => (
        <div key={topic.id} className="border-b border-gray-200 stufff">
          <div className="flex flex-col">
            <div 
              className={`${rowHeight} px-6 py-2 hover:bg-gray-100 flex items-center`}
              onMouseEnter={() => setHoveredRow(topic.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* expansion toggle chevron */}
              <button onClick={() => toggleTopicExpansion(topic.id)} className="mr-2">
                <FiChevronRight size={14} className={expandedTopicIds.has(topic.id) ? 'transform rotate-90' : ''} />
              </button>

              {/* navigate to topic with title and subtitle */}
              <Link href={`/topics/${topic.id}`} className="font-medium flex-grow">
                <span className="font-bold">{topic.title}</span>
                {topic.subtitle && (
                  <span className="text-gray-500 ml-2">: {topic.subtitle}</span>
                )}
              </Link>
              
              {hoveredRow === topic.id && (
                <div className="ml-2 flex items-center">
                  {/* edit button */}
                  <button
                    onClick={() => handleEditTopic(topic)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiEdit size={14} />
                  </button>

                  {/* last update time */}
                  <div className="relative inline-block ml-2 group">
                    <FiClock size={14} className="text-gray-500" />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2">
                      {formatDate(new Date(topic.updated_at))}
                    </span>
                  </div>

                  {/* add comment button */}
                  <button onClick={() => handleAddComment(topic.id)} className="ml-2" title="Add Comment">
                    <FiPlusCircle size={14} />
                  </button>

                  {/* add prompt button */}
                  <button onClick={() => handleAddPrompt(topic.id)} className="ml-2" title="Add Prompt">
                    <FiPlusCircle size={14} />
                  </button>

                  {/* add artifact button */}
                  <button onClick={() => handleAddArtifact(topic.id)} className="ml-2" title="Add Artifact">
                    <FiPlusCircle size={14} />
                  </button>

                  {/* delete button */}
                  <button onClick={() => openDeleteConfirm(topic)} className="ml-2 text-red-500 hover:text-red-700" title="Delete Topic">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* collapsable markdown content */}
            {expandedTopicIds.has(topic.id) && (
              <div className="pl-12 pr-6 py-2 bg-gray-200">
                <div className="max-w-full overflow-x-auto px-4 bg-blue-200">
                  <ReactMarkdown className="markdown-content text-blue-600">
                    {topic.text}
                  </ReactMarkdown>
                </div>
                {/* COMMENTS */}
                {topic.topic_type == 'topic' ?
                  <div className="mt-4">
                      Comments about {topic.title}
                    <TopicTableContainer
                      parentId={topic.id}
                      topic_type="comment"
                      rowHeight={rowHeight}
                    />
                  </div>
                : ''}

                {/*  PROMPTS */}
                {topic.topic_type == 'topic' ?
                <div className="mt-4">
                  Prompts about {topic.title}
                  <TopicTableContainer 
                    parentId={topic.id}
                    topic_type="prompt"
                    rowHeight={rowHeight}
                  />
                </div>
                : ''}

                {/* ARTIFACTS */}
                {topic.topic_type == 'topic' ?
                  <div className="mt-4">
                      Artifacts about {topic.title}
                    <TopicTableContainer
                      parentId={topic.id}
                      topic_type="artifact"
                      rowHeight={rowHeight}
                    />
                  </div>
                : ''}
              </div>
            )}
          </div>
        </div>
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