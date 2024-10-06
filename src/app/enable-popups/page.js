// src/app/enable-popups/page.js
export default function EnablePopups() {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Enable Popups</h1>
        <p className="mb-4">To use our sign-in feature, you need to enable popups for this website. Here's how:</p>
        <ol className="list-decimal list-inside mb-4">
          <li>Look for the popup blocker icon in your browser's address bar (usually on the right side).</li>
          <li>Click on the icon and select "Always allow popups for [our website]".</li>
          <li>Refresh the page and try signing in again.</li>
        </ol>
        <p>If you're still having trouble, please consult your browser's help documentation for specific instructions on enabling popups.</p>
      </div>
    );
  }