import { db } from '../utils/firestore';

export interface UserProfile {
  name: string;
  phone: string;
  phoneNumber?: string;
  email?: string;
  houseNo?: string;
  streetAddress?: string;
  city?: string;
  provider?: string;
  createdAt?: string;
}

export async function saveUserProfile(
  uid: string,
  profile: Partial<UserProfile>,
): Promise<void> {
  try {
    await db.collection('users').doc(uid).set(profile, { merge: true });
  } catch (e) {
    console.warn('saveUserProfile error:', e);
  }
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (snap.exists) {
      const data = snap.data() as UserProfile & { phoneNumber?: string };
      if (!data.phone && data.phoneNumber) {
        data.phone = data.phoneNumber;
      }
      return data;
    }
    return null;
  } catch (e) {
    console.warn('getUserProfile error:', e);
    return null;
  }
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (err: any) => void,
) {
  return db.collection('users').doc(uid).onSnapshot(
    (snap: any) => {
      if (snap.exists) {
        onChange(snap.data() as UserProfile);
      } else {
        onChange(null);
      }
    },
    (err: any) => {
      console.warn('subscribeUserProfile error:', err);
      onError?.(err);
    },
  );
}
