// scripts/queryOpenAi.mjs
import { runOpenAiQuery } from '../src/lib/openai/openaiOperations.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqiDvffTon_ivAqTY5gKOlNP9rb5_HeRY",
  authDomain: "analyst-server.firebaseapp.com",
  projectId: "analyst-server",
  storageBucket: "analyst-server.appspot.com",
  messagingSenderId: "727308999536",
  appId: "1:727308999536:web:070de9931d90dd75a3cdb5",
  measurementId: "G-D4GZC8RDGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

async function runFirebaseFunction(params) {
  const functions = getFunctions(app);
  const runOpenAiQueryFunction = httpsCallable(functions, 'runOpenAiQuery');

  try {
    console.log('Sending request to Firebase function:', JSON.stringify(params, null, 2));
    const result = await runOpenAiQueryFunction(params);
    console.log('Received result from Firebase function:', JSON.stringify(result, null, 2));
    return result.data;
  } catch (error) {
    console.error('Detailed error calling Firebase function:', JSON.stringify(error, null, 2));
    throw error;
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('use-function', {
      alias: 'f',
      type: 'boolean',
      description: 'Use Firebase function'
    })
    .option('use-local', {
      alias: 'l',
      type: 'boolean',
      description: 'Use local function'
    })
    .help()
    .argv;

  let systemPrompt = 'you are a computing poet';
  let userPrompt = 'make a short poem about cybersecurity';

  const params = {
    systemPrompt,
    userPrompts: [userPrompt],
    model: "gpt-4-1106-preview",
    temperature: 0.1,
    responseFormat: { type: "text" },
    owner: "script-user"
  };

  try {
    let result;
    if (argv.useFunction) {
      console.log('Using Firebase function...');
      result = await runFirebaseFunction(params);
    } else if (argv.useLocal) {
      console.log('Using local function...');
      result = await runOpenAiQuery(params);
    } else {
      console.error('Please specify either --use-function or --use-local');
      process.exit(1);
    }

    console.log('OpenAI Query Result:', result.content);
    return result.content;
  } catch (error) {
    console.error('Error running OpenAI query:', error);
  }
}

main();