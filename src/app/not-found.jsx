// src/app/not-found.jsx
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Go Home
      </Link>
    </div>
  );
}