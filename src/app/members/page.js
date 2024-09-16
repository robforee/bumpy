// src/app/members/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MembersListing from "@/src/components/MembersListing";
import { useUser } from '@/src/contexts/UserContext';

export default function MembersPage() {
  const { user, loading } = useUser();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchMembers() {
      if (user) {
        setIsLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams(searchParams);
          const category = params.get('category') || 'Member';

          console.log("/api/members", params.toString())
          const response = await fetch(`/api/members?${params.toString()}`);
          if (!response.ok) {
            console.log(response)
            throw new Error('Failed to fetch members');
          }
          const data = await response.json();
          setMembers(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (!loading) {
      fetchMembers();
    }
  }, [user, loading, searchParams]);

  return (
    <main className="main__members">
      <h1>{searchParams.get('category') || 'unknown category'}s</h1>
      <MembersListing members={members} />
    </main>
  );
}