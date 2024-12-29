'use client';

import { useEffect } from 'react';
import { signOut } from '@/src/lib/firebase/firebaseAuth';

export default function EnablePopups() {
  useEffect(() => {
    // Sign out user when they land on this page
    signOut().catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Enable Popups for Token Refresh</h1>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-yellow-700">
          We need to refresh your authentication token, but the popup was blocked. 
          This is necessary to maintain your secure access to our services.
        </p>
      </div>
      <div className="prose">
        <p className="mb-4">
          For security reasons, we occasionally need to refresh your authentication. 
          This requires a popup window to complete the Google authentication process.
        </p>
        <h2 className="text-xl font-semibold mb-2">Here's how to enable popups:</h2>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Look for the popup blocked icon in your browser's address bar (usually on the right)</li>
          <li>Click the icon and select "Always allow popups from this site"</li>
          <li>Click "Done" or close the popup settings</li>
        </ol>
        <p className="mb-4">
          After enabling popups, please <a href="/" className="text-blue-600 hover:text-blue-800">return to the login page</a> and sign in again.
        </p>
        <div className="text-sm text-gray-600 mt-8">
          <p>
            Note: This extra step helps us maintain the security of your account. 
            We only request popup access when necessary for authentication purposes.
          </p>
        </div>
      </div>
    </div>
  );
}