// src/components/TokenInfo.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getTokenInfo, ensureFreshTokens_fromClient } from "@/src/app/actions/auth-actions";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { useUser } from '@/src/contexts/UserProvider';
import { getAuth } from 'firebase/auth'; // vs firebase-admin/auth


const TokenInfo = () => {
  const { user } = useUser();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTokenInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await getIdToken(auth.currentUser);
      const info = await getTokenInfo(idToken); // SERVER CALL

      setTokenInfo(info);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken();
      
      const result  = await ensureFreshTokens_fromClient(idToken, user.uid, true); // SERVER CALL

      //console.log(result);
      //await fetchTokenInfo(); // Fetch updated token info after refreshing

    } catch (err) {
      console.error('Error during force refresh:', err);
      if (err.message === 'REAUTH_REQUIRED') {
        setError('Re-authentication required. Please sign out and sign in again.');
      } else {
        setError(`Error refreshing token: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    //fetchTokenInfo(); // DONT FETCH BY DEFAULT
  }, []);

  if (isLoading) return <div>Loading token information...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">Token Information</h2>
      {tokenInfo ? (
        <div>
          <p><strong>Updated:</strong> {tokenInfo.lastUpdate}</p>
          <p><strong>Expires:</strong> {tokenInfo.expirationTime}</p>
        </div>
      ) : (
        <p>No token information available.</p>
      )}
      <div className="mt-4 space-x-4">
        <button 
          onClick={fetchTokenInfo}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Refresh Token Info
        </button>
        <button 
          onClick={handleForceRefresh}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Force Token Refresh
        </button>
      </div>
    </div>
  );
};

export default TokenInfo;

