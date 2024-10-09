// src/components/ScopeManager.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { getScopes, addScope, deleteScope } from "@/src/app/actions/auth-actions";

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
  const [scopes, setScopes] = useState([]);
  const [newScope, setNewScope] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScopes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedScopes = await getScopes();
      setScopes(fetchedScopes);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScopes();
  }, []);

  const handleAddScope = async () => {
    if (!newScope) return;
    setIsLoading(true);
    setError(null);
    try {
      await addScope(newScope);
      setNewScope('');
      await fetchScopes();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteScope = async (scopeToDelete) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteScope(scopeToDelete);
      await fetchScopes();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading scopes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">Scope Manager</h2>
      <div className="mb-4">
        <select
          value={newScope}
          onChange={(e) => setNewScope(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Select a scope to add</option>
          {availableScopes.map((scope) => (
            <option key={scope} value={scope}>
              {scope}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddScope}
          disabled={!newScope}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          Add Scope
        </button>
      </div>
      <ul className="list-disc pl-5">
        {scopes.map((scope) => (
          <li key={scope} className="mb-2">
            {scope}
            <button
              onClick={() => handleDeleteScope(scope)}
              className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs focus:outline-none focus:shadow-outline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScopeManager;

