// app/actions/topic-actions.js
'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore,
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

/**
 * Creates a new topic in the Firestore database.
 * 
 * @async
 * @function createTopic
 * @param {string|null} parentId - The ID of the parent topic. If null, the new topic will be a root topic.
 * @param {Object} topicData - The data for the new topic.
 * @param {string} [topicData.topic_type='default'] - The type of the topic.
 * @param {string} [topicData.title] - The title of the topic.
 * @param {string} [topicData.subtitle] - The subtitle of the topic.
 * @param {string} [topicData.text] - The main text content of the topic.
 * @param {string} [topicData.prompt] - Any prompt associated with the topic.
 * @throws {Error} Throws an error if the user is not authenticated.
 * @throws {Error} Throws an error if there's a problem adding the new topic to Firestore.
 * @returns {Promise<Object>} A promise that resolves to an object containing the new topic's data, including its auto-generated ID.
 * 
 * @example
 * const newTopicData = {
 *   title: "My New Topic",
 *   topic_type: "article",
 *   text: "This is the content of my new topic."
 * };
 * try {
 *   const result = await createTopic("parentTopicId", newTopicData);
 *   console.log("New topic created:", result);
 * } catch (error) {
 *   console.error("Failed to create topic:", error);
 * }
 */

export async function createTopic_viaServer(parentId, topicData) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const newTopic = {
      ...topicData,
      topic_type: topicData.topic_type || 'default',
      owner: currentUser.uid,
      parents: parentId ? [parentId] : [],
      children: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'topics'), newTopic);

    if (parentId) {
      await updateDoc(doc(db, 'topics', parentId), {
        children: arrayUnion(docRef.id)
      });
    }

    return { id: docRef.id, ...newTopic };
  } catch (error) {
    console.error("Error adding new topic:", error);
    throw error;
  }
}

export async function updateTopic(topicId, updatedData) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const topicRef = doc(db, 'topics', topicId);
    
    const topicSnap = await getDoc(topicRef);
    if (!topicSnap.exists()) {
      throw new Error('Topic not found');
    }

    const updatableFields = ['title', 'subtitle', 'text', 'prompt', 'topic_type'];

    const dataToUpdate = updatableFields.reduce((acc, field) => {
      if (updatedData[field] !== undefined) {
        acc[field] = updatedData[field];
      }
      return acc;
    }, {});

    dataToUpdate.updated_at = serverTimestamp();

    await updateDoc(topicRef, dataToUpdate);

    return { id: topicId, ...dataToUpdate };
  } catch (error) {
    console.error('Error updating topic:', error);
    throw error;
  }
}

export async function deleteTopic(topicId) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const topicRef = doc(db, 'topics', topicId);
    
    const topicSnap = await getDoc(topicRef);
    if (!topicSnap.exists()) {
      throw new Error('Topic not found');
    }
    
    const topicData = topicSnap.data();
    
    if (topicData.parents && topicData.parents.length > 0) {
      const parentId = topicData.parents[0];
      const parentRef = doc(db, 'topics', parentId);
      await updateDoc(parentRef, {
        children: arrayRemove(topicId)
      });
    }
    
    await deleteDoc(topicRef);
    
    return { success: true, id: topicId };
  } catch (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
}

export async function fetchTopicsByCategory(categories, parentId) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const topicsRef = collection(db, 'topics');

    let q;
    
    if (categories === '-topic') {
      q = query(
        topicsRef,
        where('topic_type', '!=', 'topic'),
        where('parents', 'array-contains', parentId),
        where('owner', '==', currentUser.uid)
      );
    } else {
      q = query(
        topicsRef,
        where('topic_type', 'in', categories),
        where('parents', 'array-contains', parentId),
        where('owner', '==', currentUser.uid)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp to JavaScript Date if necessary
      if (data.updated_at) {
        data.updated_at = data.updated_at.toDate();
      }
      if (data.created_at) {
        data.created_at = data.created_at.toDate();
      }
      return { id: doc.id, ...data };
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
}

