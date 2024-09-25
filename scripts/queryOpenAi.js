// scripts/runOpenAiQuery.js
import { runOpenAiQuery } from '../src/lib/openai/openaiOperations.js';
import { readTextFile }   from '../src/lib/fileOperations.js';

async function main() {
  const systemPrompt = await readTextFile('../prompts/system_prompt.md');
  const userPrompt = await readTextFile('../prompts/user_prompt.md');

  try {
    const result = await runOpenAiQuery({
      systemPrompt,
      userPrompts: [userPrompt],
      model: "gpt-4",
      temperature: 0.1,
      responseFormat: { type: "json_object" },
      owner: "script-user" // You might want to handle this differently for scripts
    });

    console.log('OpenAI Query Result:', result.content);
    console.log('Saved to Firestore with ID:', result.topicId);
  } catch (error) {
    console.error('Error running OpenAI query:', error);
  }
}

main();