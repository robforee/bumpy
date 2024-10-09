// src/components/TokenInfo.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getTokenInfo, ensureFreshTokens } from "@/src/app/actions/auth-actions";

const TokenInfo = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTokenInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await getTokenInfo();
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
      await ensureFreshTokens(true); // Pass true to force refresh
      await fetchTokenInfo(); // Fetch updated token info after refreshing
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
    fetchTokenInfo();
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

