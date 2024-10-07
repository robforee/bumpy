// app/actions/query.js
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { OpenAI } from 'openai';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { auth } from '@/lib/auth';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export async function runOpenAIAndAddTopic(data) {
  const session = await auth();
  if (!session) {
    throw new Error('User must be logged in');
  }

  const { model, temp, response_format, messages, owner, parentId, title } = data;

  // Initialize OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Run OpenAI query
    const request = {
      model: model || "gpt-4-turbo-preview",
      temperature: temp || 0.1,
      response_format: response_format || { type: "json_object" },
      messages: messages,
    };
    const response = await openai.chat.completions.create(request);

    const content = response.choices[0].message.content;

    // Add topic
    const newTopic = {
      topic_type: 'prompt-response',
      title: title,
      content: content,
      owner: owner || session.user.id,
      parents: parentId ? [parentId] : [],
      children: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('topics').add(newTopic);

    if (parentId) {
      await db.doc(`topics/${parentId}`).update({
        children: FieldValue.arrayUnion(docRef.id)
      });
    }

    return { 
      id: docRef.id,
      content: content
    };
  } catch (error) {
    console.error("Error in runOpenAIAndAddTopic:", error);
    throw new Error('Error processing request: ' + error.message);
  }
}