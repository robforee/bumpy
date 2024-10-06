// src/app/auth-error/page.js

import Link from 'next/link';

export default function AuthError() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="mb-4">We're sorry, but an error occurred during the authentication process. This could be due to several reasons:</p>
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