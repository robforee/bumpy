// src/components/GoogleDriveFiles.jsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { queryRecentDriveFiles } from "@/src/app/actions/google-actions";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const GoogleDriveFiles = () => {
  const { user } = useUser();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchFiles = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await getIdToken(auth.currentUser);
      const fileDetails = await queryRecentDriveFiles(idToken);
      setFiles(fileDetails);
    } catch (error) {
      console.error('Error fetching Drive files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    setError(null);
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleFetchFiles} 
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Fetching...' : 'Fetch Recent Files'}
        </button>
        <button 
          onClick={handleClearFiles}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Files
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map(file => (
            <li key={file.id} className="border-b pb-2">
              <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                <strong className="font-semibold">{file.name}</strong>
              </a>
              <span className="text-gray-600"> - {file.mimeType}</span>
              <br />
              <span className="text-sm text-gray-500">
                Modified: {new Date(file.modifiedTime).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No files to display.</p>
      )}
    </div>
  );
};

export default GoogleDriveFiles;

