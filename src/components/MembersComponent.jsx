// src/components/MembersComponent.jsx
'use client';

import { useEffect, useState } from 'react';
import MembersListing from "@/src/components/MembersListing";
import { useUser } from '@/src/contexts/UserContext';

const MembersComponent = () => {
  const { user, loading } = useUser();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMembers() {
      if (user) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/members`);
          if (!response.ok) {
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
  }, [user, loading]);

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="members-component">
      <h1>All Members</h1>
      <MembersListing members={members} />
    </div>
  );
};

export default MembersComponent;