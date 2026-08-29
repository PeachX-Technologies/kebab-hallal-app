import { useEffect } from 'react';
import { usePathname, useSegments } from 'expo-router';
import analytics from '../utils/analytics';

export function useScreenTracking() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    try {
      const screenName = pathname || '/';
      const screenClass = segments.join('/') || 'index';

      analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass,
      }).catch((err: any) => {
        console.warn('[Analytics] Failed to log screen view:', err);
      });
    } catch (e) {
      console.warn('[Analytics] Error tracking screen view:', e);
    }
  }, [pathname, segments]);
}

export default useScreenTracking;
