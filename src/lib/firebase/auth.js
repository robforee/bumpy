// src/lib/firebase/auth.js

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth, db_viaClient } from "./clientApp";
import { httpsCallable } from "firebase/functions";
import { userService } from '../../services/userService';

import { functions } from './clientApp'; // 

// Initialize Firestore
//const db = getFirestore();

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

    await userService.initializeNewUserIfNeeded(user)

    // Call the new cloud function to store tokens
    await storeTokens(accessToken, refreshToken, user.uid);
    
    // await storeUserScopes(user.uid, scopes);

    console.log('not storing scopes')

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

async function storeUserScopes(userId, scopes) {
  try {
    const userRef = doc(db_viaClient, "user_scopes", userId);
    await setDoc(userRef, { scopes: scopes }, { merge: true });
    //console.log("User scopes stored successfully for user:", userId);
  } catch (error) {
    console.error("Error storing user scopes:", error);
  }
}

//import { getAuth } from 'firebase/auth';

/*
*  functions from ./clientApp
*  httpsCallable from firebase/functions lib
*/
async function storeTokens(accessToken, refreshToken) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const funkPath = 'https://us-central1-analyst-server.cloudfunctions.net/storeTokens2';
    const funk = 'storeTokens2';
    const storeTokensFunction = httpsCallable(functions, funkPath);

    console.log('sending user.uid as userId',user?.uid, 'NODE_ENV (set in clientApp)', process.env.NODE_ENV )

    const result = await storeTokensFunction({ 
      accessToken, 
      refreshToken,
      userId: user.uid 
    });

    console.log('Tokens stored successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error;
  }
}

async function storeTokens1(accessToken, refreshToken, userId) {
  try {

    const storeTokensFunction = httpsCallable(functions, 'storeTokens');
    const response = await storeTokensFunction({ accessToken, refreshToken });

  } catch (error) {
    console.error('Error in storeTokens function:', error);
    if (error.message.includes("Unexpected end of JSON input")) {
      console.error('Unexpected end of JSON input error, please check network connectivity or payload structure.');
    }
    throw error;
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
