'use client';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Something went wrong!</h1>
        <p className="text-xl mb-4 text-gray-700">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
