// src/services/userService.js
import { db_viaClient } from '@/src/lib/firebase/clientApp';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/lib/firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const userService = {
  
  async initializeNewUserIfNeeded(user) {
    const userRef = doc(db_viaClient, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        topicRootId: null,
        preferences: {}
      });

      await this.initializeTopicRoot(user.uid);
    } else {
      // Update the photoURL if it has changed
      if (user.photoURL !== userSnap.data().photoURL) {
        await updateDoc(userRef, { photoURL: user.photoURL });
      }
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
  async updateUserPhotoURL(userId, photoURL) {
    try {
      const userRef = doc(db_viaClient, 'users', userId);
      await updateDoc(userRef, { photoURL: photoURL });
      console.log(`Updated photoURL for user ${userId}`);
    } catch (error) {
      console.error('Error updating user photoURL:', error);
      throw error;
    }
  },  

};