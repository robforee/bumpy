#!/usr/bin/env node
// Load environment using env-loader skill before starting Next.js

import { loadEnv } from '../../../.claude/skills/env-loader/lib/env-loader.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

console.log('🔧 Loading environment with env-loader...');

// Load layered environment (root + PAI + skill if exists)
loadEnv({
  skill: 'bumpy',  // Will look for ~/.claude/skills/bumpy/.env if it exists
  loadRoot: true,   // Load ~/auth/.env
  verbose: true
});

console.log('✅ Environment loaded');

// Load Firebase Admin SDK credentials from service account JSON
let firebaseAdminConfig = {};
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(homedir(), 'auth/analyst-server-service.json');

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Loaded Firebase service account from:', serviceAccountPath);

  firebaseAdminConfig = {
    FIREBASE_PROJECT_ID: serviceAccount.project_id,
    FIREBASE_PRIVATE_KEY_ID: serviceAccount.private_key_id,
    FIREBASE_PRIVATE_KEY: serviceAccount.private_key,
    FIREBASE_CLIENT_EMAIL: serviceAccount.client_email,
    FIREBASE_CLIENT_ID: serviceAccount.client_id,
    FIREBASE_AUTH_URI: serviceAccount.auth_uri,
    FIREBASE_TOKEN_URI: serviceAccount.token_uri,
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: serviceAccount.auth_provider_x509_cert_url,
    FIREBASE_CLIENT_X509_CERT_URL: serviceAccount.client_x509_cert_url,
  };
} catch (error) {
  console.warn('⚠️  Could not load service account:', error.message);
}

// Map env-loader vars to Next.js NEXT_PUBLIC_ vars
const firebaseConfig = {
  // Client-side (NEXT_PUBLIC_*)
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || 'analyst-server.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || 'analyst-server',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'analyst-server.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',

  // Server-side
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  // Firebase Admin SDK (from service account JSON)
  ...firebaseAdminConfig
};

// Write to .env.local for Next.js to pick up
const envContent = Object.entries(firebaseConfig)
  .filter(([_, value]) => value !== undefined)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const envPath = join(process.cwd(), '.env.local');
writeFileSync(envPath, envContent);

console.log('✅ Generated .env.local with', Object.keys(firebaseConfig).length, 'variables');
console.log('');
console.log('📝 .env.local contents:');
Object.entries(firebaseConfig)
  .filter(([_, value]) => value !== undefined)
  .forEach(([key, value]) => {
    // Hide secrets in console
    const display = key.includes('SECRET') || key.includes('KEY')
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`   ${key}=${display}`);
  });

console.log('');
console.log('🚀 Ready to start Next.js dev server');
