'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';
import { storeTokenInfo } from '@/src/app/actions/auth-actions';

export default function ClientCallback({ result }) {
  const router = useRouter();

  useEffect(() => {
    const handleTokenStorage = async () => {
      console.log(' [handleTokenStorage] Starting token storage:', {
        success: result.success,
        hasTokens: !!result.tokens,
        hasUser: !!auth.currentUser,
        timestamp: new Date().toISOString()
      });

      if (!result.success) {
        console.error('Token exchange failed:', result.error);
        router.push('/auth-error');
        return;
      }

      // Wait for Firebase auth
      if (!auth.currentUser) {
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

      // Store tokens
      const idToken = await auth.currentUser.getIdToken();
      await storeTokenInfo({ ...result.tokens, idToken });
      router.push('/');
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
