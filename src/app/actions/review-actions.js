'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

export async function getReviews_fromClient(restaurantId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: error.message };
  }
}

export async function addReview_fromClient(restaurantId, reviewData, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const reviewRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      restaurantId,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      createdAt: serverTimestamp()
    });

    return { 
      success: true, 
      data: { 
        id: reviewRef.id,
        ...reviewData,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous'
      }
    };
  } catch (error) {
    console.error("Error adding review:", error);
    return { success: false, error: error.message };
  }
}
