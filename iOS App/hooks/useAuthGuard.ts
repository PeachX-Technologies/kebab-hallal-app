import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inPublicRoute =
      segments[0] === 'login' ||
      segments[0] === 'otp' ||
      segments[0] === 'onboarding' ||
      segments[0] === 'splash';

    if (isAuthenticated && inPublicRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);
}

export default useAuthGuard;
