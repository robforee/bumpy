'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/src/lib/firebase/clientApp';

const auth = getAuth(firebaseApp);

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!mounted) return;

        if (!user || user.uid !== 'CtAyzps80VXRzna32Kdy0NHYcPe2') {
          console.log('Not admin, redirecting');
          router.replace('/');
          return;
        }
        
        setLoading(false);
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }, 1000);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <main>{children}</main>
      </div>
    </div>
  );
}
