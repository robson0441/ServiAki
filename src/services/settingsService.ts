import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export interface AppSettings {
  supportWhatsapp: string;
  subscriptionPrice: number;
  updatedAt?: any;
}

const SETTINGS_DOC_ID = 'general';
const SETTINGS_PATH = 'settings/general';

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      // Default settings if not exists
      const defaultSettings: AppSettings = {
        supportWhatsapp: '81992316899', // Using user provided number as default
        subscriptionPrice: 29.90,
      };
      return defaultSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SETTINGS_PATH);
    throw error; // Backup throw for TS
  }
}

export async function updateAppSettings(settings: AppSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_PATH);
  }
}
