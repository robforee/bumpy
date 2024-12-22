// src/app/dashboard/dashboard-page.js
'use client';

import { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import Link from 'next/link';

import GmailInbox from '@/src/components/GmailInbox';
import DriveFiles from '@/src/components/GoogleDriveFiles';
import GoogleCalendar from '@/src/components/GoogleCalendar';
import TopicChildren from '@/src/components/TopicChildren';
import QueryOpenAi from '@/src/components/QueryOpenAi';
import PromptEditor from '@/src/components/PromptEditor';
import TopicSearch from '@/src/components/TopicSearch';

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { updateTopic } from '@/src/app/actions/topic-actions';
import { runOpenAiQuery } from '@/src/app/actions/query-actions';

export default function Dashboard() {
  const { user, userProfile } = useUser();
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleSaveTopic = async (updatedTopic) => {
    try {
      if (!updatedTopic || !updatedTopic.id) {
        throw new Error("Invalid topic data");
      }
      
      const updatedFields = {
        title: updatedTopic.title,
        subtitle: updatedTopic.subtitle,
        text: updatedTopic.text,
        prompt: updatedTopic.prompt,
        promptResponse: updatedTopic.prompt_response,
        concept: updatedTopic.concept,
        concept_json: updatedTopic.concept_json,
      };
      
      Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);
      
      const idToken = await getIdToken(auth.currentUser);
      await updateTopic(updatedTopic.id, updatedFields, idToken);
      
      setSelectedTopic(updatedTopic);
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  const handleGptQuery = async (prompt) => {
    const idToken = await getIdToken(auth.currentUser);
  
    try {
      const result = await runOpenAiQuery({
        systemPrompt: "You are a helpful assistant.",
        userPrompts: [prompt],
        model: "gpt-4o-mini",
        temperature: 0.7,
        responseFormat: { type: "text" },
        owner: user.uid
      }, idToken);
      return result.content;
    } catch (error) {
      console.error("Error in GPT query:", error);
      throw error;
    }
  };

  const handleConceptQuery = async (data) => {
    const idToken = await getIdToken(auth.currentUser);
  
    try {
      data.model = "gpt-4o-mini";
      data.owner = user.uid;

      const result = await runOpenAiQuery(data, idToken);
      return result.content;
    } catch (error) {
      console.error("Error in concept query:", error);
      throw error;
    }
  };


  if (!user) {
    console.log('user')
    return <div>Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.displayName}!</h1>
      <div className="bg-white shadow-md rounded p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Account</h2>
        <p>Email: {user.email}</p>
        {userProfile?.topicRootId && (
          <Link href={`/topics/${userProfile.topicRootId}`} className="text-blue-500 hover:underline">
            View Your Plan
          </Link>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Test Connectivity</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopicChildren />
        <GmailInbox />
        <DriveFiles />
        <GoogleCalendar />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
        <QueryOpenAi />

        Search
        <TopicSearch onTopicSelect={setSelectedTopic} />
        {selectedTopic && (
          <PromptEditor
            editingTopic={selectedTopic}
            handleSaveTopic={handleSaveTopic}
            handleGptQuery={handleGptQuery}
            handleConceptQuery={handleConceptQuery}
          />
        )}  
          
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href="/admin" className="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition">
          Admin Panel
        </Link>
      </div>
    </div>
  );
}