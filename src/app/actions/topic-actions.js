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
  serverTimestamp, Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';

export async function createTopic(parentId, topicData, idToken) {

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
      owner_email: currentUser.email,
      owner_name: currentUser.displayName || 'unknown',
      parents: parentId ? [parentId] : [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'topics'), newTopic);

    if (parentId) {
      await updateDoc(doc(db, 'topics', parentId), {
        children: arrayUnion(docRef.id)
      });
    }
console.log('ME',{ id: docRef.id, ...newTopic })
    return JSON.parse(JSON.stringify({ id: docRef.id, ...newTopic }));
  } catch (error) {
    console.error("Error adding new topic:", error);
    throw error;
  }
}

export async function updateTopic(topicId, updatedData, idToken) {

  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

  if (!currentUser) {
    throw new Error('User not authenticated',idToken);
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const topicRef = doc(db, 'topics', topicId);
    
    const topicSnap = await getDoc(topicRef);
    if (!topicSnap.exists()) {
      throw new Error('Topic not found');
    }

    // also cleaned in TopicTableContainer
    console.log('clean inputs whhile updating topic on server')
    const updatableFields = ['title', 'topic_type', 'topic_sub_type',
      'subtitle', 'text', 'prompt', 'concept', 'concept_json', 'topic_type'];
    
    // warn if not in list
    console.warn("Non-updatable fields:",Object.keys(updatedData).filter(key => !updatableFields.includes(key)));

    const dataToUpdate = updatableFields.reduce((acc, field) => {
      if (updatedData[field] !== undefined) {
        acc[field] = updatedData[field];
      }
      return acc;
    }, {});

    dataToUpdate.updated_at = serverTimestamp();

    await updateDoc(topicRef, dataToUpdate);
    console.log('// updateTopic(',topicId,')',dataToUpdate);

    return { id: topicId, ...convertTimestamps(updatedData) };
  } catch (error) {
    console.error('Error updating topic:', error);
    throw error;
  }
}

export async function deleteTopic(topicId,idToken) {
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

export async function fetchTopicsByCategory(categories, parentId, idToken, subType) {
  // Input validation
  if (!idToken) {
    throw new Error('Authentication token is required');
  }

  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Validate categories parameter
  if (!categories && categories !== '-all' && categories !== '-topic') {
    throw new Error('Categories parameter is required');
  }

  // If categories is an array, ensure it's not empty
  if (Array.isArray(categories) && categories.length === 0) {
    throw new Error('Categories array cannot be empty');
  }
  
  const db = getFirestore(firebaseServerApp);
  
  try {
    const topicsRef = collection(db, 'topics');
    let q;
    
    if (categories === '-all') {
      // For -all category, we don't need parentId
      q = query(
        topicsRef,
        where('topic_type', '!=', 'a-setting')
      );
    } else if (categories === '-topic') {
      // For -topic category, we need parentId
      if (!parentId) {
        // Return empty array instead of throwing error
        return [];
      }
      q = query(
        topicsRef,
        where('topic_type', '!=', 'topic'),
        where('parents', 'array-contains', parentId)
      );
    } else if (subType !== undefined && subType !== null) {
      if (!parentId) {
        // Return empty array instead of throwing error
        return [];
      }
      q = query(
        topicsRef,
        where('topic_type', 'in', Array.isArray(categories) ? categories : [categories]),
        where('topic_sub_type', '==', subType),
        where('parents', 'array-contains', parentId)
      );
    } else {
      if (!parentId) {
        // For regular categories without parentId, just filter by topic_type
        q = query(
          topicsRef,
          where('topic_type', 'in', Array.isArray(categories) ? categories : [categories])
        );
      } else {
        // If parentId is provided, include it in the query
        q = query(
          topicsRef,
          where('topic_type', 'in', Array.isArray(categories) ? categories : [categories]),
          where('parents', 'array-contains', parentId)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data)
      };
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }
}

export async function fetchTopic(topicId, idToken) {

  // Handle 'none' case
  if (topicId === 'none') {
    return {
      id: 'none',
      title: 'No Parent',
      text: '',
      error: 'No parent topic exists'
    };
  }

  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);

    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const db = getFirestore(firebaseServerApp);
    
    const topicRef = doc(db, 'topics', topicId);
    const topicSnap = await getDoc(topicRef);

    if (!topicSnap.exists()) {
      return {
        id: topicId,
        title: 'Not Found',
        text: '',
        error: 'Topic not found'
      };
    }

    const topicData = topicSnap.data();

    // Check if the current user has permission to access this topic
    if (topicData.owner !== currentUser.uid) {
      return {
        id: topicId,
        title: 'Access Denied',
        text: '',
        error: 'User does not have permission to access this topic'
      };
    }

    // Convert Timestamp objects to ISO strings
    const convertedTopicData = convertTimestamps(topicData);

    return { id: topicSnap.id, ...convertedTopicData };
  } catch (error) {
    console.error("Error fetching topic:", error);
    return {
      id: topicId,
      title: 'Error',
      text: '',
      error: error.message || 'Failed to fetch topic'
    };
  }
}

function convertTimestamps(obj) {
  const newObj = { ...obj };
  for (const [key, value] of Object.entries(newObj)) {
    if (value instanceof Timestamp) {
      newObj[key] = value.toDate().toISOString();
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = convertTimestamps(value);
    }
  }
  return newObj;
}