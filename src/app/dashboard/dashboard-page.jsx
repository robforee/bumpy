// src/app/dashboard/dashboard-page.js
'use client';

import { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import Link from 'next/link';

import GmailInbox from '@/src/components/GmailInbox';
import DriveFiles from '@/src/components/GoogleDriveFiles';
import GoogleCalendar from '@/src/components/GoogleCalendar';
import TopicChildren from '@/src/components/TopicChildren';
import TokenInfo from '@/src/components/TokenInfo';
import QueryOpenAi from '@/src/components/QueryOpenAi';
import PromptEditor from '@/src/components/PromptEditor';
import TopicSearch from '@/src/components/TopicSearch';
import CodeBlock from '@/src/components/CodeBlock';

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
        <TokenInfo />
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
        // HOW TO CHUNK DOWN A CONCEPT
        <CodeBlock language="javascript">
{`
  // HOW TO CHUNK DOWN A CONCEPT
  do while({
    concept-query(prompt,concept,comments)
    if( query-response != concept-json ){
      if(sub-topic ! exist)
      if(exist sub-topic && not-in-query-response) (done task)
      move comment to sub/super-topic?
    }

  })

  this is topic contents{ 
    
    // what is this node and it's children
    title    - concept as a wish (a good canvas, a guided elaboration, executive summary)
    subtitle - status of wish

    // components of concept query to get chunked sub-topics
    prompt    - describes how to elaborate on a wish concept so it is drillable
    concept   - edit this space to get the categories you like
    commments - keep in mind - parent topic
    commments - keep in mind - sibling topics
    commments - keep in mind - details at this level ( Q & A )
    commments - topic query - explainers for users

    // goals of concept query 
    at this level of detail, what should we know and have done
    comments generated by the query ask for further info and status

    // results of running concept query
    concept_json - the Structured Response for parsing
    text     - the next level detail (sub-topics) for the concept of this wish
    text     - ? with links to sub-topics
    text     - to be populated from concept_json

  }

  // comment - questions by concept analyst to clarify context
  // comment - question by user to understand concept
  
  const Comment = z.object({
    title: z.string(),     // is the comment
    subtitle: z.string(),  // is the status of the response to comment
    owner: z.string(),     
    parentTopicName: z.string(),    // parentTopic.title
    parentTopicConcept: z.string(), // parentTopic.concept
    concept: z.string(),            // keep in mind
    context: z.string(),            // context += "amount owed, market value,"

  })

  const Topic = z.object({  // chunk it down
    
    title: z.string(),  
    subtitle: z.string(),// next step

    concept: z.string(), // what is the project concept "sell the house"

    comment: z.string(), // how we got here             "25 years, time to cash in and move on"
    comment: z.string(), // things to keep in mind      "my skills, my ignorance, my timeframe"
    comment: z.string(), // things to keep in mind      "amount owed, market value,"

    context: z.string(), // identify sub-topics to study (given)
    context: z.string(), // overall plan                 (given)
    context: z.string(), // what to do next              (given)

    
    //example: z.array(Topic)    
  })



`}
        </CodeBlock>              
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href="/admin" className="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition">
          Admin Panel
        </Link>
      </div>
    </div>
  );
}