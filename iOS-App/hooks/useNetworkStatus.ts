import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns the current network connectivity status.
 * Subscribes to NetInfo events and updates reactively.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}

export default useNetworkStatus;
