// scripts/queryOpenAi.mjs
import { runOpenAiQuery } from '../src/lib/openai/openaiOperations.js';
// import { readTextFile } from '../src/lib/fileOperations.js';

async function main() {
  let systemPrompt = 'you are a computing poet';
  let userPrompt = 'make a short poem about cybersecurity';

  try {
    const result = await runOpenAiQuery({
      systemPrompt,
      userPrompts: [userPrompt],
      model: "gpt-4o",
      temperature: 0.1,
      responseFormat: { type: "text" },
      owner: "script-user" // You might want to handle this differently for scripts
    });

    console.log('OpenAI Query Result:', result.content);
    return result.content;
  } catch (error) {
    console.error('Error running OpenAI query:', error);
  }
}

main();