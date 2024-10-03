// src/components/TopicRow.jsx

import React from 'react';
import Link from 'next/link';
import { FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

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
  setHoveredRow
}) => {
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
    <div className="TOPIC_ROW border-b border-gray-200">
      <div className="flex flex-col">
        <div 
          className={`${rowHeight} px-10 py-2 hover:bg-gray-100 flex items-center`}
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
              <span className="text-red-700 ml-2"> {topic.subtitle}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicRow;