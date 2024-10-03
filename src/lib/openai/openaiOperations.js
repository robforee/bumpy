// src/lib/openai/openaiOperations.js
import { functions } from '../firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
import { cleanForTask } from './utils.js';

export const runOpenAiQuery = async ({
  systemPrompt,
  userPrompts,
  model = "gpt-4-1106-preview",
  temperature = 0.1,
  responseFormat = { type: "text" },
  owner
}) => {
  console.log('Running query:', userPrompts);

  try {
    const runOpenAiQueryFunction = httpsCallable(functions, 'runOpenAiQuery');

    const cleanedSystemPrompt = await cleanForTask(systemPrompt);

    const result = await runOpenAiQueryFunction({
      systemPrompt: cleanedSystemPrompt,
      userPrompts,
      model,
      temperature,
      responseFormat,
      owner
    });

    console.log('Cloud function response:', result.data);

    return result.data;
  } catch (error) {
    console.error("Error in runOpenAiQuery:", error);
    throw error;
  }
};