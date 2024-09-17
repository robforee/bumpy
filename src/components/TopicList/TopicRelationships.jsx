// src/components/TopicList/TopicRelationships.jsx
import React from 'react';
import Link from 'next/link';

const TopicRelationships = ({ topics }) => {
  const groupedTopics = topics.reduce((acc, topic) => {
    if (!acc[topic.relationship]) {
      acc[topic.relationship] = [];
    }
    acc[topic.relationship].push(topic);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedTopics).map(([relationship, relTopics]) => (
        <div key={relationship} className="bg-white p-1 rounded-lg shadow">
          <p>
            <span className="capitalize">{relationship === 'child' ? 'children' : relationship+'s'}</span>&nbsp;
            {relTopics.map((topic, index) => (
              <React.Fragment key={topic.id}>
                <Link href={`/topics/${topic.id}`} className="text-blue-500 hover:underline">
                  {topic.title}
                </Link>
                {index < relTopics.length - 1 && ", "}
              </React.Fragment>
            ))}
          </p>
        </div>
      ))}
    </>
  );
};

export default TopicRelationships;