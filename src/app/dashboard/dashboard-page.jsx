// src/app/dashboard/dashboard-page.js
'use client';

import { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import Link from 'next/link';

import ServiceAuthCard from '@/src/components/ServiceAuthCard';
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
import { demoGmailToken, sendGmailMessage } from '../actions/google-actions';

export default function DashboardPage() {
  const { user, userProfile } = useUser();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [demoResults, setDemoResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Send email form state
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

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

  async function handleDemoGmail() {
    setIsLoading(true);
    try {
      const idToken = await getIdToken(auth.currentUser);
      const results = await demoGmailToken(idToken);
      setDemoResults(results);
    } catch (error) {
      console.error('Error in demo:', error);
      setDemoResults([`Error: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendEmail = async () => {
    if (!sendTo || !sendSubject || !sendBody) {
      setSendResult({ success: false, error: 'Please fill in all fields' });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await sendGmailMessage(idToken, sendTo, sendSubject, sendBody);
      setSendResult(result);

      if (result.success) {
        // Clear form on success
        setSendTo('');
        setSendSubject('');
        setSendBody('');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({ success: false, error: error.message });
    }
    setIsSending(false);
  };

  if (!user) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.displayName}!</h1>

      {/* Service Authorization Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Connect Your Google Services</h2>
        <p className="text-gray-600 mb-4">
          Authorize access to your Google services to use their features in this application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceAuthCard serviceName="gmail" />
          <ServiceAuthCard serviceName="drive" />
          <ServiceAuthCard serviceName="calendar" />
          <ServiceAuthCard serviceName="messenger" />
        </div>
      </div>

      <div className="bg-white shadow-md rounded p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Account</h2>
        <p>Email: {user.email}</p>
        {userProfile?.topicRootId && (
          <Link href={`/topics/${userProfile.topicRootId}`} className="text-blue-500 hover:underline">
            View Your Plan
          </Link>
        )}
      </div>


      <div className="mt-4">
        <button
          onClick={handleDemoGmail}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Demo Gmail Token Use'
          )}
        </button>
        
        {demoResults.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded shadow-sm">
            <h3 className="font-bold mb-2 text-lg">Gmail Token Demo Results:</h3>
            {demoResults.map((result, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded">
                {result.startsWith('Error') ? (
                  <span className="text-red-600">{result}</span>
                ) : result.startsWith('Success') ? (
                  <span className="text-green-600">{result}</span>
                ) : (
                  <span>{result}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 bg-white shadow-md rounded p-4">
        <h3 className="text-xl font-semibold mb-4">Send Test Email</h3>
        <p className="text-sm text-gray-600 mb-4">Test sending emails via Gmail API</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            <input
              type="email"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <input
              type="text"
              value={sendSubject}
              onChange={(e) => setSendSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body:</label>
            <textarea
              value={sendBody}
              onChange={(e) => setSendBody(e.target.value)}
              placeholder="Email body"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
          </div>
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
          {sendResult && (
            <div className={`p-4 rounded-md ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {sendResult.success ? (
                <>
                  <p className="font-semibold text-green-800">✓ Email sent successfully!</p>
                  <p className="text-sm text-green-700 mt-1">Message ID: {sendResult.messageId}</p>
                </>
              ) : (
                <p className="font-semibold text-red-800">✗ Error: {sendResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2 mt-4">Test Connectivity</h3>
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