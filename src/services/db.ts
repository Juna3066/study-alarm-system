import { RingtoneType } from '../types';

const DB_NAME = 'SchoolBellDB';
const STORE_NAME = 'audioFiles';
const DB_VERSION = 1;

// 封装一个带错误处理的数据库打开函数
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 1. 检查浏览器是否支持
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('Browser does not support IndexedDB'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        // 捕获打开过程中的错误（如隐私模式限制）
        console.warn("IndexedDB open error (likely permission denied):", event);
        reject(new Error("Database access denied"));
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    } catch (e) {
      // 捕获同步错误，防止直接崩溃
      reject(e);
    }
  });
};

export const saveAudioFile = async (id: string, file: Blob): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file, id);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve(); // 失败也 resolve，不报错
      } catch (err) {
        resolve();
      }
    });
  } catch (err) {
    console.warn("Database unavailable, skipping save.");
    return Promise.resolve();
  }
};

export const getAudioFile = async (id: string): Promise<Blob | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
      } catch (err) {
        resolve(undefined);
      }
    });
  } catch (err) {
    console.warn("Database unavailable, skipping get.");
    return Promise.resolve(undefined);
  }
};

export const deleteAudioFile = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  } catch (err) {
    console.warn("Database unavailable, skipping delete.");
    return Promise.resolve();
  }
};

// 补全之前缺失的 clearAudioFiles 函数
export const clearAudioFiles = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
  
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  } catch (err) {
    console.warn("Database unavailable, skipping clear.");
    return Promise.resolve();
  }
};