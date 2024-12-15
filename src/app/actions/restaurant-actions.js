'use server'

import { getAuthenticatedAppForUser } from '@/src/lib/firebase/serverApp';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';

export async function getRestaurants_fromClient(idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(restaurantsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const restaurants = [];
    querySnapshot.forEach((doc) => {
      restaurants.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: restaurants };
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return { success: false, error: error.message };
  }
}

export async function getRestaurant_fromClient(restaurantId, idToken) {
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser(idToken);
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const db = getFirestore(firebaseServerApp);
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Restaurant not found' };
    }

    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return { success: false, error: error.message };
  }
}

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
