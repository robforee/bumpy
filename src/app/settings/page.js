'use client';

import { useState, useEffect } from 'react';
import { getScopes_fromClient, addScope, deleteScope, storeTokens_fromClient } from '@/src/app/actions/auth-actions';
import { signInWithGoogle } from '@/src/lib/firebase/firebaseAuth';
import { getAuth } from 'firebase/auth';
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Loader2 } from "lucide-react";

const SCOPE_DESCRIPTIONS = {
  'https://www.googleapis.com/auth/calendar': 'View and manage your Google Calendar events and settings',
  'https://www.googleapis.com/auth/gmail.modify': 'View and modify your Gmail messages',
  'https://www.googleapis.com/auth/gmail.compose': 'Compose and send new Gmail messages',
  'https://www.googleapis.com/auth/gmail.labels': 'View and manage Gmail labels',
  'https://www.googleapis.com/auth/drive': 'Full access to Google Drive files and folders',
  'https://www.googleapis.com/auth/drive.file': 'View and manage specific Google Drive files',
  'https://www.googleapis.com/auth/drive.appdata': 'View and manage app-specific data in Google Drive',
  'https://www.googleapis.com/auth/chat.messages': 'View and manage Google Chat messages',
  'https://www.googleapis.com/auth/chat.spaces': 'View and manage Google Chat spaces',
  'https://www.googleapis.com/auth/contacts': 'View and manage your Google Contacts'
};

const availableScopes = Object.keys(SCOPE_DESCRIPTIONS);

export default function Settings() {
  const [currentScopes, setCurrentScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    loadScopes();
  }, []);

  async function loadScopes() {
    try {
      const auth = getAuth();
      
      // Wait for auth state to be ready first
      await auth.authStateReady();

      if (!auth.currentUser) {
        setError('Please sign in to manage your settings');
        setLoading(false);
        return;
      }
      
      // Force a token refresh to ensure we have a fresh token
      const idToken = await auth.currentUser.getIdToken(true);
      const userId = auth.currentUser.uid;
      
      if (!idToken || !userId) {
        throw new Error('Failed to get authentication token or user ID');
      }

      const response = await getScopes_fromClient(userId, idToken);
      if (response.success) {
        setCurrentScopes(response.scopes || []);
      } else {
        console.error('Failed to load scopes:', response.error);
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error in loadScopes:', error);
      setError('Failed to load scopes: ' + error.message);
      setCurrentScopes([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleAddScope(scope) {
    try {
      setProcessing(true);
      setError(null);

      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('Please sign in to manage scopes');
      }

      const idToken = await auth.currentUser.getIdToken();
      const result = await addScope(scope, idToken);
      
      if (result.success) {
        // Re-authenticate with new scope
        const signInResult = await signInWithGoogle([...currentScopes, scope], true);
        if (signInResult.success) {
          const { user, tokens: { accessToken, refreshToken }, scopes: grantedScopes } = signInResult;
          const newIdToken = await user.getIdToken();
          await storeTokens_fromClient(user.uid, accessToken, refreshToken, newIdToken, grantedScopes);
          await loadScopes();
        } else {
          // If user denied access, remove the scope from our database
          await deleteScope(scope, idToken);
          throw new Error(signInResult.error || 'Failed to grant access');
        }
      } else {
        setError(result.error || 'Failed to add scope');
      }
    } catch (error) {
      console.error('Error adding scope:', error);
      setError(error.message || 'Failed to add scope');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemoveScope(scope) {
    try {
      setProcessing(true);
      setError(null);

      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('Please sign in to manage scopes');
      }

      const idToken = await auth.currentUser.getIdToken();
      const result = await deleteScope(scope, idToken);
      
      if (result.success) {
        // Re-authenticate with remaining scopes
        const updatedScopes = currentScopes.filter(s => s !== scope);
        const signInResult = await signInWithGoogle(updatedScopes, true);
        if (signInResult.success) {
          const { user, tokens: { accessToken, refreshToken }, scopes: grantedScopes } = signInResult;
          const newIdToken = await user.getIdToken();
          await storeTokens_fromClient(user.uid, accessToken, refreshToken, newIdToken, grantedScopes);
          await loadScopes();
        }
      } else {
        setError(result.error || 'Failed to remove scope');
      }
    } catch (error) {
      console.error('Error removing scope:', error);
      setError(error.message || 'Failed to remove scope');
    } finally {
      setProcessing(false);
    }
  }

  const handleGrantAll = async () => {
    try {
      setProcessing(true);
      setError(null);

      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('Please sign in to manage scopes');
      }

      const idToken = await auth.currentUser.getIdToken();
      const addPromises = availableScopes.map(scope => addScope(scope, idToken));
      await Promise.all(addPromises);

      // Re-authenticate with all scopes to ensure they're active
      console.log('Re-authenticating with scopes:', JSON.stringify(availableScopes, null, 2));
      const signInResult = await signInWithGoogle(availableScopes, true);  // Force consent screen
      
      if (signInResult.success) {
        const { user, tokens: { accessToken, refreshToken }, scopes: grantedScopes } = signInResult;
        const newIdToken = await user.getIdToken();
        await storeTokens_fromClient(user.uid, accessToken, refreshToken, newIdToken, grantedScopes);
        await loadScopes();
      }
    } catch (error) {
      console.error('Error granting all scopes:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setProcessing(true);
      setError(null);

      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('Please sign in to manage scopes');
      }

      const idToken = await auth.currentUser.getIdToken();
      const deletePromises = currentScopes.map(scope => deleteScope(scope, idToken));
      await Promise.all(deletePromises);

      // Re-authenticate with no scopes
      const signInResult = await signInWithGoogle([], true);
      if (signInResult.success) {
        const { user, tokens: { accessToken, refreshToken }, scopes: grantedScopes } = signInResult;
        const newIdToken = await user.getIdToken();
        await storeTokens_fromClient(user.uid, accessToken, refreshToken, newIdToken, grantedScopes);
        await loadScopes();
      }
    } catch (error) {
      console.error('Error revoking all scopes:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Google API Permissions</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button
              onClick={handleGrantAll}
              disabled={processing}
              variant="default"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Grant All Scopes'
              )}
            </Button>

            <Button
              onClick={handleRevokeAll}
              disabled={processing}
              variant="destructive"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Revoke All Scopes'
              )}
            </Button>
          </div>

          <ul className="space-y-4">
            {availableScopes.map((scope) => {
              const isAuthorized = currentScopes?.includes(scope);
              return (
                <li key={scope} className={`flex items-center justify-between p-4 rounded-lg ${isAuthorized ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div>
                    <p className="font-medium">{SCOPE_DESCRIPTIONS[scope]}</p>
                    <p className="text-sm text-gray-500">{scope}</p>
                    {isAuthorized && (
                      <p className="text-sm text-blue-600 mt-1">✓ Currently authorized</p>
                    )}
                  </div>
                  <Button
                    variant={isAuthorized ? "destructive" : "default"}
                    onClick={() => isAuthorized ? handleRemoveScope(scope) : handleAddScope(scope)}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAuthorized ? (
                      'Revoke Access'
                    ) : (
                      'Grant Access'
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
