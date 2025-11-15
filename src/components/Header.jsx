// src/components/Header.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { getIdToken } from "firebase/auth";

import { doc, getFirestore, collection, query, where, getDocs, limit, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { signInBasic, signInWithGoogle, signOut } from "@/src/lib/firebase/firebaseAuth.js";
import { storeTokenInfo } from '@/src/app/actions/auth-actions';
import { useUser } from '@/src/contexts/UserProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { X, Menu } from 'lucide-react';
import LeftDrawer from './LeftDrawer';

const Header = () => {
  const { user, userProfile, loading, refreshUserProfile } = useUser();
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
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

  // Fetch scopes from Firestore
  useEffect(() => {
    const fetchScopes = async () => {
      const db = getFirestore();
      try {
        // First try to get user-specific scopes
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().request_scopes) {
            console.log('[BUMPY_AUTH] Using user-specific scopes:', JSON.stringify({
              userId: user.uid,
              scopes: userDoc.data().request_scopes,
              source: 'users/[uid].request_scopes',
              timestamp: new Date().toISOString()
            }));
            setPublicScopes(userDoc.data().request_scopes);
            return;
          }
        }
        
        // Fall back to default scopes from public_data
        const scopesDoc = await getDoc(doc(db, 'public_data', 'scopes'));
        if (scopesDoc.exists()) {
          console.log('[BUMPY_AUTH] Using default scopes:', JSON.stringify({
            userId: user?.uid,
            scopes: scopesDoc.data().default_scopes,
            source: 'public_data/scopes.default_scopes',
            timestamp: new Date().toISOString()
          }));
          setPublicScopes(scopesDoc.data().default_scopes || []);
        }
      } catch (error) {
        console.error('[BUMPY_AUTH] Error fetching scopes:', JSON.stringify({
          userId: user?.uid,
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    };
    fetchScopes();
  }, [user?.uid]);

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

      console.log('🔑 [Header] Starting sign in with signInBasic()');

      // Use new simple sign-in (no Google API scopes)
      const signInResult = await signInBasic();

      if (!signInResult.success) {
        console.error('❌ [Header] Sign-in failed:', signInResult.error);
        setError(signInResult.error || 'Failed to sign in');
        return;
      }

      console.log('✅ [Header] Sign in successful, redirecting to dashboard');

      // Save email to localStorage for next time
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastUsedEmail', email);
      }

      // Redirect to dashboard where user can authorize services
      router.push('/dashboard');

    } catch (error) {
      console.error("❌ [Header] Sign-in error:", error);
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
          {/* Left Section - Logo and Message */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => setShowDrawer(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="text-sm text-gray-600 italic">
                  Welcome back! Check your messages and stay organized.
                </div>
              </>
            ) : (
              <Link href="/" className="logo flex items-center">
                <img src="/friendly-eats.svg" alt="FriendlyEats" className="h-8 mr-2" />
              </Link>
            )}
          </div>

          {/* Right Section - Auth */}
          <div className="flex items-center space-x-4">
            {!user && (
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
        </div>
      </div>

      {/* Left Drawer */}
      <LeftDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </header>
  );
};

export default Header;