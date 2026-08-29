import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '../utils/firebase';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
  onTokenRefresh,
} from '../services/notificationService';
import { saveUserProfile, getUserProfile } from '../services/userService';

export interface User {
  name: string;
  phone: string;
  address?: string;
  houseNumber?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface FirebaseUser {
  uid: string;
  displayName: string | null;
  phoneNumber: string | null;
  email: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profile: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((fbUser: any) => {
      setFirebaseUser(fbUser ? { uid: fbUser.uid, displayName: fbUser.displayName, phoneNumber: fbUser.phoneNumber, email: fbUser.email, emailVerified: fbUser.emailVerified } : null);
      setAuthInitialized(true);
    });
    // Safety net: never block the splash forever if the auth listener is slow.
    const timeout = setTimeout(() => setAuthInitialized(true), 10000);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Register for push notifications on login if notifications were enabled
  useEffect(() => {
    if (firebaseUser) {
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED).then((enabled) => {
        if (enabled === 'true') {
          registerForPushNotifications(firebaseUser.uid).then((token) => {
            if (token) {
              onTokenRefresh(firebaseUser.uid);
            }
          });
        }
      });
    }
  }, [firebaseUser]);

  useEffect(() => {
    let cancelled = false;
    setProfileLoaded(false);

    if (!firebaseUser) {
      Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ADDRESS),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_PHONE),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_HOUSE),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_CITY),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_LAT),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE_LNG),
      ])
        .then(([storedUser, address, phone, house, city, lat, lng]) => {
          if (!cancelled && (storedUser || address || phone || lat)) {
            const parsed = storedUser ? (JSON.parse(storedUser) as User) : ({} as User);
            setUser({
              name: parsed.name || '',
              phone: phone || parsed.phone || '',
              address: address || parsed.address || '',
              houseNumber: house || parsed.houseNumber || '',
              city: city || parsed.city || '',
              latitude: lat ? parseFloat(lat) : parsed.latitude,
              longitude: lng ? parseFloat(lng) : parsed.longitude,
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setProfileLoaded(true);
        });
      return () => { cancelled = true; };
    }

    getUserProfile(firebaseUser.uid)
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          const merged: User = {
            name: profile.name || '',
            phone: profile.phone || '',
            address: profile.streetAddress || '',
            houseNumber: profile.houseNo || '',
            city: profile.city || '',
            latitude: profile.latitude,
            longitude: profile.longitude,
          };
          setUser(merged);
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged)).catch(() => {});
          if (profile.latitude !== undefined) {
            AsyncStorage.setItem(STORAGE_KEYS.PROFILE_LAT, String(profile.latitude)).catch(() => {});
          }
          if (profile.longitude !== undefined) {
            AsyncStorage.setItem(STORAGE_KEYS.PROFILE_LNG, String(profile.longitude)).catch(() => {});
          }
          return;
        }
        return Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ADDRESS),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_PHONE),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_HOUSE),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_CITY),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_LAT),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_LNG),
        ]).then(([storedUser, address, phone, house, city, lat, lng]) => {
          if (!cancelled && (storedUser || address || phone || lat)) {
            const parsed = storedUser ? (JSON.parse(storedUser) as User) : ({} as User);
            setUser({
              name: parsed.name || '',
              phone: phone || parsed.phone || '',
              address: address || parsed.address || '',
              houseNumber: house || parsed.houseNumber || '',
              city: city || parsed.city || '',
              latitude: lat ? parseFloat(lat) : parsed.latitude,
              longitude: lng ? parseFloat(lng) : parsed.longitude,
            });
          }
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => { cancelled = true; };
  }, [firebaseUser]);

  const login = useCallback(async (name: string, phone: string) => {
    const newUser: User = { name, phone };
    setUser(newUser);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    } catch {}
    const currentUser = auth().currentUser;
    if (currentUser) {
      await saveUserProfile(currentUser.uid, {
        name,
        phone,
        provider: 'phone',
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    const currentUid = auth().currentUser?.uid;
    setUser(null);
    try {
      await auth().signOut();
    } catch {}
    try {
      if (currentUid) {
        await unregisterPushNotifications(currentUid);
      }
    } catch {}
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_ADDRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_PHONE),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_HOUSE),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_CITY),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_LAT),
        AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_LNG),
      ]);
    } catch {}
  }, []);

  const saveProfile = useCallback(async (profile: Partial<User>) => {
    setUser((prev) => {
      const current = prev || { name: '', phone: '' };
      const updated = { ...current, ...profile };
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)).catch(() => {});
      if (profile.address !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ADDRESS, profile.address).catch(() => {});
      if (profile.phone !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_PHONE, profile.phone).catch(() => {});
      if (profile.houseNumber !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_HOUSE, profile.houseNumber).catch(() => {});
      if (profile.city !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_CITY, profile.city).catch(() => {});
      if (profile.latitude !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_LAT, String(profile.latitude)).catch(() => {});
      if (profile.longitude !== undefined)
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE_LNG, String(profile.longitude)).catch(() => {});
      if (firebaseUser) {
        saveUserProfile(firebaseUser.uid, {
          name: updated.name,
          phone: updated.phone,
          streetAddress: updated.address,
          houseNo: updated.houseNumber,
          city: updated.city,
          latitude: updated.latitude,
          longitude: updated.longitude,
        }).catch(() => {});
      }
      return updated;
    });
  }, [firebaseUser]);

  const isLoading = !authInitialized || !profileLoaded;

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, isAuthenticated: firebaseUser !== null || user !== null, isLoading, login, logout, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
