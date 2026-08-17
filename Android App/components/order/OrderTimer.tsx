import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../../context/LocaleContext';
import { Order } from '../../context/OrderContext';
import Theme from '../../theme';

interface TimerState {
  isActive: boolean;
  message: string;
  timeRemaining: { minutes: number; seconds: number } | null;
}

interface OrderTimerProps {
  order: Order;
}

const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`}
    width={15}
    height={15}
  />
);

const CheckCircleSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`}
    width={15}
    height={15}
  />
);

export default function OrderTimer({ order }: OrderTimerProps) {
  const { t } = useLocale();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    message: '',
    timeRemaining: null,
  });

  // Pulse animation for active timer
  useEffect(() => {
    if (!timerState.isActive) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [timerState.isActive]);

  useEffect(() => {
    if (order.status === 'delivered' || order.status === 'cancelled' || !order.deliveryTime || !order.updatedAt) return;
    const deliveryEndTime = order.updatedAt + order.deliveryTime * 60 * 1000;
    const timerInterval = setInterval(() => {
      const remaining = deliveryEndTime - Date.now();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        setTimerState({
          isActive: false,
          message: order.orderMode === 'delivery' ? t('orders.remainingTime') : t('orders.orderReady'),
          timeRemaining: null,
        });
        return;
      }
      const rawMinutes = Math.floor(remaining / 60000);
      const rawSeconds = Math.floor((remaining % 60000) / 1000);
      if (rawMinutes < 5) {
        setTimerState({
          isActive: true,
          message: '',
          timeRemaining: { minutes: 4, seconds: 55 },
        });
        return;
      }
      setTimerState({
        isActive: true,
        message: '',
        timeRemaining: {
          minutes: rawMinutes,
          seconds: rawSeconds,
        },
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [order]);

  if (order.status === 'delivered' || order.status === 'cancelled') return null;

  // Expired / ready state
  if (timerState.message) {
    return (
      <View style={[styles.container, styles.containerReady]}>
        <CheckCircleSvg color={Theme.colors.success} />
        <Text style={styles.messageReady}>{timerState.message}</Text>
      </View>
    );
  }

  // Active countdown
  if (timerState.isActive && timerState.timeRemaining) {
    const { minutes, seconds } = timerState.timeRemaining;
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');
    return (
      <View style={styles.container}>
        <View style={styles.timerInner}>
          <View style={styles.timerLeft}>
            <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
            <ClockSvg color="#1565C0" />
            <Text style={styles.etaLabel}>{t('orders.eta')}</Text>
          </View>
          <View style={styles.countdown}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeDigit}>{minStr}</Text>
              <Text style={styles.timeUnit}>min</Text>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeDigit}>{secStr}</Text>
              <Text style={styles.timeUnit}>sec</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(33,150,243,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(33,150,243,0.2)',
  },
  containerReady: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: 'rgba(46,125,50,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  messageReady: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.success,
  },

  // Active timer
  timerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2196F3',
  },
  etaLabel: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.semiBold,
    color: '#1565C0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(33,150,243,0.12)',
    borderRadius: Theme.borderRadii.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 48,
  },
  timeDigit: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#1565C0',
    letterSpacing: 1,
    lineHeight: 22,
  },
  timeUnit: {
    fontSize: 9,
    fontWeight: Theme.fontWeights.bold,
    color: '#1565C0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  timeSep: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#1565C0',
    marginBottom: 8,
  },
});