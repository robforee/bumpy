// src/lib/firebase/auth.js
// provider.addScope('https://www.googleapis.com/auth/gmail.modify');
// provider.addScope('https://www.googleapis.com/auth/drive.file');
// provider.addScope('https://www.googleapis.com/auth/userinfo.email');



import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./clientApp";

//import { auth } from "@/src/lib/firebase/clientApp";

export function onAuthStateChanged(cb) {
	return _onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Add the required scopes
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

  // Add these parameters to force account selection
  provider.setCustomParameters({
    prompt: 'select_account'
  });  

  try {
    const result = await signInWithPopup(auth, provider);
    
    // The signed-in user info.
    const user = result.user;
    
    // This gives you a Google Access Token.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    // Get the refresh token
    const refreshToken = user.refreshToken;

    // Send the tokens to your backend
    await sendTokensToBackend(accessToken, refreshToken, user.uid);

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

async function sendTokensToBackend(accessToken, refreshToken, userId) {
  const response = await fetch('/api/storeTokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken, refreshToken, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to store tokens');
  }
}

export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}

export async function getUserIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  throw new Error('No user is signed in');
}