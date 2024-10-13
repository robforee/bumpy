// src/app/actions/query-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import OpenAI from 'openai';

export async function runConceptQuery(queryString, idToken) {
  console.log('me run ccc',new Date().getTime().toLocaleString())
  //console.log('me run ccc',queryString)
  try {
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    if (!process.env.OPENAI_API_KEY ) {
      throw new Error('Missing required OPENAI_API_KEY environment variables');
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('me run ccc #2' )
    // force model today
    let queryJson
    try{
      queryJson = JSON.parse(queryString);
      console.log('#\tparse good')
    }catch(error){
      console.log('#\tparse error')
      return {error:'unable to parse JSON.parse(queryString)',queryString: queryString};
    }
    console.log('#\tparse good',JSON.stringify(queryJson,null,2))

    queryJson.model =  "gpt-4o-2024-08-06";
    //console.log(queryJson);
    console.log('me run ccc #3')
    const completion = await openai.beta.chat.completions.parse( queryJson );

    const completionString = JSON.stringify(completion);
    
    //return 'ok'
    return completionString 
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

