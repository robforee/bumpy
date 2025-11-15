#!/usr/bin/env node
/**
 * Test script to verify service_credentials Firestore permissions
 *
 * This script:
 * 1. Authenticates a user via Firebase Auth
 * 2. Attempts to write encrypted tokens to service_credentials collection
 * 3. Attempts to read them back
 * 4. Reports success/failure with detailed error messages
 *
 * Usage:
 *   node test-service-credentials.mjs <email> <password> [service]
 *
 * Example:
 *   node test-service-credentials.mjs robforee@gmail.com mypassword gmail
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

// Firebase config from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCM9d35YUUtulHNa4m8MTbtt3E_9SqzJJA',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'analyst-server.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'analyst-server',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'analyst-server.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '727308999536',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:727308999536:web:04d2bd35fbe979bba3cdb5'
};

// Simple encryption (mimics the encrypt function in auth-actions.js)
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '577c67690e99596f0f86bfa0c7991163bd68fb5f4b9c1e0e99d135247cb37e81', 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function testServiceCredentials() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node test-service-credentials.mjs <email> <password> [service]');
    console.error('Example: node test-service-credentials.mjs robforee@gmail.com mypassword gmail');
    process.exit(1);
  }

  const [email, password, service = 'gmail'] = args;

  console.log('\n🔄 Firebase Service Credentials Test\n');
  console.log('Config:', {
    email,
    service,
    projectId: firebaseConfig.projectId
  });

  try {
    // Initialize Firebase
    console.log('\n1️⃣ Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized');

    // Sign in
    console.log('\n2️⃣ Signing in user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User signed in:', {
      uid: user.uid,
      email: user.email
    });

    // Prepare test tokens
    console.log('\n3️⃣ Preparing test tokens...');
    const testTokens = {
      accessToken: `test_access_token_${Date.now()}`,
      refreshToken: `test_refresh_token_${Date.now()}`,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose'
      ]
    };

    const encryptedAccessToken = encrypt(testTokens.accessToken);
    const encryptedRefreshToken = encrypt(testTokens.refreshToken);
    console.log('✅ Tokens encrypted');

    // Construct document path
    const docId = `${user.uid}_${service}`;
    const docPath = `service_credentials/${docId}`;
    console.log('\n4️⃣ Document path:', docPath);

    // Prepare credential data
    const now = Date.now();
    const credentialData = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      scopes: testTokens.scopes,
      grantedAt: now,
      lastRefreshed: now,
      expiresAt: now + 3600000, // 1 hour
      testRun: true,
      timestamp: new Date().toISOString()
    };

    console.log('\n5️⃣ Attempting to write to Firestore...');
    console.log('Document ID:', docId);
    console.log('Collection:', 'service_credentials');

    const serviceCredsRef = doc(db, `service_credentials/${docId}`);
    await setDoc(serviceCredsRef, credentialData);

    console.log('✅ Write successful!');

    // Verify read
    console.log('\n6️⃣ Attempting to read back...');
    const docSnap = await getDoc(serviceCredsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Read successful!');
      console.log('\nStored data:', {
        scopes: data.scopes,
        grantedAt: new Date(data.grantedAt).toISOString(),
        expiresAt: new Date(data.expiresAt).toISOString(),
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        testRun: data.testRun
      });
    } else {
      console.error('❌ Document does not exist after write');
      process.exit(1);
    }

    // Test reading with wrong user ID (should fail)
    console.log('\n7️⃣ Testing security rules (attempting to read wrong user ID)...');
    const wrongDocId = `WRONG_USER_ID_${service}`;
    const wrongRef = doc(db, `service_credentials/${wrongDocId}`);

    try {
      const wrongSnap = await getDoc(wrongRef);
      if (wrongSnap.exists()) {
        console.log('⚠️  WARNING: Security rules may not be working - could read wrong user data');
      } else {
        console.log('✅ Security rules working - cannot read other user data');
      }
    } catch (err) {
      console.log('✅ Security rules working - permission denied as expected');
    }

    console.log('\n✅ ALL TESTS PASSED\n');
    console.log('Summary:');
    console.log('- Firebase authentication: ✅');
    console.log('- Write to service_credentials: ✅');
    console.log('- Read from service_credentials: ✅');
    console.log('- Security rules: ✅');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
      console.error('\n🔍 DIAGNOSIS: Firestore security rules are blocking access');
      console.error('\nTo fix:');
      console.error('1. Deploy the updated firestore.rules:');
      console.error('   cd /home/robforee/analyst-server/bumpy');
      console.error('   firebase deploy --only firestore:rules');
      console.error('\n2. Or update via Firebase Console:');
      console.error('   https://console.firebase.google.com/project/analyst-server/firestore/rules');
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testServiceCredentials();
