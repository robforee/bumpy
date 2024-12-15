'use client';

import { useState, useEffect } from 'react';
import { getScopes_fromClient, addScope, deleteScope } from '@/src/app/actions/auth-actions';
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
      if (!auth.currentUser) {
        setError('Please sign in to manage your settings');
        setLoading(false);
        return;
      }
      const idToken = await auth.currentUser.getIdToken();
      const scopes = await getScopes_fromClient(auth.currentUser.uid, idToken);
      setCurrentScopes(scopes || []);
    } catch (error) {
      setError('Failed to load scopes: ' + error.message);
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
        await signInWithGoogle([...currentScopes, scope]);
        await loadScopes();
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
      await deleteScope(scope);
      // Re-authenticate with remaining scopes
      const updatedScopes = currentScopes.filter(s => s !== scope);
      await signInWithGoogle(updatedScopes);
      await loadScopes();
    } catch (error) {
      setError('Failed to remove scope: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // All available scopes
  const allScopes = Object.keys(SCOPE_DESCRIPTIONS);

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
          <ul className="space-y-4">
            {allScopes.map((scope) => {
              const isAuthorized = currentScopes.includes(scope);
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
