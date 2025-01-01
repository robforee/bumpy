import { db_viaClient } from '@/src/lib/firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/lib/firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import moment from 'moment-timezone';

export const userService = {
  
  async initializeNewUserIfNeeded(user) {
    console.log('Initialize user:', JSON.stringify({
      uid: user?.uid,
      email: user?.email
    }));

    if (!user || !user.uid) {
      console.error('Invalid user object');
      return;
    }

    const userRef = doc(db_viaClient, 'users', user.uid);
    const tokensRef = doc(db_viaClient, 'user_tokens', user.uid);
    const authorizedScopesRef = doc(db_viaClient, 'authorized_scopes', user.uid);
    
    console.log('Checking if user exists in Firestore:', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('Creating user:', user.uid);
      
      const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');
      
      // Create user document with available fields
      const userData = {
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        topicRootId: null,
        preferences: {
          'gmail-sync': true,
          'drive-sync': true,
          'calendar-sync': true,
        },
        syncGmail: {
          consecutiveFailures: 0
        },
        createdAt: updateTime,
        updatedAt: updateTime
      };
      console.log('User data to be stored:', userData);

      try {
        // Create all necessary documents
        await Promise.all([
          setDoc(userRef, userData),
          setDoc(tokensRef, { userEmail: user.email }),
          setDoc(authorizedScopesRef, { userEmail: user.email })
        ]);
        console.log('User profile and related collections created successfully');
        
        // Initialize topic root after user document is created
        console.log('Initializing topic root...');
        await this.initializeTopicRoot(user.uid);
        console.log('Topic root initialized');
        
        return userData;
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    } else {
      console.log('User profile already exists:', user.uid);
      return userSnap.data();
    }
  },

  async initializeTopicRoot(userId) {
    try {
      const userRef = doc(db_viaClient, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData.topicRootId) {
        const updateTime = moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm [CST]');
        const topicRef = doc(db_viaClient, 'topics', userId);
        
        await setDoc(topicRef, {
          title: `${userData.displayName || 'User'}'s Topic Root`,
          description: "This is the root of all your topics",
          topic_type: 'root',
          parent_id: null,
          owner_id: userId,
          created_at: updateTime,
          updated_at: updateTime
        });

        await updateDoc(userRef, {
          topicRootId: userId
        });

        console.log('Topic root created for user:', userId);
      }
    } catch (error) {
      console.error('Error initializing topic root:', error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    if (!userId) {
      console.error('getUserProfile: No userId provided');
      return null;
    }

    try {
      const userRef = doc(db_viaClient, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateUserPhotoURL(userId, photoURL) {
    if (!userId || !photoURL) return;
    try {
      const userRef = doc(db_viaClient, 'users', userId);
      await updateDoc(userRef, { photoURL });
    } catch (error) {
      console.error('Error updating user photo URL:', error);
      throw error;
    }
  },

  async updateUserTopicRoot(userId, topicRootId) {
    if (!userId || !topicRootId) return;
    try {
      const userRef = doc(db_viaClient, 'users', userId);
      await updateDoc(userRef, { topicRootId });
    } catch (error) {
      console.error('Error updating user topic root:', error);
      throw error;
    }
  }
};