// app/actions/topic-actions.js
'use server'

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

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';

export async function createTopic_viaServer(parentId, topicData) {

  const idToken = await getIdToken(auth.currentUser);
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

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
  const idToken = await getIdToken(auth.currentUser);
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
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
  const idToken = await getIdToken(auth.currentUser);
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
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

export async function fetchTopicsByCategory(categories, parentId, idToken) {

  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  
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
        //where('owner', '==', currentUser.uid)
      );
    } else {
      q = query(
        topicsRef,
        where('topic_type', 'in', categories),
        where('parents', 'array-contains', parentId),
        //where('owner', '==', currentUser.uid)
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

