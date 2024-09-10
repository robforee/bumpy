// src/components/ServerTime.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const ServerTime = () => {
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    const functions = getFunctions();
    const getServerTime = httpsCallable(functions, 'getServerTime');

    const fetchServerTime = async () => {
      try {
        const result = await getServerTime();
        setServerTime(result.data.serverTime);
      } catch (error) {
        console.error('Error fetching server time:', error);
      }
    };

    fetchServerTime();
  }, []);

  return (
    <div>
      <h2>Server Time</h2>
      {serverTime ? (
        <p>{new Date(serverTime).toLocaleString()}</p>
      ) : (
        <p>Loading server time...</p>
      )}
    </div>
  );
};

export default ServerTime;