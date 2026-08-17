import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { SPLASH_DURATION_MS } from '../constants';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { useAuth } from '../context/AuthContext';
import { preloadMenuImages } from '../lib/menuImages';

const splashModule = require('../assets/splash/splash-screen.png');

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetsError, setAssetsError] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Asset.loadAsync(splashModule);
        await preloadMenuImages();
        if (!cancelled) setAssetsReady(true);
      } catch {
        if (!cancelled) setAssetsError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (assetsReady || assetsError) {
      SplashScreen.hideAsync();
    }
  }, [assetsReady, assetsError]);

  useEffect(() => {
    if (assetsError) {
      console.warn('[Index] asset preload failed, proceeding without preloaded images');
    }
  }, [assetsError]);

  useEffect(() => {
    if (!(assetsReady || assetsError) || isLoading) return;

    const timer = setTimeout(async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);

        if (!onboardingDone) {
          router.replace('/onboarding');
        } else if (!isAuthenticated) {
          router.replace('/login');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/onboarding');
      }
    }, assetsReady ? SPLASH_DURATION_MS : 0);

    return () => clearTimeout(timer);
  }, [assetsReady, assetsError, isLoading, isAuthenticated]);

  return (
    <Image source={splashModule} style={styles.image} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
