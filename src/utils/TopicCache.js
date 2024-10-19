// src/utils/TopicCache.js
import { openDB } from 'idb';

const DB_NAME = 'TopicCache';
const STORE_NAME = 'topics';
const DB_VERSION = 1;

class TopicCache {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lastAccessed', 'lastAccessed');
      },
    });
  }

  async get(id) {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const topic = await store.get(id);
    if (topic) {
      topic.lastAccessed = Date.now();
      await this.put(topic);
    }
    return topic;
  }

  async put(topic) {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    topic.lastAccessed = Date.now();
    await store.put(topic);
  }

  async delete(id) {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.delete(id);
  }

  async clear() {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.clear();
  }

  async getAllKeys() {
    await this.init();
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return store.getAllKeys();
  }

  async manageStorage(maxItems = 1000) {
    const keys = await this.getAllKeys();
    if (keys.length > maxItems) {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('lastAccessed');
      const oldestItems = await index.getAll(null, maxItems - keys.length);
      for (let item of oldestItems) {
        await store.delete(item.id);
      }
    }
  }
}

export const topicCache = new TopicCache();
