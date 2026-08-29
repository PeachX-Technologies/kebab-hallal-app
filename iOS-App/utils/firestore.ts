import { Platform } from 'react-native';

let firestoreInstance: any;
let dbInstance: any;

try {
  require('@react-native-firebase/app');
  firestoreInstance = require('@react-native-firebase/firestore').default;
  dbInstance = firestoreInstance();
} catch (e) {
  console.warn('RNFBAppModule not found. Using mock firestore.');
  const mockDoc = {
    id: 'mock',
    exists: false,
    data: () => null,
  };
  const mockSnapshot = {
    docs: [],
    forEach: () => {},
    size: 0,
  };
  const mockQuery = {
    where: () => mockQuery,
    orderBy: () => mockQuery,
    limit: () => mockQuery,
    get: async () => mockSnapshot,
    onSnapshot: () => () => {},
    count: () => ({
      get: async () => ({ data: () => ({ count: 0 }) }),
    }),
  };
  dbInstance = {
    collection: () => ({
      doc: () => ({
        get: async () => mockDoc,
        set: async () => {},
        update: async () => {},
        delete: async () => {},
        onSnapshot: () => () => {},
      }),
      add: async () => mockDoc,
      where: () => mockQuery,
      orderBy: () => mockQuery,
      limit: () => mockQuery,
      get: async () => mockSnapshot,
      onSnapshot: () => () => {},
    }),
    runTransaction: async (fn: any) => fn({
      get: async () => mockDoc,
      update: async () => {},
      set: async () => {},
    }),
  };
}

export type FirebaseFirestoreTypes = typeof firestoreInstance;
export const db = dbInstance;
export default dbInstance;
