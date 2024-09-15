import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { accessToken, refreshToken, userId } = await req.json();
  
  const db = getAdminFirestore();
  const userTokensRef = db.collection('userTokens').doc(userId);
  
  try {
    await userTokensRef.set({
      refreshToken: refreshToken,
      accessToken: accessToken,
      createdAt: new Date()
    }, { merge: true });
    
    return NextResponse.json({ message: 'Tokens stored successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error storing tokens:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
