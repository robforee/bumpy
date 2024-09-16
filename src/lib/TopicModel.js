// /app/lib/TopicModel.js
import { db } from './firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

class TopicModel {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  static async getTopic(id) {
    const docRef = doc(db, 'topics', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return new TopicModel(id, docSnap.data());
    } else {
      throw new Error('Topic not found');
    }
  }

  static async addTopic(parentId, data) {
    const newTopicRef = doc(db, 'topics');
    const newTopic = {
      owner: data.owner,
      sharing: data.sharing || 'private',
      version: 1,
      seq: Date.now(),
      topic_type: data.topic_type || 'Topic',
      output_type: data.output_type,
      versions: [],
      title: data.title,
      subtitle: data.subtitle,
      text: data.text,
      topic_doc_uri: data.topic_doc_uri,
      parents: [parentId],
      children: [],
    };
    await setDoc(newTopicRef, newTopic);
    
    // Update parent's children array
    const parentRef = doc(db, 'topics', parentId);
    await updateDoc(parentRef, {
      children: arrayUnion(newTopicRef.id)
    });

    return new TopicModel(newTopicRef.id, newTopic);
  }

  async changeParent(newParentId) {
    const oldParentId = this.data.parents[0];
    
    // Remove from old parent
    const oldParentRef = doc(db, 'topics', oldParentId);
    await updateDoc(oldParentRef, {
      children: arrayRemove(this.id)
    });

    // Add to new parent
    const newParentRef = doc(db, 'topics', newParentId);
    await updateDoc(newParentRef, {
      children: arrayUnion(this.id)
    });

    // Update this topic's parent
    const topicRef = doc(db, 'topics', this.id);
    await updateDoc(topicRef, {
      parents: [newParentId]
    });

    this.data.parents = [newParentId];
  }

  async updatePhoto(newPhotoUrl) {
    const topicRef = doc(db, 'topics', this.id);
    await updateDoc(topicRef, {
      photo_url: newPhotoUrl,
      version: this.data.version + 1,
      versions: arrayUnion({
        version: this.data.version,
        timestamp: Date.now(),
        changes: { photo_url: this.data.photo_url }
      })
    });
    this.data.photo_url = newPhotoUrl;
    this.data.version += 1;
  }

  // Stub for running prompts
  async runPrompts(options) {
    console.log('Running prompts with options:', options);
    // This would typically call a cloud function
  }

  async addComment(commentData) {
    return TopicModel.addTopic(this.id, { ...commentData, topic_type: 'Comment' });
  }

  async addPrompt(promptData) {
    return TopicModel.addTopic(this.id, { ...promptData, topic_type: 'Prompt' });
  }
}

export default TopicModel;
