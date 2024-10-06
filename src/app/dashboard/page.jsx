// src/app/dashboard/page.js
'use client';

import { useUser } from '@/src/contexts/UserContext';
import Link from 'next/link';

export default function Dashboard() {
  const { user, userProfile } = useUser();

  if (!user) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.displayName}!</h1>
      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Your Account</h2>
        <p>Email: {user.email}</p>
        {userProfile?.topicRootId && (
          <Link href={`/topics/${userProfile.topicRootId}`} className="text-blue-500 hover:underline">
            View Your Plan
          </Link>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/gmail-dashboard" className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600 transition">
          Gmail Dashboard
        </Link>
        <Link href="/admin" className="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition">
          Admin Panel
        </Link>
      </div>
    </div>
  );
}