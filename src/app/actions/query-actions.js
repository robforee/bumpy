// src/app/actions/query-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { updateTopic } from '@/src/app/actions/topic-actions';

export async function structuredQuery_conceptAnalysis(data){


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

  const Topic = z.lazy(() => z.object({
    topic_title: z.string(),  
    topic_subtitle: z.string(),
    topic_concept: z.string(), 
    topic_statement: z.string(), 
    topic_subtopics: z.array(Topic), 
    topic_milestones: z.array(Milestone), 
    topic_questions: z.array(Question)
    
  }))
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
    response_format: zodResponseFormat(Topic, "topic_analysis"),    
  };
  
  //response_format: zodResponseFormat(Concept, "concept_analysis"),
  const queryString = JSON.stringify(queryData);

  console.log('passing queryData to TopicTableContainer ')
  return JSON.parse(JSON.stringify(queryData));
}

function convertToMarkdown(topics) {
  // Helper function to indent text based on level
  const indent = (text, level) => '  '.repeat(level) + text;

  // Recursive function to transform a topic and its subtopics
  function topicToMarkdown(topic, level = 0) {
    let markdown = `${indent(`# ${topic.topic_title}`, level)}\n`;
    markdown += `${indent(`**${topic.topic_subtitle}**`, level + 1)}\n\n`;
    markdown += `${indent(`- **Concept:** ${topic.topic_concept}`, level + 1)}\n`;
    markdown += `${indent(`- **Statement:** ${topic.topic_statement}`, level + 1)}\n`;

    // Process subtopics
    if (topic.topic_subtopics && topic.topic_subtopics.length > 0) {
      markdown += `\n${indent(`### Subtopics:`, level + 1)}\n`;
      topic.topic_subtopics.forEach(subtopic => {
        markdown += topicToMarkdown(subtopic, level + 1) + "\n";
      });
    }

    // Process milestones
    if (topic.topic_milestones && topic.topic_milestones.length > 0) {
      markdown += `\n${indent(`### Milestones:`, level + 1)}\n`;
      topic.topic_milestones.forEach(milestone => {
        markdown += `${indent(`- ${milestone.milestone}`, level + 2)}\n`;
      });
    }

    // Process questions
    if (topic.topic_questions && topic.topic_questions.length > 0) {
      markdown += `\n${indent(`### Questions:`, level + 1)}\n`;
      topic.topic_questions.forEach(question => {
        markdown += `${indent(`- ${question.question}`, level + 2)}\n`;
      });
    }

    return markdown;
  }

  // Generate markdown for each top-level topic
  return topics.map(topic => topicToMarkdown(topic)).join("\n");
}

async function prettifyConceptResponse(choicesObject){
      // PRETTIFY PARSED STRUCTURED RESPONSE for TEXT FIELD
      // let textResponse = '';
      // Object.entries( choicesObject.message.parsed ).forEach(([key, value]) => {
      //   if(key === 'topic_title') next;
      //   if(key === 'topic_subtitle') next;
      //   textResponse += '# ' + key + '\n';
      //   textResponse += value + '\n\n';
      // });

      // THE topic.CONCEPT ('concept', 'statement','subtopics','milestones','questions')
      let sections = [
        'title', 'subtitle','concept', 'statement','subtopics','milestones','questions'
      ]
      let userConceptView = '';
        userConceptView += '\n# THIS CONCEPT\n';
        userConceptView += choicesObject.message.parsed.topic_concept;

        userConceptView += '\n# Statement of purpose\n';
        userConceptView += choicesObject.message.parsed.topic_statement;

        userConceptView += '\n# Subtopics \n * ';
        userConceptView += convertToMarkdown(choicesObject.message.parsed.topic_subtopics);

        userConceptView += '\n# Milestones\n * ';
        userConceptView += choicesObject.message.parsed.topic_milestones.map(i=>{return i.milestone}).join('\n * ') + '\n'; //.slice(0, -1);

        userConceptView += '\n# Questions\n * ';
        userConceptView += choicesObject.message.parsed.topic_questions.map(i=>{return i.question}).join('\n * ') + '\n'; //.slice(0, -1);

      //console.log('\nuserConceptView\n', userConceptView )  
      return {userConceptView: userConceptView, }
}




// THE NEW SERVER SIDE one
export async function processConceptQuery(data, idToken){
  const { currentUser } = await getAuthenticatedAppForUser(idToken);
    
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  if(!data.contextArray || !data.conceptQuery) { return 'missing contextArray or conceptQuery'}

  // CREATE STRUCTURED QUERY
  const structuredQuery = await structuredQuery_conceptAnalysis({ // ON SERVER
    contextArray: data.contextArray,
    conceptQuery: data.conceptQuery
  });  

  // RUN QUERY
  const completionObject = await runConceptQuery(structuredQuery, idToken); // return an an object
  const { choices: [firstChoice, ...otherChoices], ...restOfCompletion } = completionObject;  
  const choicesObject = firstChoice ;
  const usageObject = { ...restOfCompletion, choices: otherChoices };

  usageObject.prompt = structuredQuery;
  if(!choicesObject) return {error:'no choices object',completionObject}
  if(!choicesObject.message) return {error:'no choicesObject.message',completionObject}
  if(!usageObject) return {error:'no usageObject',completionObject}
  if(!usageObject.prompt) return {error:'no usageObject.prompt',completionObject}
  if(!usageObject.prompt.messages) return {error:'no usageObject.prompt.messages',structuredQuery}

    // PRETTIFY RESPONSE
    const pretty = await prettifyConceptResponse(choicesObject, usageObject);
    // return { userConceptView  }

    if(!pretty.userConceptView) return {error:'not pretty',pretty}


  // SAVE RESULTS
  const updatedTopic = { 
    ...data.currentTopic, 
    subtitle: choicesObject.message.parsed.topic_subtitle,
    prompt: usageObject.prompt.messages.map(m=>{return m.content}).join('\n'),
    concept: pretty.userConceptView,
    concept_json: choicesObject.message.parsed
  };

  updateTopic(data.currentTopic.id, updatedTopic, idToken);
  
  return {structuredQuery, choicesObject, usageObject, updatedTopic}

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

