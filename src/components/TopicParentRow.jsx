import React, { useState } from 'react';
import { FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiPlus } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const TopicParentRow = ({
  parentTopic,
  isParentTopicExpanded,
  toggleParentTopicExpansion,
  handleEditTopic,
  handleAddTopic,
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  rowHeight
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!parentTopic.text) return null;

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

  return (
    <div className="TOPIC_PARENT mt-2 parent-info relative cursor-pointer border-b border-gray-200">
      <div 
        className={`${rowHeight} px-6 py-2 hover:bg-gray-100 flex items-center`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button onClick={toggleParentTopicExpansion} className="mr-2">
          <FiChevronRight 
            size={14} 
            className={isParentTopicExpanded ? 'transform rotate-90' : ''}
          />
        </button>
        <div className="font-medium flex-grow">
          <span className="font-bold text-blue-800">{parentTopic.title}</span>
          {parentTopic.subtitle && (
            <span className="text-red-700 ml-2">: {parentTopic.subtitle}</span>
          )}
        </div>
        
        {isHovered && (
          <div className="ml-2 flex items-center">
            <button
              onClick={() => handleEditTopic(parentTopic)}
              className="ml-2 text-gray-500 hover:text-gray-700"
              title="Edit Topic"
            >
              <FiEdit size={14} />
            </button>

            <button onClick={() => handleAddTopic('topic', parentTopic.id)} className="ml-2" title="Add Sub-Topic">
                <FiPlusCircle size={14} />
            </button>

            <button onClick={() => handleAddComment(parentTopic.id)} className="ml-2" title="Add Comment">
              <FiPlusCircle size={14} />
            </button>

            <button onClick={() => handleAddPrompt(parentTopic.id)} className="ml-2" title="Add Prompt">
              <FiPlusCircle size={14} />
            </button>

            <button onClick={() => handleAddArtifact(parentTopic.id)} className="ml-2" title="Add Artifact">
              <FiPlusCircle size={14} />
            </button>
          </div>
        )}
      </div>
      {isParentTopicExpanded && (
        <div className="pl-12 pr-6 py-2 bg-gray-100">
          <ReactMarkdown className="markdown-content text-blue-600 italic">
            {parentTopic.text}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default TopicParentRow;