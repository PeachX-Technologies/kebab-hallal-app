import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../../context/LocaleContext';
import { RESTAURANT_ADDRESS } from '../../constants';
import Theme from '../../theme';

const MapPinSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>`} width={18} height={18} />
);
const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`} width={18} height={18} />
);
const CalendarSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>`} width={14} height={14} />
);

function toTimeslotLabel(iso: string) {
  const d = new Date(iso);
  const h1 = d.getHours();
  const m1 = d.getMinutes();
  const end = new Date(d.getTime() + 30 * 60 * 1000);
  const h2 = end.getHours();
  const m2 = end.getMinutes();
  return `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')} - ${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
}

interface DeliveryInfoCardProps {
  address: string;
  deliveryTime?: number;
  updatedAt?: number;
  status?: string;
  scheduledAt?: string;
}

export default function DeliveryInfoCard({
  address,
  deliveryTime,
  updatedAt,
  status,
  scheduledAt,
}: DeliveryInfoCardProps) {
  const { t } = useLocale();
  const [remaining, setRemaining] = useState<string>('');
  const [expired, setExpired] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!deliveryTime || !updatedAt || scheduledAt) return;

    const targetTime = updatedAt + deliveryTime * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setRemaining('0m 0s');
        setExpired(true);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setRemaining(`${minutes}m ${seconds}s`);
      setExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deliveryTime, updatedAt, scheduledAt]);

  useEffect(() => {
    if (expired || !remaining) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [remaining, expired]);

  const isTerminal = status === 'delivered' || status === 'cancelled';
  const showCountdown = !isTerminal && !scheduledAt;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MapPinSvg />
        <Text style={styles.headerTitle}>{t('orderTracker.deliveryTitle')}</Text>
      </View>

      {scheduledAt && (
        <View style={styles.scheduledRow}>
          <CalendarSvg />
          <Text style={styles.scheduledText}>
            {t('orderTracker.scheduledFor')}: {toTimeslotLabel(scheduledAt)}
          </Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
          <MapPinSvg />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{t('orderTracker.deliveryAddress')}</Text>
          <Text style={styles.infoValue}>{address || RESTAURANT_ADDRESS}</Text>
        </View>
      </View>

      {showCountdown && (
        <View style={[styles.infoRow, styles.countdownRow]}>
          <View style={[styles.iconCircle, styles.clockCircle]}>
            <ClockSvg color={Theme.colors.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('orderTracker.estimatedDelivery')}</Text>
            {deliveryTime && remaining ? (
              <View>
                <Animated.Text style={[styles.countdownText, expired && { color: Theme.colors.error, opacity: pulseAnim }]}>
                  {expired ? t('orderTracker.delivered') : remaining}
                </Animated.Text>
                {!expired && (
                  <Text style={styles.originalEstimate}>
                    {t('orderTracker.originalEstimate', { time: deliveryTime })}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.infoValue}>{t('orderTracker.estimatedTimeValue')}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.text,
  },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Theme.spacing.sm,
  },
  scheduledText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  countdownRow: {
    backgroundColor: 'rgba(233,150,18,0.07)',
    borderColor: 'rgba(233,150,18,0.2)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249,18,26,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockCircle: {
    backgroundColor: 'rgba(233,150,18,0.15)',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.medium,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.text,
    marginTop: 1,
  },
  countdownText: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: Theme.colors.text,
    letterSpacing: 0.5,
  },
  originalEstimate: {
    fontSize: 10,
    color: Theme.colors.textDisabled,
    marginTop: 2,
  },
});
