// src/lib/firebase/serverApp.js
import "server-only";

import { headers } from "next/headers";

import { firebaseConfig } from "./config";

import { getAuth } from "firebase/auth";
import { initializeServerApp } from "firebase/app";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

export async function getAuthenticatedAppForUser(idToken) {
  
  const firebaseServerApp = initializeServerApp(
    firebaseConfig,
    idToken ? { authIdToken: idToken, }
      : {}
  );

  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();

  return { firebaseServerApp, currentUser: auth.currentUser };
}

export function getAdminApp() {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_AUTH_URI',
    'FIREBASE_TOKEN_URI',
    'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
    'FIREBASE_CLIENT_X509_CERT_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`);
  }
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getApps()[0];
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
