// ./src/app/api/topics/route.js
import { db_viaClient } from '@/src/lib/firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function getTopicsByParentAndType(db, parentId, type = 'all') {
  const topicsRef = collection(db, 'topics');
  let q = query(topicsRef, where('parents', 'array-contains', parentId));
  
  if (type !== 'all') {
    q = query(q, where('topic_type', '==', type));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTopicsByChildAndType(db, childId, type = 'prompts') {
  const topicsRef = collection(db, 'topics');
  let q = query(topicsRef, where('children', 'array-contains', childId));
  
  if (type !== 'all') {
    q = query(q, where('topic_type', '==', type));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}