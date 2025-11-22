#!/usr/bin/env node

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/robforee/auth/.env' });

const app = admin.apps[0] || admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

const db = app.firestore();
const uid = 'CtAyzps80VXRzna32Kdy0NHYcPe2';

try {
  const tokenDoc = await db.collection('user_tokens').doc(uid).get();

  if (tokenDoc.exists) {
    const data = tokenDoc.data();
    console.log('✓ Token document exists');
    console.log('Fields:', Object.keys(data));
    console.log('Has accessToken:', Boolean(data.accessToken));
    console.log('Has refreshToken:', Boolean(data.refreshToken));
    console.log('Has authorizedScopes:', Boolean(data.authorizedScopes));
    console.log('Scopes:', data.authorizedScopes);
  } else {
    console.log('✗ Token document does NOT exist');
    console.log('\nYou need to authenticate via the web app first:');
    console.log('1. Visit https://redshirt.info');
    console.log('2. Sign in with Google');
    console.log('3. Authorize calendar access');
  }
} catch (error) {
  console.error('Error:', error.message);
}

process.exit(0);
