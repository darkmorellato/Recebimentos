import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
import { Expense } from '../utils/types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const initAuth = async (): Promise<void> => {
  await signInAnonymously(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getExpensesRef = () => {
  return collection(db, 'recebimentos-payjoy-crefaz', 'data', 'team_expenses_v2');
};

export const subscribeExpenses = (
  callback: (expenses: Expense[]) => void,
  onError?: (error: FirestoreError) => void
) => {
  const ref = getExpensesRef();
  const q = query(ref, orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Expense[];
      callback(expenses);
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      onError?.(error);
    }
  );
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<string> => {
  const ref = getExpensesRef();
  const docRef = await addDoc(ref, {
    ...expense,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateExpense = async (id: string, data: Partial<Expense>): Promise<void> => {
  const ref = getExpensesRef();
  await updateDoc(doc(ref, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const batchImport = async (items: Omit<Expense, 'id'>[]): Promise<number> => {
  const ref = getExpensesRef();
  let batch = writeBatch(db);
  let count = 0;

  for (const item of items) {
    const docRef = doc(ref);
    batch.set(docRef, { ...item, createdAt: serverTimestamp() });
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();
  return count;
};
