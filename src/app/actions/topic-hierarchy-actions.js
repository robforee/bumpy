'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

export async function fetchTopicWithChildren_fromClient(topicId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    // Fetch the topic
    const docRef = doc(db, 'topics', topicId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Topic not found' };
    }

    const topic = { id: docSnap.id, ...docSnap.data(), children: [] };

    // Fetch children
    const q = query(
      collection(db, 'topics'),
      where('parents', 'array-contains', topicId),
      where('topic_type', '==', 'topic')
    );

    const childrenSnap = await getDocs(q);
    const childrenPromises = [];

    childrenSnap.forEach((childDoc) => {
      const childData = { id: childDoc.id, ...childDoc.data(), children: [] };
      childrenPromises.push(
        fetchTopicWithChildren_fromClient(childDoc.id, idToken)
          .then(result => result.success ? result.data : null)
      );
    });

    const children = (await Promise.all(childrenPromises))
      .filter(child => child !== null);

    topic.children = children;

    return { success: true, data: topic };
  } catch (error) {
    console.error("Error fetching topic hierarchy:", error);
    return { success: false, error: error.message };
  }
}
