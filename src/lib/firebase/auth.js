import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth, db_viaClient } from "./clientApp";

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

    // Update the user's photoURL
    if (user.photoURL) {
      await updateProfile(user, { photoURL: user.photoURL });
    }

    await sendTokensToBackend(accessToken, refreshToken, user.uid);
    await storeUserScopes(user.uid, scopes);

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
    //console.log("User scopes stored successfully");
  } catch (error) {
    console.error("Error storing user scopes:", error);
    // You might want to handle this error more gracefully
  }
}

async function sendTokensToBackend(accessToken, refreshToken, userId) {
  try {
    const response = await fetch('/api/storeTokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, refreshToken, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // console.error('Failed to store tokens:', { accessToken, refreshToken, userId });
      // console.error('Failed to store tokens:', errorData);
      throw new Error(`Failed to store tokens: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendTokensToBackend:', error);
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