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
    
    // Always force consent screen
    provider.setCustomParameters({
      prompt: 'consent'  // Always show consent screen
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    console.log('Full sign in result:', JSON.stringify({
      result: {
        user: result.user,
        operationType: result.operationType,
        providerId: result.providerId,
      },
      credential,
      additionalUserInfo: result._tokenResponse
    }, null, 2));

    const grantedScopes = result._tokenResponse?.scope?.split(' ') || [];
    console.log('Granted scopes from token response:', JSON.stringify(grantedScopes, null, 2));

    console.log('Credential from Google:', JSON.stringify(credential, null, 2));
    console.log('Granted scopes:', JSON.stringify(grantedScopes, null, 2));

    return {
      success: true,
      user: result.user,
      tokens: {
        accessToken: credential.accessToken,
        refreshToken: result.user.refreshToken,
      },
      scopes: grantedScopes
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