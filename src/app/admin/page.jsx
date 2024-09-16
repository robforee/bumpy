// src/app/admin/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CreateRootTopic from '../../components/CreateRootTopic';
import { onAuthStateChanged } from '../../lib/firebase/auth';

export default function AdminPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Admin Page</h1>
      {user ? (
        <>
          <CreateRootTopic user={user} />
          <div style={{ marginTop: '20px' }}>
            <Link href="/topics/PUqpeu0MzmTU58vhhQwy" style={{ color: 'blue', textDecoration: 'underline' }}>
              Go to ROB Root Topic
            </Link>
          </div>
        </>
      ) : (
        <p>Please log in to create a root topic.</p>
      )}
    </div>
  );
}