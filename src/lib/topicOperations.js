// src/lib/topicOperations.js

import { addDocument } from './firebase/firestore';

export async function createRootTopic(title = "Root Topic", userId) {
  const rootTopicData = {
    title,
    subtitle: "The starting point of your topic hierarchy",
    text: "This is the root topic. You can add child topics to this to start building your topic hierarchy.",
    owner: userId,
    sharing: "private",
    version: 1,
    seq: Date.now(),
    topic_type: "Topic",
    output_type: "default",
    versions: [],
    parents: [],
    children: [],
    timestamp: new Date()
  };

  try {
    console.log('creating root topic')
    const rootTopicId = await addDocument("topics", rootTopicData);
    console.log(`Root topic created with ID: ${rootTopicId}`);
    return rootTopicId;
  } catch (error) {
    console.error("Error creating root topic:", error);
    throw error;
  }
}