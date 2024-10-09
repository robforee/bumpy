// src/lib/firebase/firebaseAuth.js

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./clientApp";
import { storeTokens } from '../../app/actions/auth-actions';

export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // Add the required scopes
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/contacts'
  ];

  scopes.forEach(scope => provider.addScope(scope));

  // Add these parameters to force account selection
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;
    const refreshToken = user.refreshToken;

    // Call the server action to store tokens
    try {
      await storeTokens({
        accessToken,
        refreshToken
      });
      return { success: true, user, action: 'DASHBOARD' };
    } catch (tokenError) {
      console.error("Error storing tokens:", tokenError);
      return { success: false, error: tokenError, action: 'CREATE_TOKENS' };
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("Popup closed by user");
      return { success: false, error, action: 'STAY' };
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log("Auth cancelled");
      return { success: false, error, action: 'STAY' };
    } else if (error.code === 'auth/popup-blocked') {
      return { success: false, error, action: 'ENABLE_POPUPS' };
    } else {
      return { success: false, error, action: 'AUTH_ERROR' };
    }
  }
}

export async function signOut() {
  try {
    await auth.signOut();
    return { success: true, action: 'HOME' };
  } catch (error) {
    console.error("Error signing out with Google", error);
    return { success: false, error, action: 'AUTH_ERROR' };
  }
}

export async function getUserIdToken() {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  throw new Error('No user is signed in');
}