import '../utils/firebase';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';

import { LocaleProvider } from '../context/LocaleContext';
import { ThemeProvider } from '../context/ThemeContext';
import { MenuProvider } from '../context/MenuContext';
import { AuthProvider } from '../context/AuthContext';
import { AppStateProvider } from '../context/AppStateContext';
import { CartProvider } from '../context/CartContext';
import { OrderProvider } from '../context/OrderContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../utils/stripe';
import RestaurantClosedModal from '../components/overlays/RestaurantClosedModal';
import {
  setupNotificationsChannel,
  setNotificationTapHandler,
  setupNotificationResponseListener,
} from '../services/notificationService';
import { router } from 'expo-router';
import DeliveryUnavailableModal from '../components/overlays/DeliveryUnavailableModal';
import NoInternetOverlay from '../components/overlays/NoInternetOverlay';
import ErrorBoundary from '../components/ErrorBoundary';
import useScreenTracking from '../hooks/useScreenTracking';

import { useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

const FONT_TIMEOUT_MS = 5000;

function StatusBarUpdater() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />;
}

function AnalyticsTracker() {
  useScreenTracking();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[RootLayout] mounted');
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn('[RootLayout] font loading error:', fontError);
    }
    if (fontsLoaded) {
      console.log('[RootLayout] fonts loaded');
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontTimedOut) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontTimedOut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded && !fontError && mountedRef.current) {
        console.warn('[RootLayout] font loading timed out, rendering without custom fonts');
        setFontTimedOut(true);
      }
    }, FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  const requestPermissions = useCallback(async () => {
    console.log('[RootLayout] requesting permissions...');
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('[RootLayout] location permission:', locStatus);
    } catch (e) {
      console.warn('Failed to request location permission:', e);
    }

    try {
      const notifResult = await Notifications.requestPermissionsAsync();
      console.log('[RootLayout] notification permission:', notifResult.status);
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
    }
    if (mountedRef.current) setPermissionsRequested(true);
  }, []);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    setupNotificationsChannel();
    setNotificationTapHandler((orderId) => {
      router.replace('/(tabs)/orders');
    });
    const cleanup = setupNotificationResponseListener();
    return cleanup;
  }, []);

  const ready = fontsLoaded || fontError || fontTimedOut;
  if (!ready) {
    return null;
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <ThemeProvider>
          <MenuProvider>
            <AuthProvider>
              <AppStateProvider>
                <CartProvider>
                  <OrderProvider>
                    <StripeProvider
                      publishableKey={STRIPE_PUBLISHABLE_KEY}
                      merchantIdentifier="merchant.com.mh.kebabhallal"
                      urlScheme="kebab-hallal"
                    >
                      <StatusBarUpdater />
                      <AnalyticsTracker />
                      <View style={{ flex: 1 }}>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="onboarding" />
                          <Stack.Screen name="login" />
                          <Stack.Screen name="otp" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen name="checkout" />
                          <Stack.Screen name="payment" />
                          <Stack.Screen name="confirmation" />
                          <Stack.Screen name="failure" />
                          <Stack.Screen name="order/[orderId]" />
                          <Stack.Screen name="privacy" />
                          <Stack.Screen name="terms" />
                        </Stack>
                        <RestaurantClosedModal />
                        <DeliveryUnavailableModal />
                        <NoInternetOverlay />
                      </View>
                    </StripeProvider>
                  </OrderProvider>
                </CartProvider>
              </AppStateProvider>
            </AuthProvider>
          </MenuProvider>
          </ThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
