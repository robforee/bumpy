// src/lib/firebase/firebaseAuth.js
// CLIENT SIDE FUNCTIONS, CANNOT DOT INTO CLIENT MODULE FROM SERVER

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";

import { auth } from "@/src/lib/firebase/clientApp";

export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

/**
 * Signs in with Google using the provided scopes.
 * 
 * @param {string[]} scopes - The scopes to request from Google.
 * @param {boolean} forceConsent - Whether to force the consent screen.
 * @returns {Promise<{ success: boolean, user: any, tokens: any, scopes: string[] }>} The result of the sign in.
 */
export async function signInWithGoogle(scopes = [], forceConsent = false) {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add requested scopes
    scopes.forEach(scope => {
      provider.addScope(scope);
    });

    // Force consent if requested or if new scopes are being added
    if (forceConsent) {
      provider.setCustomParameters({
        prompt: 'consent'
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    return {
      success: true,
      user: result.user,
      tokens: {
        accessToken: credential.accessToken,
        refreshToken: result._tokenResponse.refresh_token
      },
      scopes: scopes
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    
    // Check for user denied access
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Sign in cancelled by user'
      };
    }
    
    // Check for access denied
    if (error.code === 'auth/user-cancelled' || 
        (error.message && error.message.includes('access_denied'))) {
      return {
        success: false,
        error: 'Access denied by user'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with Google'
    };
  }
}

/**
 * Signs out the current user.
 * 
 * @returns {Promise<{ success: boolean, error: string }>} The result of the sign out.
 */
export async function signOut() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserIdToken() {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  throw new Error('No user is signed in');
}