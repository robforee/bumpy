// src/components/LeftDrawer.jsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { signOut } from "@/src/lib/firebase/firebaseAuth.js";
import { useUser } from '@/src/contexts/UserProvider';

const LeftDrawer = ({ isOpen, onClose }) => {
  const { user, userProfile } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      onClose();
      if (result.success) {
        router.push('/');
      } else {
        console.error('Sign-out failed:', result.error);
        router.push('/auth-error?error=' + encodeURIComponent(result.error));
      }
    } catch (error) {
      console.error('Error in handleSignOut:', error);
      router.push('/auth-error?error=' + encodeURIComponent(error.message));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                router.push('/dashboard');
                onClose();
              }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </button>

            {userProfile?.topicRootId && (
              <button
                onClick={() => {
                  router.push(`/topics/${userProfile.topicRootId}`);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Your Plan
              </button>
            )}
          </div>
        </nav>

        {/* User Section at Bottom */}
        {user && (
          <div className="border-t p-4">
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                {user.photoURL ? (
                  <img
                    className="w-12 h-12 rounded-full"
                    src={user.photoURL}
                    alt={user.displayName || user.email}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LeftDrawer;
