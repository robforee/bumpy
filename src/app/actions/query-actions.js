// src/app/actions/query-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export async function prepareStructuredQuery_forConceptAnalysis(data){


  console.log('\n\n prepareStructuredQuery_forConceptAnalysis \n')

  if(!data.contextArray || !data.conceptQuery) { return 'missing contextArray or conceptQuery'}

// #region concept propeties
let describe = [
  { field: 'topic_title', about: [], example: '' },
  { field: 'topic_subtitle', about: [], example: '' },
  { field: 'topic_concept', about: [], example: '' },
  { field: 'topic_statement', about: [], example: '' },
  { field: 'topic_subtopics', about: [], example: '' },
  { field: 'topic_milestones', about: [], example: '' },
  { field: 'topic_questions', about: [], example: '' },
  { field: 'topic_next_steps', about: [], example: '' }
];

const updateField = (fieldName, updateFunc) => {
  const item = describe.find(item => item.field === fieldName);
  if (item) updateFunc(item);
};

// Update specific fields
updateField('topic_title', item => item.about.push(''));
updateField('topic_subtitle', item => item.about.push(''));

updateField('topic_concept', item => {
  item.example = "sell the house";
  item.about.push('short but comprehensive statement about how this category fits into the parent topic.');
  item.about.push('include goals and outcomes of parent topic as well as goals and topics of this category.');
  item.about.push('be sure to explicitly state what the parent topic is');
});

updateField('topic_statement', item => item.about.push('describe what the author is trying to achieve'));

updateField('topic_subtopics', item => {
  item.about.push('create 3 to 5 categories of activities or knowledge areas');
  item.about.push('the categories should be broad enough to cover all necessary activities');
});

updateField('topic_milestones', item => item.about.push('what are the first few things you would do and why do them now'));

updateField('topic_questions', item => item.about.push('you may ask 3 to 5 questions to clarify details about this topic'));
// #endregion

  // https://platform.openai.com/docs/guides/structured-outputs/supported-schemas?context=with_parse
  const Question = z.object({ question: z.string() });
  const Milestone = z.object({ milestone: z.string() });
  const Subtopic = z.object({ subtopic: z.string() });

  const Concept = z.object({ 
    topic_title: z.string(),  
    topic_subtitle: z.string(),
    topic_concept: z.string(), 
    topic_statement: z.string(), 
    topic_subtopics: z.array(Subtopic), 
    topic_milestones: z.array(Milestone), 
    topic_questions: z.array(Question)

  })  
  // system prompt
  const myMessages = [ { role: "system", content: "You are an expert process analyst" }]

  // add context array
  data.contextArray.forEach(element => { 
    myMessages.push( {role: "user", content:element} );    
  });

  // add concept query
  myMessages.push( { role:"user",content: data.conceptQuery } );

  // add zod response format
  const queryData = {
    model: "gpt-4o-mini",
    messages: myMessages,
    response_format: zodResponseFormat(Concept, "concept_analysis"),
  };
  const queryString = JSON.stringify(queryData);

  console.log('passing queryData to TopicTableContainer ')
  return JSON.parse(JSON.stringify(queryData));
}

export async function runConceptQuery(queryJson, idToken) {
  
  console.log('\n\trunConceptQuery\n')

  try {
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    if (!process.env.OPENAI_API_KEY ) {
      throw new Error('Missing required OPENAI_API_KEY environment variables');
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


    // CHAT COMPLETION HERE
    const completion = await openai.beta.chat.completions.parse( queryJson );

    console.log('passing completion to TopicTableContainer ')
    return JSON.parse(JSON.stringify(completion));

  }catch(error){
    console.log('#\tBIG ERROR',error)
    return 'not ok'
  }
}
export async function runOpenAiQuery(queryData, idToken) {
  console.log('me run open ai')
  try {

    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    if (!process.env.OPENAI_API_KEY ) {
      throw new Error('Missing required OPENAI_API_KEY environment variables');
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const {
      systemPrompt,
      userPrompts,
      model,
      temperature,
      responseFormat,
      owner
    } = queryData;

    const messages = [
      { role: "system", content: systemPrompt },
      ...userPrompts.map(prompt => ({ role: "user", content: prompt }))
    ];

    if(process.env.NODE_ENV === false)
      console.log('Sending request to OpenAI:', JSON.stringify({
        model,
        temperature,
        response_format: responseFormat,
        messages
      }, null, 2));

    const openAiResponse = await openai.chat.completions.create({
      model,
      temperature,
      response_format: responseFormat,
      messages,
    });

    const content = openAiResponse[0].message.content;

    return { success: true, content };
  } catch (error) {
    console.error("Detailed error in runOpenAiQuery:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
}

