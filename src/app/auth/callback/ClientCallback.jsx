'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';
import { storeTokenInfo } from '@/src/app/actions/auth-actions';

export default function ClientCallback({ result }) {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleTokenStorage = async () => {
      // Prevent double execution
      if (processedRef.current) {
        console.log(' [handleTokenStorage] Skipping duplicate execution');
        return;
      }
      processedRef.current = true;

      console.log(' [handleTokenStorage] Starting token storage:', {
        success: result.success,
        hasTokens: !!result.tokens,
        hasUser: !!auth.currentUser,
        timestamp: new Date().toISOString()
      });

      if (!result.success) {
        console.error('Token exchange failed:', {
          error: result.error,
          timestamp: new Date().toISOString(),
          redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        });
        router.push('/auth-error');
        return;
      }

      // Wait for Firebase auth
      if (!auth.currentUser) {
        console.log('Waiting for auth state, current URI:', {
          uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
          timestamp: new Date().toISOString()
        });
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve();
            }
          });
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 10000);
        });
      }

      if (!auth.currentUser) {
        router.push('/auth-error');
        return;
      }

      console.log(' [handleTokenStorage] Token structure:', {
        tokens: {
          ...result.tokens,
          access_token: result.tokens.access_token ? `${result.tokens.access_token.substring(0, 10)}...` : null,
          refresh_token: result.tokens.refresh_token ? `${result.tokens.refresh_token.substring(0, 10)}...` : null
        }
      });

      // Store tokens
      const idToken = await auth.currentUser.getIdToken();
      const storeResult = await storeTokenInfo({
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token,
        scopes: result.tokens.scope?.split(' ') || [],
        idToken: idToken
      });
      console.log(' [handleTokenStorage] Store result:', storeResult);
      
      if (storeResult.success) {
        router.push('/');
      } else {
        router.push('/auth-error');
      }
    };

    handleTokenStorage();
  }, [result, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Sign In...</h1>
        <p>Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}
