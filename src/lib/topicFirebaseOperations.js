// src/lib/topicFirebaseOperations.js
import { doc, updateDoc, collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { db_viaClient } from './firebase/clientApp';


export const updateTopicTitle = async (topicId, newTitle) => {
  try {
    const topicRef = doc(db_viaClient, 'topics', topicId);
    await updateDoc(topicRef, {
      title: newTitle,
      updated_at: new Date()
    });
    console.log(`Title updated successfully for topic ${topicId}`);
  } catch (error) {
    console.error("Error updating topic title:", error);
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};

// omit parentId get them all
// fetchTopicsByCategory('comment', parentId)
export async function fetchTopicsByCategory(categories, parentId) {
  const topicsRef = collection(db_viaClient, 'topics');
  let q = query(topicsRef, orderBy('updated_at', 'desc'));
  
  // Apply category filter if categories are provided
  if (categories && categories.length > 0) {
    q = query(q, where('topic_type', 'in', categories));
  }
  
  // Apply parent filter if parentId is provided
  if (parentId) {
    q = query(q, where('parents', 'array-contains', parentId));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    updated_at: doc.data().updated_at?.toDate()
  }));
}

export async function fetchRelationshipTopics(topicId) {
    //console.log('Fetching relationship topics for topicId:', topicId);
    const topicsRef = collection(db_viaClient, 'topics');
    let relationshipTopics = [];
  
    try {
      // Fetch the current topic to get its parent
      const currentTopicQuery = query(topicsRef, 
        where('__name__', '==', topicId)
      );
      const currentTopicSnapshot = await getDocs(currentTopicQuery);
      const currentTopic = currentTopicSnapshot.docs[0]?.data();
      //console.log('Current topic:', currentTopic);
  
      if (currentTopic) {
        // Fetch parents (topics that have our ID in their children array)
        // PARENTS
        // PARENTS
        // PARENTS
        // const parentsQuery = query(topicsRef,
        //   where('children', 'array-contains', topicId)
        // );
        // const parentsSnapshot = await getDocs(parentsQuery);
        // relationshipTopics = relationshipTopics.concat(parentsSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data(),
        //   relationship: 'parent'
        // })));
  
        // // Fetch children (topics that have our ID in their parents array)
        // // , where('topic_type', '==', 'topic')
        // // CHILDREN
        // // CHILDREN
        // // CHILDREN
        // // CHILDREN
        // // CHILDREN
        // const childrenQuery = query(topicsRef,
        //   where('parents', 'array-contains', topicId)
        // );
        // const childrenSnapshot = await getDocs(childrenQuery);
        // relationshipTopics = relationshipTopics.concat(childrenSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data(),
        //   relationship: 'child'
        // })));
  
        // SIBLINGS
        // SIBLINGS
        // SIBLINGS
        // Fetch siblings (topics that have the same parent as our topic)
        if (currentTopic.parents && currentTopic.parents.length > 0) {
          const siblingsQuery = query(topicsRef,
            where('parents', 'array-contains', currentTopic.parents[0]),
            where('topic_type', '==', 'topic')
          );
          const siblingsSnapshot = await getDocs(siblingsQuery);
          relationshipTopics = relationshipTopics.concat(siblingsSnapshot.docs
            .filter(doc => doc.id !== topicId) // Exclude the current topic
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              relationship: 'sibling'
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching relationship topics:", error);
      throw error;
    }
  
    //console.log('Total relationship topics found:', relationshipTopics.length);
    return relationshipTopics;
  }


export const onTopicsChange = (type, categories, parentId, userId, onUpdate, onError) => {
  const topicsRef = collection(db_viaClient, 'topics');
  let q;

  if (type === 'relationships') {
    q = query(
      topicsRef, 
      where('parents', 'array-contains', parentId),
      where('ownerId', '==', userId)
    );
  } else if (type === 'category') {
    q = query(
      topicsRef,
      where('parents', 'array-contains', parentId),
      where('topic_type', 'in', categories),
      where('ownerId', '==', userId)
    );
  } else {
    onError(new Error('Invalid type for onTopicsChange'));
    return () => {};
  }

  return onSnapshot(q, 
    (snapshot) => {
      const updatedTopics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onUpdate(updatedTopics);
    },
    (error) => {
      console.error("Firestore real-time update error:", error);
      onError(error);
    }
  );
};
