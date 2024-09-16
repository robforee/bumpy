// src/app/dashboard/page.jsx
'use client';

import React from 'react';
import Dashboard from '@/src/components/Dashboard';
import { useUser } from '@/src/contexts/UserContext';

const DashboardPage = () => {
  const { user, loading } = useUser();
  if (!user) { return <div>Please sign in for access</div>; }
  if (loading) { return <div>Loading...</div>; }

  return <Dashboard />;
};

export default DashboardPage;