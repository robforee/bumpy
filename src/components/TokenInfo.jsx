// src/components/TokenInfo.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getTokenInfo } from "@/src/app/actions/auth-actions";

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
          <p><strong>Last Update:</strong> {tokenInfo.lastUpdate}</p>
          <p><strong>Expiration Time:</strong> {tokenInfo.expirationTime}</p>
        </div>
      ) : (
        <p>No token information available.</p>
      )}
      <button 
        onClick={fetchTokenInfo}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Refresh Token Info
      </button>
    </div>
  );
};

export default TokenInfo;
