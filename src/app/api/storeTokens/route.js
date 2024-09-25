// src/app/api/storeTokens/route.js

import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { NextResponse }      from 'next/server';
import { storeTokens }           from  '@/src/lib/tokenManager'

// Encryption key should be stored securely, preferably in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16 bytes

export async function POST(req) {
  const { accessToken, refreshToken, userId } = await req.json();

  console.log('~~~~~ 1')
  const db = getAdminFirestore();
  console.log('~~~~~ 2')
  const userTokensRef = db.collection('user_tokens').doc(userId);
  console.log('~~~~~ 3')
  
  // Calculate expiration time (1 hour from now)
  const expirationTime = Date.now() + 3600000; // 3600000 ms = 1 hour

  try {
    console.log('~~~~~ 4')
    storeTokens( userId, accessToken, refreshToken )
    console.log('~~~~~ 5')
    
    return NextResponse.json({ message: 'Tokens stored successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error storing tokens:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}