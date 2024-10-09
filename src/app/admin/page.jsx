// src/app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@/src/contexts/UserProvider';
import GmailInbox from '@/src/components/GmailInbox';
import Link from 'next/link';

const AdminPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();



  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Link href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Dashboard
      </Link>
      Gmail Componenet
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Gmail Inbox Component</h2>
        <GmailInbox />
      </div>
    </div>
  );
};

export default AdminPage;
