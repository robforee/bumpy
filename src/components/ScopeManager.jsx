// src/components/ScopeManager.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, getFirestore } from '@firebase/firestore';

const availableScopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/contacts"
];

const ScopeManager = () => {
  const [requestedScopes, setRequestedScopes] = useState([]);
  const [authorizedScopes, setAuthorizedScopes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScopes = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('Please sign in to view scopes');
      }

      // Get user's requested scopes
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        console.log('[BUMPY_AUTH] Fetched user request_scopes:', JSON.stringify({
          userId: auth.currentUser.uid,
          scopes: userDoc.data().request_scopes || [],
          timestamp: new Date().toISOString()
        }));
        setRequestedScopes(userDoc.data().request_scopes || []);
      }

      // Get authorized scopes
      const userTokensDoc = await getDoc(doc(db, 'user_tokens', auth.currentUser.uid));
      if (userTokensDoc.exists()) {
        console.log('[BUMPY_AUTH] Fetched authorized scopes:', JSON.stringify({
          userId: auth.currentUser.uid,
          scopes: userTokensDoc.data().authorizedScopes || [],
          timestamp: new Date().toISOString()
        }));
        setAuthorizedScopes(userTokensDoc.data().authorizedScopes || []);
      }
    } catch (err) {
      console.error('[BUMPY_AUTH] Error fetching scopes:', JSON.stringify({
        userId: auth.currentUser?.uid,
        error: err.message,
        timestamp: new Date().toISOString()
      }));
      setError(err.message || 'Failed to load scopes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchScopes();
  }, []);

  const handleUpdateScopes = async (scope, action) => {
    try {
      setIsLoading(true);
      const auth = getAuth();
      const db = getFirestore();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current scopes
      const userDoc = await getDoc(userRef);
      const currentScopes = userDoc.exists() ? (userDoc.data().request_scopes || []) : [];
      
      // Update scopes
      let updatedScopes = [...currentScopes];
      if (action === 'add' && !currentScopes.includes(scope)) {
        updatedScopes.push(scope);
      } else if (action === 'remove') {
        updatedScopes = currentScopes.filter(s => s !== scope);
      }

      // Store updated scopes
      console.log('[BUMPY_AUTH] Updating request_scopes:', JSON.stringify({
        userId: auth.currentUser.uid,
        scopes: updatedScopes,
        action,
        scope,
        timestamp: new Date().toISOString()
      }));
      
      await setDoc(userRef, { request_scopes: updatedScopes }, { merge: true });
      setRequestedScopes(updatedScopes);
    } catch (error) {
      console.error('[BUMPY_AUTH] Error updating scopes:', JSON.stringify({
        userId: auth.currentUser?.uid,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
      setError(error.message || 'Failed to update scopes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading scopes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Available Scopes</h2>
      <div>
        {availableScopes.map((scope) => (
          <div key={scope}>
            <span>{scope}</span>
            <button 
              onClick={() => handleUpdateScopes(scope, 'add')}
              disabled={requestedScopes.includes(scope)}
            >
              Request Access
            </button>
          </div>
        ))}
      </div>

      <h2>Your Requested Scopes</h2>
      <div>
        {requestedScopes.map((scope) => (
          <div key={scope}>
            <span>{scope}</span>
            <span>{authorizedScopes.includes(scope) ? '(Authorized)' : '(Pending)'}</span>
            <button onClick={() => handleUpdateScopes(scope, 'remove')}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScopeManager;
