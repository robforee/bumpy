// src/components/Header.jsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOut } from "@/src/lib/firebase/auth.js";
import { useUser } from '@/src/contexts/UserContext';
import { userService } from '@/src/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

const Header = () => {
  const { user, loading, userProfile, profileLoading, refreshUserProfile } = useUser();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      console.log('Signing in...');
      await signInWithGoogle();
      console.log('Sign-in successful, setting isSigningIn');
      setIsSigningIn(true);
    } catch (error) {
      console.error("Sign-in error:", error);
      setIsSigningIn(false);
    }
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  useEffect(() => {
    console.log('Header effect:', { isSigningIn, user, userProfile, profileLoading });
    if (isSigningIn && user && !profileLoading) {
      console.log('Initializing new user if needed');
      userService.initializeNewUserIfNeeded(user)
        .then(() => {
          console.log('User initialized, refreshing profile');
          return refreshUserProfile();
        })
        .then(() => {
          console.log('Profile refreshed, setting isSigningIn to false');
          setIsSigningIn(false);
        })
        .catch((error) => {
          console.error("Error initializing user or refreshing profile:", error);
          setIsSigningIn(false);
        });
    }
  }, [isSigningIn, user, userProfile, profileLoading, refreshUserProfile]);

  let isAuthorizedUser = user && userProfile?.topicRootId;

  console.log('Render state:', { user, userProfile, isAuthorizedUser, loading, profileLoading });

  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }


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
                    <Button onClick={handleSignOut} className="w-full mb-2">Sign Out</Button>
                    <br/>
                    <Link href="/admin" passHref>
                      <Button className="w-full mb-2">Admin</Button>
                    </Link>
                    <br/>
                    <Link href="/gmail-dashboard" passHref>
                      <Button className="w-full">Gmail Dashboard</Button>
                    </Link>
                    <br/>
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