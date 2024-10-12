// src/app/dashboard/dashboard-page.js
'use client';

import { useUser } from '@/src/contexts/UserProvider';
import Link from 'next/link';
import GmailInbox from '@/src/components/GmailInbox';
import DriveFiles from '@/src/components/GoogleDriveFiles';
import GoogleCalendar from '@/src/components/GoogleCalendar';
import TopicChildren from '@/src/components/TopicChildren'; // Add this import

import TokenInfo from '@/src/components/TokenInfo';
import ScopeManager from '@/src/components/ScopeManager';
import QueryOpenAi from '@/src/components/QueryOpenAi';

// FOR SENDING AUTH TO SERVER

export default function Dashboard() {
  const { user, userProfile } = useUser();

  if (!user) {
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
      Use these to test connectivity
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopicChildren /> 
        <TokenInfo />
        <GmailInbox />
        <DriveFiles />
        <GoogleCalendar />
        <QueryOpenAi />
        {/* <ScopeManager /> */}

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin" className="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition">
          Admin Panel
        </Link>
      </div>
    </div>
  );
}

