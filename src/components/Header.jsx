// src/components/Header.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { getIdToken } from "firebase/auth";

import { doc, getFirestore, collection, query, where, getDocs, limit, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { signInWithGoogle, signOut } from "@/src/lib/firebase/firebaseAuth.js";
import { storeTokenInfo } from '@/src/app/actions/auth-actions';
import { getUserInfo } from '@/src/app/actions/user-actions';
import { useUser } from '@/src/contexts/UserProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { X } from 'lucide-react';

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
  const [publicScopes, setPublicScopes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch public scopes from Firestore
  useEffect(() => {
    const fetchPublicScopes = async () => {
      const db = getFirestore();
      const scopesDoc = await getDoc(doc(db, 'public_data', 'scopes'));
      if (scopesDoc.exists()) {
        setPublicScopes(scopesDoc.data().default_scopes || []);
      }
    };
    fetchPublicScopes();
  }, []);

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

  // user management is handled through UserProvider context
  // UserProvider can be found in Layout component and wraps <Header >
  // UserProvider is tiggered when auth state changes
  // UserProvider uses userService to:
      // Create user profile if needed
      // Create user_tokens document
      // Create authorized_scopes document
      // Initialize topic root
      
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    // Save email to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastUsedEmail', email);
    }

    try {
      setIsSubmitting(true);

      // Query existing authorized scopes
      const db = getFirestore();
      const userQuery = await getDocs(
        query(collection(db, 'authorized_scopes'), 
          where('userEmail', '==', email),
          limit(1)
        )
      );
      let PUBLIC_SCOPES = [];
      let forceConsent = false;
      if(userQuery.docs.length === 0) {
        console.error('No user found with email:', email);
        console.log('create a profile and proceed after signInWithGoogle');
        PUBLIC_SCOPES = publicScopes;
        forceConsent = true;
      }else{
        if(userQuery.docs[0].data().authorizedScopes.length > 0) {
          PUBLIC_SCOPES = userQuery.docs[0].data().authorizedScopes
        }else{
          PUBLIC_SCOPES = publicScopes;
        }  
      }
      console.log('User query:', userQuery.docs);
      

      // Sign in with Google using the found scopes
      // check if scopes match requested
      // save the (new) scopes to user_tokens/authorizedScopes
      let signInResult = await signInWithGoogle(PUBLIC_SCOPES, forceConsent);

      if (!signInResult.success) {
        console.error('Sign-in failed:', signInResult.error);
        handleSignInError(signInResult);
        return;
      }

      // Get the current user and ID token
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error('No user after successful sign-in');
        return;
      }

      const idToken = await auth.currentUser.getIdToken();
      if (!idToken) {
        console.error('No ID token available after sign-in');
        return;
      }

      // Profile creation is handled by UserProvider context
      console.log('Sign-in successful, UserProvider will handle profile creation');

      // use google tokenInfo endpoint to get authorized for this login scopes
      let AUTHD_SCOPES = await fetch( `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${signInResult.tokens.accessToken}` ).then(r => r.json());
      //console.log('Token scopes:', AUTHD_SCOPES.scope?.split(' '));
      
      // check if token scopes match authorized scopes
      if (AUTHD_SCOPES.scope?.split(' ').sort().join(',') !== PUBLIC_SCOPES.sort().join(',')) {
        console.error('Token scopes do not match authorized scopes');
        forceConsent = true;
        signInResult = await signInWithGoogle(PUBLIC_SCOPES, forceConsent);
        AUTHD_SCOPES = await fetch( `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${signInResult.tokens.accessToken}` ).then(r => r.json());
        if (AUTHD_SCOPES.scope?.split(' ').sort().join(',') !== PUBLIC_SCOPES.sort().join(',')) {
          console.error('Token scopes still do not match authorized scopes');          
        }
      }

      // Store tokens after successful sign-in and scope verification
      try {
        await storeTokenInfo(
          auth.currentUser.uid, 
          signInResult.tokens.accessToken, 
          signInResult.tokens.refreshToken, 
          AUTHD_SCOPES.scope?.split(' '), 
          idToken
        );
      } catch (error) {
        console.error('Error storing tokens:', error);
        // Continue anyway as the user is signed in
      }

    } catch (error) {
      console.error("Sign-in error:", error);
      router.push('/auth-error');
    } finally {
      setIsSubmitting(false);
      router.push('/');  
    }
  };

  const handleSignInError = async (result) => {
    switch (result.action) {
      case 'ENABLE_POPUPS':
        // Sign out before redirecting
        try {
          await signOut();
          console.log('Signed out user before popup redirect');
        } catch (error) {
          console.error('Error signing out:', error);
        }
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
                <Button onClick={() => handleMenuItemClick(() => router.push('/dashboard'))}>
                  Dashboard
                </Button>

                <Button onClick={handleSignOut} variant="destructive">
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