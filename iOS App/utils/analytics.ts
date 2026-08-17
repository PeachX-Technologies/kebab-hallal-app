import { Platform } from 'react-native';

let analyticsModule: any;

try {
  // Try importing the native firebase analytics module
  const firebaseAnalytics = require('@react-native-firebase/analytics');
  analyticsModule = firebaseAnalytics.default;
} catch (e) {
  console.warn('[Analytics] Native module @react-native-firebase/analytics not found. Analytics will be mocked.');
  
  // Return a mock function that provides stubbed analytics methods
  analyticsModule = () => ({
    logScreenView: async (params: { screen_name: string; screen_class?: string }) => {
      console.log(`[Analytics Mock] logScreenView:`, params);
    },
    logEvent: async (name: string, params?: object) => {
      console.log(`[Analytics Mock] logEvent: ${name}`, params);
    },
    setUserId: async (id: string | null) => {
      console.log(`[Analytics Mock] setUserId: ${id}`);
    },
    setUserProperties: async (properties: object) => {
      console.log(`[Analytics Mock] setUserProperties:`, properties);
    },
    setAnalyticsCollectionEnabled: async (enabled: boolean) => {
      console.log(`[Analytics Mock] setAnalyticsCollectionEnabled: ${enabled}`);
    },
  });
}

export const analytics = analyticsModule;
export default analyticsModule;
