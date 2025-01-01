// src/app/actions/user-actions.js
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { userService } from '@/src/services/userService';

export async function getUserInfo() {
  const idToken = await getIdToken(auth.currentUser);
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    return {success:false, error:'not logged in'}; 
  }  
  try {
    console.log('getUserInfo: Fetching user profile and topic root');
    const profile = await userService.getUserProfile(currentUser.uid);
    
    if (!profile) {
      throw new Error('User profile not found');
    }

    const topicRoot = await getTopicRoot(profile);

    // Ensure we're not passing any non-serializable data
    const serializableProfile = JSON.parse(JSON.stringify(profile));
    const serializableTopicRoot = JSON.parse(JSON.stringify(topicRoot));

    return {
      success: true,
      data: {
        profile: serializableProfile,
        topicRoot: serializableTopicRoot
      }
    };
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching user information'
    };
  }
}

export async function getTopicRoot(profile) {
  console.log('getTopicRoot')
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);

    if (!profile.topicRootId) {
      // Topic root creation is now handled by userService.initializeNewUserIfNeeded
      throw new Error('Topic root not found');
    }

    const topicRef = doc(db, 'topics', profile.topicRootId);
    const topicSnap = await getDoc(topicRef);
    
    if (!topicSnap.exists()) {
      throw new Error('Topic root document not found');
    }

    return {
      id: topicSnap.id,
      ...topicSnap.data()
    };
  } catch (error) {
    console.error('Error in getTopicRoot:', error);
    throw error;
  }
}
