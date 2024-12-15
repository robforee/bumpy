// src/components/Header.jsx
'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOut } from "@/src/lib/firebase/firebaseAuth.js";
import { storeTokens_fromClient, getScopes_fromClient } from '@/src/app/actions/auth-actions';
import { useUser } from '@/src/contexts/UserProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { X } from 'lucide-react';
import { getAuth } from 'firebase/auth'; // vs firebase-admin/auth
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

const Header = () => {
  const { user, userProfile, loading, refreshUserProfile } = useUser();
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [email, setEmail] = useState(() => {
    // Try to get email from localStorage on component mount
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastUsedEmail') || '';
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      setShowMenu(false);
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    // Save email to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastUsedEmail', email);
    }

    try {
      setIsSubmitting(true);

      // Try to get user scopes
      let authorizedScopes = ['https://www.googleapis.com/auth/userinfo.email'];
      let forceConsent = false;
      try {
        const db = getFirestore();
        const userScopesSnapshot = await getDocs(
          query(collection(db, 'user_scopes'), where('email', '==', email))
        );

        if (!userScopesSnapshot.empty) {
          const userScopesDoc = userScopesSnapshot.docs[0];
          const scopesFromDb = userScopesDoc.data().scopes || [];
          if (scopesFromDb.length > 0) {
            authorizedScopes = scopesFromDb;
            // Don't force consent if we're using the same scopes
            forceConsent = false;
          }
        } else {
          // Force consent for new users
          forceConsent = true;
        }
      } catch (error) {
        console.log('Could not fetch user scopes, proceeding with email scope only:', error);
        forceConsent = true;
      }

      // Sign in with Google using the found scopes
      const signInResult = await signInWithGoogle(authorizedScopes, forceConsent);
      if (!signInResult.success) {
        handleSignInError(signInResult);
        return;
      }

      // Store the tokens
      const { user, tokens: { accessToken, refreshToken } } = signInResult;
      const idToken = await user.getIdToken();
      await storeTokens_fromClient(user.uid, accessToken, refreshToken, idToken, authorizedScopes);

      // Store email in user_scopes if we couldn't find it earlier
      try {
        const db = getFirestore();
        const userScopesRef = doc(db, 'user_scopes', user.uid);
        await setDoc(userScopesRef, {
          email: email,
          scopes: authorizedScopes,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error storing user scopes:', error);
      }

      await refreshUserProfile();
      router.push('/dashboard');

    } catch (error) {
      console.error("Sign-in error:", error);
      router.push('/auth-error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInError = (result) => {
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

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="logo flex items-center">
              <img src="/friendly-eats.svg" alt="FriendlyEats" className="h-8 mr-2" />
            </Link>

            <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
              About Us
            </Link>

            {user && userProfile?.topicRootId && (
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
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
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
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex items-center space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit"
                  disabled={!email || isSubmitting}
                  className={`${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
          </div>

          <Dialog open={showMenu} onOpenChange={setShowMenu}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader className="sm:text-left">
                <DialogTitle>User Menu</DialogTitle>
                <Button
                  variant="ghost"
                  className="absolute right-4 top-4"
                  onClick={() => setShowMenu(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button onClick={() => handleMenuItemClick(() => router.push('/settings'))}>
                  Settings
                </Button>
                <Button onClick={() => handleMenuItemClick(handleSignOut)} variant="destructive">
                  Sign Out
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};

export default Header;