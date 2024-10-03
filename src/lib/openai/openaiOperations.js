// src/lib/openai/openaiOperations.js
import OpenAI from 'openai';
import { addDocument } from '../firebase/firestore.js';
import { cleanForTask } from './utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runOpenAiQuery = async ({
  systemPrompt,
  userPrompts,
  model = "gpt-4o",
  temperature = 0.1,
  responseFormat = { type: "text" },
  owner
}) => {
  try {
    const messages = [
      { role: "system", content: await cleanForTask(systemPrompt) },
      ...userPrompts.map(prompt => ({ role: "user", content: prompt }))
    ];

    const response = await openai.chat.completions.create({
      model,
      temperature,
      response_format: responseFormat,
      messages,
    });

    const content = response.choices[0].message.content;

    // Save to Firestore
    const topicData = {
      owner,
      name: `OpenAI Query Result - ${new Date().toISOString()}`,
      topic_type: 'prompt-response',
      text: content,
      response_format: responseFormat.type,
      timestamp: new Date()
    };

    //const topicId = await addDocument("topics", topicData);

    return { content };
  } catch (error) {
    console.error("Error in runOpenAiQuery:", error);
    throw error;
  }
};