// src/app/actions/user-actions.js
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import moment from 'moment-timezone';

export async function getUserInfo() {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();//via header
  if (!currentUser) {
    return {success:false, error:'not logged in'}; 
  }  
  try {
    console.log('getUserInfo: Fetching user profile and topic root');
    const profile = await getUserProfile();
    
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

export async function getUserProfile() {
  console.log('getUserProfile')
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();//via header
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');
      const newUserData = {
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        topicRootId: null,
        preferences: {},
        createdAt: updateTime,
        updatedAt: updateTime
      };

      await setDoc(userRef, newUserData);
      return newUserData;
    }

    return userSnap.data();
  } catch (error) {
    console.error('Error fetching or creating user profile:', error);
    throw new Error('Failed to fetch or create user profile for',currentUser);
  }
}

export async function getTopicRoot(profile) {
  console.log('getTopicRoot')
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const db = getFirestore(firebaseServerApp);

    if (!profile.topicRootId) {
      // Create new topic root
      const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');
      
      const topicData = {
        title: profile.displayName + " Topic Root",
        description: "This is the root of all your topics",
        topic_type: 'root',
        owner: currentUser.uid,
        parents: null,
        created_at: updateTime,
        updated_at: updateTime
      };

      const topicRef = await addDoc(collection(db, 'topics'), topicData);
      
      // Update user profile with new topicRootId
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { topicRootId: topicRef.id }, { merge: true });

      // Fetch the newly created topic
      const topicSnap = await getDoc(topicRef);
      return { id: topicRef.id, ...topicSnap.data() };
    }

    // Fetch existing topic root
    const topicRef = doc(db, 'topics', profile.topicRootId);
    const topicSnap = await getDoc(topicRef);

    if (!topicSnap.exists()) {
      throw new Error('Topic root not found');
    }

    return { id: topicSnap.id, ...topicSnap.data() };
  } catch (error) {
    console.error('Error fetching or creating topic root:', error);
    throw new Error('Failed to fetch or create topic root');
  }
}


