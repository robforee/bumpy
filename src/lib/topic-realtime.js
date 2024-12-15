import { db_viaClient } from './firebase/clientApp';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';

export function setupRealtimeListener(queryParams, onUpdate, onError) {
  const { type, categories, parentId, userId } = queryParams;
  
  try {
    let q;
    if (type === 'relationships' && parentId) {
      q = query(
        collection(db_viaClient, 'topics'),
        where('parents', 'array-contains', parentId),
        orderBy('created_at', 'desc')
      );
    } else if (type === 'category') {
      if (parentId) {
        q = query(
          collection(db_viaClient, 'topics'),
          where('parents', 'array-contains', parentId),
          where('topic_type', 'in', categories),
          orderBy('created_at', 'desc')
        );
      } else {
        q = query(
          collection(db_viaClient, 'topics'),
          where('topic_type', 'in', categories),
          orderBy('created_at', 'desc')
        );
      }
    } else {
      throw new Error('Invalid topic query type');
    }

    return onSnapshot(q, 
      (snapshot) => {
        const topics = [];
        snapshot.forEach((doc) => {
          topics.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(topics);
      },
      (error) => {
        console.error("Error in real-time updates:", error);
        onError(error);
      }
    );
  } catch (error) {
    console.error("Error setting up real-time listener:", error);
    onError(error);
    return () => {}; // Return empty cleanup function
  }
}
