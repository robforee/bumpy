// src/components/ServerTime.jsx
'use client';

import React, { useState }  from 'react';
import { httpsCallable }    from 'firebase/functions';
import { functions }      from '../lib/firebase/clientApp.js'

function ServerTime() {
  const [serverTime, setServerTime] = useState(null);
  const [error, setError] = useState(null);

  const fetchServerTime = async () => {
    try {
      // Get a reference to your Firebase app
      
      // Get a reference to the Functions service
      const functions = functions();
      
      // Create a callable function
      const getServerTime = httpsCallable(functions, 'getServerTime');
      
      // Call the function
      const result = await getServerTime();
      
      // The result.data will contain the response from your Cloud Function
      setServerTime(result.data.serverTime);
      setError(null);
    } catch (err) {
      console.error('Error fetching server time:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <button onClick={fetchServerTime}>Get Server Time</button>
      {serverTime && <p>Server Time: {serverTime}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default ServerTime;
