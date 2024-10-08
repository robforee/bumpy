// src/lib/firebase/clientApp.js
'use client';

import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "./config.js";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(firebaseApp);
export const db_viaClient = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

// eg import { functions } from "./clientApp"

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    const swUrl = `/auth-service-worker.js?firebaseConfig=${encodeURIComponent(JSON.stringify(firebaseConfig))}`;
    navigator.serviceWorker.register(swUrl)
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.error('Service Worker registration failed:', error);
      });
  });
}