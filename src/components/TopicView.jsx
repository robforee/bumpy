"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopicModel from '../lib/TopicModel';

const TopicView = () => {
  const [topic, setTopic] = useState(null);
  const router = useRouter();
  const params = useParams();
  const topicId = params.id;

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const fetchedTopic = await TopicModel.getTopic(topicId);
        setTopic(fetchedTopic);
      } catch (error) {
        console.error('Error fetching topic:', error);
      }
    };
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  if (!topic) return <div>Loading... {topicId} ya</div>;

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
        OK
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

export default TopicView;