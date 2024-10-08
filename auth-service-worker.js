import { initializeApp } from "firebase/app";
import { getAuth, getIdToken } from "firebase/auth";
import { getInstallations, getToken } from "firebase/installations";

// this is set during install
let firebaseConfig;
let firebaseApp;

self.addEventListener('install', event => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    (async () => {
      try {
        // extract firebase config from query string
        const serializedFirebaseConfig = new URL(self.location).searchParams.get('firebaseConfig');
        
        if (!serializedFirebaseConfig) {
          throw new Error('Firebase Config object not found in service worker query string.');
        }
        
        firebaseConfig = JSON.parse(serializedFirebaseConfig);
        
        // Initialize Firebase app here
        firebaseApp = initializeApp(firebaseConfig);
      } catch (error) {
        console.error("Error during service worker installation:", error);
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { origin } = new URL(event.request.url);
  if (origin !== self.location.origin) return;
  event.respondWith(fetchWithFirebaseHeaders(event.request));
});

async function fetchWithFirebaseHeaders(request) {
  if (!firebaseApp) {
    console.warn('Firebase app not initialized. Proceeding with original request from root.');
    return fetch(request);
  }

  try {
    const auth = getAuth(firebaseApp);
    const installations = getInstallations(firebaseApp);
    const headers = new Headers(request.headers);
    const [authIdToken, installationToken] = await Promise.all([
      getAuthIdToken(auth),
      getToken(installations),
    ]);
    headers.append("Firebase-Instance-ID-Token", installationToken);
    if (authIdToken) headers.append("Authorization", `Bearer ${authIdToken}`);
    const newRequest = new Request(request, { headers });
    return await fetch(newRequest);
  } catch (error) {
    console.error('Error in fetchWithFirebaseHeaders:', error);
    return fetch(request);
  }
}

async function getAuthIdToken(auth) {
  try {
    await auth.authStateReady();
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

self.addEventListener('activate', event => {
  console.log('Service Worker: Activate event');
});