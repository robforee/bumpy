'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase/clientApp';
import { encrypt } from '@/src/app/actions/auth-actions';

export default function ClientCallback({ result, service }) {
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleTokenStorage = async () => {
      console.log('🔄 [ClientCallback] Handling token storage:', {
        success: result.success,
        hasTokens: !!result.tokens,
        service,
        hasUser: !!auth.currentUser,
        timestamp: new Date().toISOString()
      });

      if (!result.success) {
        console.error('❌ [ClientCallback] Token exchange failed:', result.error);
        setStatus('error');
        setError(result.error || 'Token exchange failed');
        setTimeout(() => router.push('/dashboard'), 3000);
        return;
      }

      // Wait for auth state to be ready
      const waitForAuth = () => new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Auth state timeout - please sign in again'));
        }, 10000); // 10 second timeout

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(user);
          }
        });
      });

      let currentUser;
      try {
        currentUser = await waitForAuth();
        console.log('✅ [ClientCallback] Auth state ready:', currentUser.email);
      } catch (err) {
        console.error('❌ [ClientCallback] Auth state error:', err);
        setStatus('error');
        setError('Please sign in again to connect services');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        if (service) {
          // Service authorization - store in service_credentials
          console.log(`🔐 [ClientCallback] Storing ${service} authorization...`);

          const db = getFirestore();
          const serviceCredsRef = doc(db, `service_credentials/${currentUser.uid}_${service}`);

          // Encrypt tokens
          const encryptedAccessToken = await encrypt(result.tokens.accessToken);
          const encryptedRefreshToken = result.tokens.refreshToken ? await encrypt(result.tokens.refreshToken) : null;

          const now = Date.now();
          const credentialData = {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            scopes: result.tokens.scopes || [],
            grantedAt: now,
            lastRefreshed: now,
            expiresAt: now + 3600000 // 1 hour from now
          };

          await setDoc(serviceCredsRef, credentialData);

          console.log(`✅ [ClientCallback] ${service} authorization complete`);
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          // Legacy flow - redirect to dashboard
          console.log('⚠️ [ClientCallback] No service specified, redirecting to dashboard');
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } catch (err) {
        console.error('❌ [ClientCallback] Error storing tokens:', err);
        setStatus('error');
        setError(err.message || 'Failed to save authorization');
        setTimeout(() => router.push('/dashboard'), 3000);
      }
    };

    handleTokenStorage();
  }, [result, service, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        {status === 'processing' && (
          <>
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Completing Authorization...</h1>
            {service && (
              <p className="text-gray-600">Saving your {service} permissions</p>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-green-600">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Success!</h1>
            {service && (
              <p className="text-gray-600">{service} connected successfully</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-red-600">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Authorization Failed</h1>
            <p className="text-gray-700">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
