// src/lib/firebase/serverApp.js
//
// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment

import "server-only";

import { headers } from "next/headers";

import { firebaseConfig } from "./config";

import { getAuth } from "firebase/auth";
import { initializeServerApp } from "firebase/app";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function getAuthenticatedAppForUser() {
  const idToken = headers().get("Authorization")?.split("Bearer ")[1];

  const firebaseServerApp = initializeServerApp(
    firebaseConfig,
    idToken
      ? {
          authIdToken: idToken,
        }
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
// export async function getAuthenticatedAppForUser() {
//   const idToken = headers().get("Authorization")?.split("Bearer ")[1];

//   const firebaseServerApp = initializeApp(firebaseConfig, 'SERVER');

//   const auth = getAuth(firebaseServerApp);
//   await auth.authStateReady();

//   // You might want to verify the idToken here if needed

//   return { firebaseServerApp, currentUser: auth.currentUser };
// }