// src/components/TopicTable.jsx
import React, { useState } from 'react';
import Link from 'next/link';
import { FiSettings, FiPlusCircle, FiChevronRight, FiClock, FiMic } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import TopicListTable from './TopicListTable';

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

const TopicTable = ({ topics, rowHeight, handleAddTopic, handleEditTopic, expandedTopicIds, toggleTopicExpansion, handleAddComment }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <>
      <style jsx global>{markdownStyles}</style>
      <table className="min-w-full bg-white">
        <tbody className="text-gray-600 text-sm font-light">
          {topics.slice(0, 100).map((topic) => (
            <React.Fragment key={topic.id}>
              <tr 
                className="border-b border-gray-200 hover:bg-gray-100"
                onMouseEnter={() => setHoveredRow(topic.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className={`${rowHeight} px-6 text-left`}>
                  <div className="flex items-center">
{/*                     
                    navigate to topic
 */}
                    <Link href={`/topics/${topic.id}`} className="font-medium">
                      {topic.title}
                    </Link>
                    {hoveredRow === topic.id && (
                      <span className="ml-2">
                        :
{/*                     
                    edit button
 */}
                        <button
                          onClick={() => handleEditTopic(topic)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <FiSettings size={14} />
                        </button>
{/* 
                last update time
  */}
                        <div className="relative inline-block ml-2">
                          <FiClock size={14} className="text-gray-500" />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 bottom-full mb-2">
                            {formatDate(new Date(topic.updated_at))}
                          </span>
                        </div>
{/*                 
                expansion toggle chevron
 */}
                        <button onClick={() => toggleTopicExpansion(topic.id)} className="ml-2">
                          <FiChevronRight size={14} className={expandedTopicIds.has(topic.id) ? 'transform rotate-90' : ''} />
                        </button>
{/*                 
                add comment button
 */}
                        <button onClick={() => handleAddComment(topic.id)} className="ml-2">
                          <FiMic size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
{/* 
                collapsable markdown content                                
*/}
              {expandedTopicIds.has(topic.id) && (
                <tr>
                  <td className="px-6 py-2">
                    <div className="max-w-full overflow-x-auto px-4">
                      <ReactMarkdown className={`markdown-content text-red-600`}>
                        {topic.text}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-4 pl-4">
                      <TopicListTable
                        parentId={topic.id}
                        topic_type="comment"
                        rowHeight={rowHeight}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default TopicTable;