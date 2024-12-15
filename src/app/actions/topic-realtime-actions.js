'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';

export async function setupTopicChangeListener_fromClient(type, categories, parentId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  let q;

  if (type === 'relationships' && parentId) {
    q = query(
      collection(db, 'topics'),
      where('parents', 'array-contains', parentId),
      orderBy('created_at', 'desc')
    );
  } else if (type === 'category') {
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
  } else {
    throw new Error('Invalid topic query type');
  }

  // Return a function that sets up the listener
  return {
    success: true,
    query: JSON.stringify({
      type,
      categories,
      parentId,
      userId: currentUser.uid
    })
  };
}
