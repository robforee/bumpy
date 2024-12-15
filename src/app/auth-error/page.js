// src/app/auth-error/page.js

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {decodeURIComponent(error)}
        </div>
      )}

      <p className="mb-4">This could be due to several reasons:</p>
      <ul className="list-disc list-inside mb-4">
        <li>Your internet connection may be unstable.</li>
        <li>The authentication service might be temporarily unavailable.</li>
        <li>There might be a problem with your account.</li>
      </ul>
      <p className="mb-4">Please try the following:</p>
      <ol className="list-decimal list-inside mb-4">
        <li>Check your internet connection and try again.</li>
        <li>Clear your browser cache and cookies, then retry.</li>
        <li>If the problem persists, please contact our support team.</li>
      </ol>
      <Link href="/" className="text-blue-500 hover:underline">
        Return to Home Page
      </Link>
    </div>
  );
}