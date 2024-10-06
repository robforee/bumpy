'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeTokens } from '../actions';
import { auth } from '../../lib/firebase/clientApp';

export default function CreateTokens() {
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleCreateTokens = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No user is signed in. Please sign in first.');
        return;
      }

      const idToken = await user.getIdToken(true);  // Force token refresh
      const result = await storeTokens({
        userId: user.uid,
        accessToken: idToken,
        refreshToken: user.refreshToken
      });

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError('Failed to create tokens. Please try again.');
      }
    } catch (error) {
      console.error('Error creating tokens:', error);
      setError('Failed to create tokens. Please try again.');
    }
  };

  return (
    <div>
      <h1>Create Tokens</h1>
      <p>It seems we couldn't automatically create your access tokens. Please click the button below to try again.</p>
      <button onClick={handleCreateTokens}>Create Tokens</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}