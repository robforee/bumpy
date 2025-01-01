// src/lib/firebase/firebaseAuth.js
// CLIENT SIDE FUNCTIONS, CANNOT DOT INTO CLIENT MODULE FROM SERVER

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
} from "firebase/auth";

import { auth } from "@/src/lib/firebase/clientApp";
import { storeTokenInfo } from "@/src/app/actions/auth-actions";

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
  console.log('Starting sign in with:', JSON.stringify({
    scopes: scopes,
    forceConsent: forceConsent,
    scopesType: typeof scopes,
    isArray: Array.isArray(scopes)
  }, null, 2));

  try {
    const provider = new GoogleAuthProvider();
    
    // Ensure scopes is an array
    const scopesToAdd = Array.isArray(scopes) ? scopes : [];
    
    // Add requested scopes
    scopesToAdd.forEach(scope => {
      console.log('Adding scope:', JSON.stringify({
        scope: scope
      }, null, 2));
      provider.addScope(scope);
    });

    // Always force consent to get refresh token
    // Build Google OAuth2 URL directly
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    console.log('OAuth2 config:', JSON.stringify({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirectUri: redirectUri,
      scopes: scopes.join(' ')
    }, null, 2));

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'profile', 'email', ...scopesToAdd].join(' ')
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Redirecting to:', JSON.stringify({
      authUrl: authUrl
    }, null, 2));
    
    // Sign in with Firebase first
    const signInWithPopup_result = await signInWithPopup(auth, provider);
    console.log('Firebase sign in result:', JSON.stringify({
      user: {
        uid: signInWithPopup_result.user.uid,
        email: signInWithPopup_result.user.email
      },
      hasIdToken: !!(await signInWithPopup_result.user.getIdToken())
    }, null, 2));

    // Then redirect to Google's consent page
    window.location.href = authUrl;
    return;
  } catch (error) {
    console.error('Sign in error:', JSON.stringify({
      error: error.message,
      code: error.code,
      stack: error.stack
    }, null, 2));
    return {
      success: false,
      error: error.message
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

export async function handleOAuth2Callback(code) {
  try {
    console.log('OAuth2 callback handler:', JSON.stringify({
      codePreview: code.slice(0, 8) + '...',
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Get ID token from current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    const idToken = await user.getIdToken();

    console.log('Current user:', JSON.stringify({
      success: true,
      uid: user.uid,
      email: user.email,
      hasIdToken: !!idToken
    }, null, 2));

    // Now exchange code for tokens
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ code })
    });

    const tokenResult = await response.json();
    console.log('Token exchange response:', JSON.stringify({
      status: response.status,
      success: tokenResult.success,
      hasAccessToken: !!tokenResult.tokens?.access_token,
      hasRefreshToken: !!tokenResult.tokens?.refresh_token,
      hasError: !!tokenResult.error,
      error: tokenResult.error,
      errorDescription: tokenResult.error_description
    }, null, 2));

    if (!tokenResult.success) {
      throw new Error(tokenResult.error_description || tokenResult.error || 'Failed to exchange code for tokens');
    }

    // Store the tokens
    const storeResult = await storeTokenInfo({
      accessToken: tokenResult.tokens.access_token,
      refreshToken: tokenResult.tokens.refresh_token,
      scopes: (tokenResult.tokens.scope || '').split(' ').filter(Boolean),
      idToken
    });
    console.log('Store tokens result:', JSON.stringify(storeResult, null, 2));

    return {
      success: true,
      tokens: {
        hasAccessToken: !!tokenResult.tokens.access_token,
        hasRefreshToken: !!tokenResult.tokens.refresh_token,
        accessTokenPreview: tokenResult.tokens.access_token ? 
          tokenResult.tokens.access_token.substring(0, 8) : 'none',
        refreshTokenPreview: tokenResult.tokens.refresh_token ? 
          tokenResult.tokens.refresh_token.substring(0, 8) : 'none'
      }
    };
  } catch (error) {
    console.error('OAuth2 callback error:', JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2));
    return {
      success: false,
      error: error.message
    };
  }
}