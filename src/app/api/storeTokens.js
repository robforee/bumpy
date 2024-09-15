// src/app/api/storeTokens.js

import { getAdminFirestore } from '@/src/lib/firebase/adminApp';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { accessToken, refreshToken, userId } = req.body;
    
    const db = getAdminFirestore();
    const userTokensRef = db.collection('userTokens').doc(userId);
    
    try {
      await userTokensRef.set({
        refreshToken: refreshToken,
        accessToken: accessToken,
        createdAt: new Date()
      }, { merge: true });
      
      res.status(200).json({ message: 'Tokens stored successfully' });
    } catch (error) {
      console.error('Error storing tokens:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}