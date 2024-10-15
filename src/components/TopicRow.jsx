// src/components/TopicRow.jsx

import React, { useState } from 'react';
import Link from 'next/link';
import { FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EditPropertyModal from './EditPropertyModal';

const TopicRow = ({
  topic,
  rowHeight,
  expandedTopicIds,
  toggleTopicExpansion,
  handleEditTopic,
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  openDeleteConfirm,
  hoveredRow,
  setHoveredRow,
  handleSaveTopic
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isConceptExpanded, setIsConceptExpanded] = useState(false);

  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 text-blue-600" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3 text-blue-500" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-medium my-2 text-blue-400" {...props} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  };

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

  const handleEditProperty = (property) => {
    setPropertyToEdit(property);
    setIsEditModalOpen(true);
  };

  const handleSaveProperty = (topicId, property, value) => {
    const updatedTopic = { ...topic, [property]: value };
    handleSaveTopic(updatedTopic);
  };

  const renderContent = () => {
    switch (topic.topic_type) {
      case 'topic':
      case 'comment':
      case 'artifact':
        return topic.text;
      case 'concept':
        return topic.concept;
      case 'prompt':
        return topic.prompt;
      default:
        return 'No content available';
    }
  };

  const toggleTextExpansion = () => {
    setIsTextExpanded(!isTextExpanded);
    if (!isTextExpanded) setIsConceptExpanded(false);
  };

  const toggleConceptExpansion = () => {
    setIsConceptExpanded(!isConceptExpanded);
    if (!isConceptExpanded) setIsTextExpanded(false);
  };


  return (
    <div className={`TOPIC_ROW border-b border-gray-200 ${
      topic.topic_type === "artifact"
        ? "bg-blue-100"
        : topic.topic_type === "comment"
        ? "bg-green-100"
        : topic.topic_type === "prompt"
        ? "bg-purple-100"
        : "bg-gray-100"
    }`}>
      <div className="flex flex-col">
        <div 
          className={`${rowHeight} px-10 py-2 hover:bg-gray-100 flex items-center`}
          onMouseEnter={() => setHoveredRow(topic.id)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          <button onClick={toggleTextExpansion} className="mr-2">
            <FiChevronRight 
              size={14} 
              className={isTextExpanded ? 'transform rotate-90' : ''}
            />
          </button>
          <button onClick={toggleConceptExpansion} className="mr-2">
            <FiChevronRight 
              size={14} 
              className={`text-blue-500 ${isConceptExpanded ? 'transform rotate-90' : ''}`}
            />
          </button>
          {/* title and subtitle */}
          <Link href={`/topics/${topic.id}`} className="font-medium flex-grow">
            <span className="font-bold">{topic.title}</span>
            {topic.subtitle && (
              <span className="text-red-700 ml-2"> {topic.subtitle}</span>
            )}
          </Link>
          
          {topic.topic_type === 'topic' ? '' : <span>[{topic.topic_type}]</span>} &nbsp;

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

        {/* Text content area */}
        {isTextExpanded && (
          <div 
            className="pl-12 pr-6 py-2 bg-gray-100 cursor-pointer"
            onClick={() => handleEditProperty('text')}
          >
            <h3 className="text-lg font-semibold mb-2">topic.text of {topic.title} </h3>
            {!topic.text ? (
              <div className="px-0 py-2 text-red-800">No text content available</div>
            ) : (
              <ReactMarkdown 
                components={markdownComponents}
                className="markdown-content text-blue-600 italic"
              >
                {topic.text}
              </ReactMarkdown>
            )}
          </div>
        )}

        {/* Concept content area */}
        {isConceptExpanded && (
          <div className="pl-12 pr-6 py-2 bg-gray-100">
            <div 
              className="cursor-pointer mb-4"
              onClick={() => handleEditProperty('concept')}
            >
              <h3 className="text-lg font-semibold mb-2">Concept</h3>
              {!topic.concept ? (
                <div className="px-0 py-2 text-red-800">No concept available</div>
              ) : (
                <ReactMarkdown 
                  components={markdownComponents}
                  className="markdown-content text-green-600 italic"
                >
                  {topic.concept}
                </ReactMarkdown>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Concept JSON</h3>
              {!topic.concept_json ? (
                <div className="px-0 py-2 text-red-800">No concept JSON available</div>
              ) : (
                <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                  {JSON.stringify(JSON.parse(topic.concept_json), null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProperty}
        topic={topic}
        propertyToEdit={propertyToEdit}
      />
    </div>
  );
};

export default TopicRow;