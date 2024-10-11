// src/app/actions/query-actions.js
"use server";

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import OpenAI from 'openai';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";


export async function runOpenAiQuery(queryData, idToken) {
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

    if(false)
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

    const content = openAiResponse.choices[0].message.content;

    return { success: true, content };
  } catch (error) {
    console.error("Detailed error in runOpenAiQuery:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
}

