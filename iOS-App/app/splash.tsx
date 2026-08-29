import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SPLASH_DURATION_MS } from '../constants';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { useAuth } from '../context/AuthContext';
import Theme from '../theme';

const logo = require('../assets/icons/adaptive-icon.png');

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isLoading) return;

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
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 240,
    marginBottom: Theme.spacing.lg,
  },
});
