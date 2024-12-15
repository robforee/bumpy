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

export const signInWithGoogle = async (scopes = ['https://www.googleapis.com/auth/userinfo.email'], forceConsent = false) => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add all scopes
    scopes.forEach(scope => provider.addScope(scope));
    
    // Only ask for consent if forced or if we're requesting new scopes
    provider.setCustomParameters({
      prompt: forceConsent ? 'consent' : 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    return {
      success: true,
      user: result.user,
      tokens: {
        accessToken: credential.accessToken,
        refreshToken: result.user.refreshToken,
      }
    };
  } catch (error) {
    console.error('Sign in error:', error);
    
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: error.message, action: 'ENABLE_POPUPS' };
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign in cancelled', action: 'STAY' };
    }
    
    return { success: false, error: error.message, action: 'AUTH_ERROR' };
  }
};

export async function signOut() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
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