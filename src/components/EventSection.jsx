// /app/components/TopicView.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TopicModel from '../lib/TopicModel';


const EventSection = ({ topicId }) => {
  const [topic, setTopic] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const fetchedTopic = await TopicModel.getTopic(topicId);
        setTopic(fetchedTopic);
      } catch (error) {
        console.error('Error fetching topic:', error);
      }
    };
    fetchTopic();
  }, [topicId]);

  if (!topic) return <div>Loading...</div>;

  const handleParentNavigation = () => {
    if (topic.data.parents.length > 0) {
      router.push(`/topic/${topic.data.parents[0]}`);
    }
  };

  const handleDelete = async () => {
    // Implement delete functionality
    console.log('Delete topic:', topicId);
  };

  return (
    <div className="topic-view">
      <h1>{topic.data.title}</h1>
      <h2>{topic.data.subtitle}</h2>
      <div className="topic-content">
        <p>{topic.data.text}</p>
        {topic.data.topic_doc_uri && (
          <iframe src={topic.data.topic_doc_uri} width="100%" height="500px" />
        )}
      </div>
      <ArtifactSection topicId={topicId} />
      <PromptSection topicId={topicId} />
      <EventSection topicId={topicId} />
      <CommentSection topicId={topicId} />
      <button onClick={handleParentNavigation}>Go to Parent</button>
      <button onClick={handleDelete}>Delete Topic</button>
    </div>
  );
};

export default EventSection;