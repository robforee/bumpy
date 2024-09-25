// src/services/userService.js
import { db_viaClient }        from '@/src/lib/firebase/clientApp';
// import { doc, getDoc, setDoc } from '@/src/lib/firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// getUserPreferences
// updateUserPreferences
// getUserActivity
// getUserRoles

export const userService = {
  
  async initializeNewUserIfNeeded(user) {
    const userRef = doc(db_viaClient, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('users/',user.uid)
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        topicRootId: null, // To be set
        preferences: {
          // Default preferences
        }
      });

      // Initialize topic root and other necessary data
      await this.initializeTopicRoot(user.uid);
    }else{
      console.log('users/',user.uid,'exists')
    }
  },

  async initializeTopicRoot(userId) {
    try {
      const addTopicFunction = httpsCallable(functions, 'addTopic');
      const result = await addTopicFunction({ 
        parentId: null, 
        topicData: { topic_type: 'topic', title: 'Root Topic' } 
      });
      const newTopicId = result.data.id;
  
      const updateUserFunction = httpsCallable(functions, 'updateUser');
      await updateUserFunction({ 
        updateData: { topicRootId: newTopicId } 
      });
  
      console.log(`Topic root initialized for user ${userId} with ID ${newTopicId}`);
      return newTopicId;
    } catch (error) {
      console.error('Error initializing topic root:', error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    try {
      const userRef = doc(db_viaClient, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.log("No such user!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },  

};