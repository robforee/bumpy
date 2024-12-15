export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">404 - Page Not Found</h1>
        <p className="text-xl mb-4 text-gray-700">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="space-x-4">
          <a
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
