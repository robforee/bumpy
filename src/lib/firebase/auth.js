import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./clientApp";

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
    
    // The signed-in user info.
    const user = result.user;
    
    // This gives you a Google Access Token.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    // Get the refresh token
    const refreshToken = user.refreshToken;

    // Send the tokens to your backend
    await sendTokensToBackend(accessToken, refreshToken, user.uid);

    // Store the scopes in Firestore
    // console.log('writing scopes',user.uid)
    await storeUserScopes(user.uid, scopes);// write as user?
    // console.log('writing scopes',user.uid)

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

async function storeUserScopes(userId, scopes) {
  try {
    const userRef = doc(db, "user_scopes", userId);
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
      console.error('Failed to store tokens:', errorData);
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