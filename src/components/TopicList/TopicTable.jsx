// src/components/TopicList/TopicTable.jsx
import React from 'react';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';

const TopicTable = ({ topics, rowHeight, handleEditTitle }) => {
  console.log(topics)
  if (topics.length === 0) {
    return null;
  }
  console.log(topics)
  

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className={`${rowHeight} px-6 text-left`}>Title</th>
            <th className={`${rowHeight} px-6 text-left`}>Type</th>
            <th className={`${rowHeight} px-6 text-left`}>Last Updated</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {topics.slice(0, 100).map((topic) => (
            <tr key={topic.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className={`${rowHeight} px-6 text-left whitespace-nowrap`}>
                <div className="flex items-center">
                  <button
                    onClick={() => handleEditTitle(topic)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiSettings size={14} />
                  </button>
                  <Link href={`/topics/${topic.id}`} className="font-medium">
                    {topic.title}
                  </Link>
                </div>
              </td>
              <td className={`${rowHeight} px-6 text-left`}>{topic.topic_type}</td>
              <td className={`${rowHeight} px-6 text-left`}>
                {topic.updated_at ? topic.updated_at.toLocaleString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopicTable;