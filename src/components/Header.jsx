// src/components/Header.jsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { signInWithGoogle, signOut } from "@/src/lib/firebase/auth.js";
import { useUser } from '@/src/contexts/UserContext';
import { userService } from '@/src/services/userService'

const Header = () => {
  const { user, loading, userProfile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignOut = async (event) => {
    event.preventDefault();
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      await signInWithGoogle();
      setIsSigningIn(true);
    } catch (error) {
      console.error("Sign-in error:", error);
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    if (isSigningIn && user) {
      userService.initializeNewUserIfNeeded(user)
        .then(() => {
          setIsSigningIn(false);
          console.log('User initialized:', user);
        })
        .catch((error) => {
          console.error("Error initializing user:", error);
          setIsSigningIn(false);
        });
    }
  }, [isSigningIn, user]);

  const toggleCategory = () => {
    const params = new URLSearchParams(searchParams);
    const currentCategory = params.get('category');
    const newCategory = currentCategory === 'Member' ? 'Restaurant' : 'Member';
    params.set('category', newCategory);
    router.push(`${pathname}?${params.toString()}`);
  };

  const showToggleButton = pathname.startsWith('/members');
  let isAuthorizedUser = user && user.uid === 'e660ZS3gfxTXZR06kqn5M23VCzl2';
  
  isAuthorizedUser = true; // Note: This line overrides the previous check. Consider removing if not needed.

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="logo flex items-center">
            <img src="/friendly-eats.svg" alt="FriendlyEats" className="h-8 mr-2" />
            <span className="text-xl font-bold">Analyst Server</span>
          </Link>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/about" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          About Us
        </Link>

        {isAuthorizedUser && userProfile?.topicRootId &&  (
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

        {user ? (
          <div className="profile relative">
            <button className="flex items-center space-x-2">
              <img className="w-8 h-8 rounded-full" src={user.photoURL || "/profile.svg"} alt={user.email} />
              <span>{user.displayName}</span>
            </button>
            <div className="menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block">
              <ul className="py-1">
                <li>
                  <a href="#" onClick={handleSignOut} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <button onClick={handleSignIn} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            <img src="/profile.svg" alt="A placeholder user image" className="w-6 h-6" />
            <span className="text-xs">Sign In with Google<br/> if you are on the list</span>
          </button>
        )}
        
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;