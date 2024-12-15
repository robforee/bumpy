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

export async function signInWithGoogle(scopes = []) {
  const provider = new GoogleAuthProvider();

  if (scopes.length > 0) {
    scopes.forEach(scope => provider.addScope(scope));
  }

  // Add these parameters to force account selection
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential) {
      return {
        success: false,
        error: 'No credential returned'
      };
    }

    const accessToken = credential.accessToken;
    const refreshToken = user.refreshToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'No access token returned'
      };
    }

    return {
      success: true,
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    };

  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

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