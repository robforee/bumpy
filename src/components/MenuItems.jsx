/// src/components/MenuItems.jsx
import React from 'react';
import Link from 'next/link';

const MenuItems = ({ isAuthorizedUser, userProfile, showToggleButton, toggleCategory }) => {
  if (!isAuthorizedUser) return null;

  return (
    <>
      <Link href="/about" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
        About Us
      </Link>
      {userProfile?.topicRootId && (
        <>
          <Link href={`/topics/${userProfile.topicRootId}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Root Topic
          </Link>
          <Link href="/admin" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Admin
          </Link>
          <Link href="/gmail-dashboard" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Gmail Dashboard
          </Link>
          <Link href="/members" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Members
          </Link>
          <Link href="/activity-feed" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Activity Feed
          </Link>
          <Link href="/config" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Config
          </Link>
          {showToggleButton && (
            <button 
              onClick={toggleCategory} 
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Toggle Category
            </button>
          )}
        </>
      )}
    </>
  );
};

export default MenuItems;