// src/lib/firebase/serverApp.js

import "server-only";

import { headers } from "next/headers";

import { firebaseConfig } from "./config";

import { getAuth } from "firebase/auth";
import { initializeServerApp } from "firebase/app";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/*
        // When to use getAuthenticatedAppForUser:
        // 1. User-specific read/write operations
        // 2. Operations that should respect Firestore security rules
        // 3. When you want to maintain user-level permissions

        async function userSpecificAction(userId) {
          const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
          // Use firebaseServerApp for Firestore operations
          // This will respect the user's permissions
        }

        // When to use getAdminApp:
        // 1. Administrative tasks
        // 2. Operations that need to bypass security rules
        // 3. Background jobs or server-side operations not tied to a specific user request

        function adminTask() {
          const adminApp = getAdminApp();
          const adminFirestore = getAdminFirestore();
          // Use adminFirestore for administrative Firestore operations
          // This has full access and bypasses security rules
        }
*/
export async function getAuthenticatedAppForUser() {
  const idToken = headers().get("Authorization")?.split("Bearer ")[1];

  //console.log('\n~~~ getAuthenticateAppForUser ~~~~\n',idToken);
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
  console.log(process.env)
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
