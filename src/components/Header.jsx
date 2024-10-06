// src/components/Header.jsx
'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOut } from "@/src/lib/firebase/auth.js";
import { useUser } from '@/src/contexts/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

const Header = () => {
  const { user, userProfile, loading, refreshUserProfile } = useUser();
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      setShowMenu(false);
      if (result.success) {
        router.push('/');
      } else {
        console.error('Sign-out failed:', result.error);
        router.push('/auth-error');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/auth-error');
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        await refreshUserProfile();
        switch (result.action) {
          case 'DASHBOARD':
            router.push('/dashboard');
            break;
          case 'CREATE_TOKENS':
            router.push('/create-tokens');
            break;
          default:
            console.error('Unexpected action:', result.action);
        }
      } else {
        switch (result.action) {
          case 'ENABLE_POPUPS':
            router.push('/enable-popups');
            break;
          case 'AUTH_ERROR':
            router.push('/auth-error');
            break;
          case 'STAY':
          default:
            console.error('Sign-in failed:', result.error);
        }
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      router.push('/auth-error');
    }
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const handleMenuItemClick = (action) => {
    setShowMenu(false);
    action();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isAuthorizedUser = user && userProfile?.topicRootId;

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-4 space-x-4">

          <Link href="/" className="logo flex items-center">
            <img src="/friendly-eats.svg" alt="FriendlyEats" className="h-8 mr-2" />
          </Link>

          <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            About Us
          </Link>

          {isAuthorizedUser && (
            <>
              <Link href={`/topics/${userProfile.topicRootId}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                Your Plan
              </Link>
            
              <Link href={`/topics/ulj8nfbMZSOAV1qeaQKo`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                  Biz Plan
              </Link>
              
              <Link href={`/topics/qqIGRbzwrQSwpwn5UXt5`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                  Product Plan
              </Link>
            </>
          )}

          {user ? (
            <>
              <button 
                className="flex items-center space-x-2"
                onClick={() => setShowMenu(true)}
              >
                {!avatarError ? (
                  <img 
                    className="w-8 h-8 rounded-full" 
                    src={user.photoURL || "/default-avatar.png"} 
                    alt={user.email} 
                    onError={handleAvatarError}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-bold">{user.displayName ? user.displayName[0].toUpperCase() : '?'}</span>
                  </div>
                )}
                <span>{user.displayName}</span>
              </button>

              <Dialog open={showMenu} onOpenChange={setShowMenu}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>User Menu</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Button onClick={() => handleMenuItemClick(handleSignOut)} className="w-full mb-2">
                      Sign Out
                    </Button>
                    <Button 
                      onClick={() => handleMenuItemClick(() => router.push('/admin'))} 
                      className="w-full mb-2"
                    >
                      Admin
                    </Button>
                    <Button 
                      onClick={() => handleMenuItemClick(() => router.push('/gmail-dashboard'))} 
                      className="w-full"
                    >
                      Gmail Dashboard
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <button onClick={handleSignIn} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
              <img src="/profile.svg" alt="A placeholder user image" className="w-6 h-6" />
              <span className="text-xs">Sign In with Google<br/> if you are on the list</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;