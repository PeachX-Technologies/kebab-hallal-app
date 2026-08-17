import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { db } from '../utils/firestore';

let messagingInstance: any = null;
try {
  require('@react-native-firebase/app');
  messagingInstance = require('@react-native-firebase/messaging').default;
} catch {
  console.warn('RNFBMessaging not available. Push notifications disabled.');
}

const CHANNEL_ID = 'order-updates';
const CHANNEL_NAME = 'Order Updates';
const CHANNEL_DESC = 'Notifications about your order status';

export type NotificationTapCallback = (orderId?: string) => void;
let onNotificationTap: NotificationTapCallback | null = null;

export function setNotificationTapHandler(cb: NotificationTapCallback) {
  onNotificationTap = cb;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationsChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D32F2F',
      description: CHANNEL_DESC,
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function getFcmToken(): Promise<string | null> {
  if (!messagingInstance) return null;
  try {
    const authStatus = await messagingInstance().requestPermission();
    const enabled =
      authStatus === messagingInstance.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingInstance.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      return await messagingInstance().getToken();
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveFcmTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .doc(token)
      .set({
        token,
        platform: Platform.OS,
        createdAt: new Date(),
      });
  } catch (e) {
    console.warn('saveFcmTokenToFirestore error:', e);
  }
}

export async function removeFcmTokenFromFirestore(userId: string, token: string): Promise<void> {
  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .doc(token)
      .delete();
  } catch (e) {
    console.warn('removeFcmTokenFromFirestore error:', e);
  }
}

export async function removeAllUserTokens(userId: string): Promise<void> {
  try {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();
    const batch = db.batch();
    snapshot.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  } catch (e) {
    console.warn('removeAllUserTokens error:', e);
  }
}

export function onTokenRefresh(userId: string): () => void {
  if (!messagingInstance) return () => {};
  const unsubscribe = messagingInstance().onTokenRefresh(async (newToken: string) => {
    await saveFcmTokenToFirestore(userId, newToken);
  });
  return unsubscribe;
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!messagingInstance) return null;

  const permissionGranted = await requestNotificationPermissions();
  if (!permissionGranted) return null;

  const token = await getFcmToken();
  if (!token) return null;

  await saveFcmTokenToFirestore(userId, token);
  return token;
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  if (messagingInstance) {
    try {
      await messagingInstance().deleteToken();
    } catch {
      // non-fatal
    }
  }
  await removeAllUserTokens(userId);
}

export async function showLocalOrderNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

export function setupNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const orderId = (data as any)?.orderId;
    onNotificationTap?.(orderId);
  });
  return () => subscription.remove();
}
