'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  collection, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc
} from 'firebase/firestore';

export async function updateTopicTitle_fromClient(topicId, newTitle, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const topicRef = doc(db, 'topics', topicId);
    await updateDoc(topicRef, {
      title: newTitle,
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating topic title:", error);
    return { success: false, error: error.message };
  }
}

export async function addTopic_fromClient(parentId, topicData, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
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

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding new topic:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchRelationshipTopics_fromClient(topicId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const topicRef = doc(db, 'topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) {
      throw new Error('Topic not found');
    }

    const topic = topicDoc.data();
    const parentIds = topic.parents || [];
    const childrenIds = topic.children || [];

    // Fetch parents
    const parents = await Promise.all(
      parentIds.map(async (parentId) => {
        const parentDoc = await getDoc(doc(db, 'topics', parentId));
        return parentDoc.exists() ? { id: parentDoc.id, ...parentDoc.data() } : null;
      })
    );

    // Fetch children
    const children = await Promise.all(
      childrenIds.map(async (childId) => {
        const childDoc = await getDoc(doc(db, 'topics', childId));
        return childDoc.exists() ? { id: childDoc.id, ...childDoc.data() } : null;
      })
    );

    return {
      success: true,
      data: {
        parents: parents.filter(Boolean),
        children: children.filter(Boolean)
      }
    };
  } catch (error) {
    console.error("Error fetching relationship topics:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTopicsByCategory_fromClient(categories, parentId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    let q;
    if (parentId) {
      q = query(
        collection(db, 'topics'),
        where('parents', 'array-contains', parentId),
        where('topic_type', 'in', categories),
        orderBy('created_at', 'desc')
      );
    } else {
      q = query(
        collection(db, 'topics'),
        where('topic_type', 'in', categories),
        orderBy('created_at', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const topics = [];
    querySnapshot.forEach((doc) => {
      topics.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: topics };
  } catch (error) {
    console.error("Error fetching topics by category:", error);
    return { success: false, error: error.message };
  }
}
