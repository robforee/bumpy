'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleOAuth2Callback } from '@/src/lib/firebase/firebaseAuth';
import { auth } from '@/src/lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';

export default function OAuth2Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('OAuth2 callback received:', JSON.stringify({
        hasCode: !!code,
        codePreview: code ? `${code.substring(0, 8)}...` : 'none',
        error: error || 'none',
        isUserSignedIn: !!auth.currentUser
      }, null, 2));

      if (error) {
        console.error('OAuth2 error:', JSON.stringify({
          error: error
        }, null, 2));
        router.push('/auth-error');
        return;
      }

      if (!code) {
        console.error('No code in OAuth2 callback');
        router.push('/auth-error');
        return;
      }

      // Wait for auth state to be ready
      if (!auth.currentUser) {
        console.log('Waiting for auth state...');
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', JSON.stringify({
              hasUser: !!user,
              email: user?.email
            }, null, 2));
            if (user) {
              unsubscribe();
              resolve();
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 10000);
        });
      }

      if (!auth.currentUser) {
        console.error('No user after waiting for auth state');
        router.push('/auth-error');
        return;
      }

      const result = await handleOAuth2Callback(code);
      console.log('OAuth2 callback result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        router.push('/');
      } else {
        router.push('/auth-error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Sign In...</h1>
        <p>Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}
