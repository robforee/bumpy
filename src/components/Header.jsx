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
  const [error, setError] = useState(null);

  // Fetch public scopes from Firestore
  useEffect(() => {
    const fetchPublicScopes = async () => {
      const db = getFirestore();
      try {
        const scopesDoc = await getDoc(doc(db, 'public_data', 'scopes'));
        if (scopesDoc.exists()) {
          setPublicScopes(scopesDoc.data().default_scopes || []);
        }
      } catch (error) {
        console.error('Error fetching public scopes:', error);
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

/* UserProvider (Layout)
Legend:
  : - Public access (no auth required)
  @ - Firebase auth state
  ? - Conditional checks/decisions
  * - Has access token
  $ - Has both access & refresh tokens
  # - Firestore writes (requires auth)
  ! - Token deletion
  N - New user checks

UserProvider (Layout)
@── onAuthStateChanged
@   └── User Signs In
?       ├── Check user state (Header.jsx)
?       │   ├── Not signed in yet
N       │   │   └── Force consent = true
?       │   │
?       │   ├── Check user_tokens collection
?       │   │   ├── No tokens (new user)
N       │   │   │   └── Force consent = true
?       │   │   │
?       │   │   └── Has tokens
?       │   │       ├── Check requiresRefreshToken
?       │   │       └── If true:
!       │   │           ├── Delete existing tokens
!       │   │           └── Force consent = true
│       │
$       ├── signInWithGoogle (firebaseAuth.js)
$       │   ├── Get required scopes from public_data
$       │   │   └── public_data/scopes.default_scopes
$       │   │
$       │   ├── Set OAuth2 parameters
$       │   │   ├── Add all required scopes
$       │   │   ├── access_type: 'offline'
$       │   │   └── prompt: 'consent'
$       │   │
$       │   ├── signInWithPopup returns:
$       │   │   ├── credential.accessToken
$       │   │   ├── _tokenResponse.refreshToken
$       │   │   └── user.getIdToken()
$       │   │
$       │   ├── Verify token scopes
$       │   │   └── GET oauth2/v3/tokeninfo?access_token=
$       │   │
$       │   └── Return result
$       │
#       └── storeTokenInfo (auth-actions.js)
#           └── user_tokens/
#               ├── accessToken (encrypted)
#               ├── refreshToken (encrypted)
#               ├── authorizedScopes (from token)
#               ├── requiresRefreshToken (false)
#               └── timestamps
#                   ├── __last_token_update
#                   ├── __web_token_update
#                   └── __web_refresh_token_update
*/

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // First check if user needs refresh token
      const db = getFirestore();
      let forceConsent = false;

      const auth = getAuth();
      if (auth.currentUser) {
        const userTokensRef = doc(db, 'user_tokens', auth.currentUser.uid);
        const userTokensSnap = await getDoc(userTokensRef);
        
        if (userTokensSnap.exists()) {
          const userTokens = userTokensSnap.data();
          forceConsent = userTokens.requiresRefreshToken === true;
          if (forceConsent) {
            console.log('Refresh token required, will force consent');
          }
        } else {
          // Force consent for new users who don't have tokens yet
          forceConsent = true;
          console.log('New user, will force consent');
        }
      } else {
        // Force consent for users not signed in yet
        forceConsent = true;
        console.log('Not signed in, will force consent');
      }

      // Always force consent for now to test OAuth2 flow
      forceConsent = true;
      console.log('Forcing consent to test OAuth2 flow');

      // Sign in with Google
      console.log('Starting sign in with:', {
        publicScopes,
        forceConsent,
        currentUser: auth.currentUser?.email
      });
      
      const signInResult = await signInWithGoogle(publicScopes, forceConsent);
      
      if (!signInResult.success) {
        console.error('Sign-in failed:', signInResult.error);
        handleSignInError(signInResult);
        return;
      }

    } catch (error) {
      console.error("Sign-in error:", error);
      setError('Failed to sign in');
    } finally {
      setIsSubmitting(false);
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
                {error && <div className="text-red-500">{error}</div>}
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
                <Button onClick={() => handleMenuItemClick(() => router.push('/'))}>
                  Home
                </Button>
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