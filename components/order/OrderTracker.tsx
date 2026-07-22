import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../../context/LocaleContext';
import Theme from '../../theme';

type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

interface StepConfig {
  key: OrderStatus;
  icon: string;
  labelKey: string;
}

const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`} width={16} height={16} />
);
const HeartSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>`} width={16} height={16} />
);
const TruckSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`} width={16} height={16} />
);
const CheckSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`} width={16} height={16} />
);

const STEPS: StepConfig[] = [
  { key: 'pending', icon: 'clock', labelKey: 'orderTracker.received' },
  { key: 'preparing', icon: 'heart', labelKey: 'orderTracker.preparing' },
  { key: 'delivering', icon: 'truck', labelKey: 'orderTracker.delivering' },
  { key: 'delivered', icon: 'check', labelKey: 'orderTracker.delivered' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'preparing', 'delivering', 'delivered'];

function StepIcon({ icon, color }: { icon: string; color: string }) {
  switch (icon) {
    case 'clock': return <ClockSvg color={color} />;
    case 'heart': return <HeartSvg color={color} />;
    case 'truck': return <TruckSvg color={color} />;
    case 'check': return <CheckSvg color={color} />;
    default: return null;
  }
}

interface OrderTrackerProps {
  initialStatus?: OrderStatus;
}

export default function OrderTracker({ initialStatus = 'pending' }: OrderTrackerProps) {
  const { t } = useLocale();
  const currentIndex = Math.max(0, STATUS_ORDER.indexOf(initialStatus));

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;
        const isLast = index === STEPS.length - 1;

        const dotBg = isCompleted || isActive ? Theme.colors.primary : Theme.colors.surfaceElevated;
        const dotBorder = isCompleted || isActive ? Theme.colors.primary : Theme.colors.border;
        const iconColor = isCompleted ? '#fff' : isActive ? '#fff' : Theme.colors.textDisabled;
        const labelColor = isCompleted || isActive ? Theme.colors.text : Theme.colors.textDisabled;
        const labelWeight = isActive ? Theme.fontWeights.extraBold : isCompleted ? Theme.fontWeights.semiBold : Theme.fontWeights.regular;

        return (
          <View key={step.key} style={styles.stepRow}>
            {!isLast && (
              <View style={[styles.connector, { backgroundColor: isCompleted ? Theme.colors.primary : Theme.colors.border }]} />
            )}
            <View style={[styles.dot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
              {isCompleted ? (
                <CheckSvg color="#fff" />
              ) : (
                <StepIcon icon={step.icon} color={iconColor} />
              )}
            </View>
            {isActive && <View style={styles.ping} />}
            <View style={styles.labelWrap}>
              <Text style={[styles.label, { color: labelColor, fontWeight: labelWeight }]}>
                {t(step.labelKey)}
              </Text>
              {isActive && (
                <Text style={styles.statusHint}>
                  {currentIndex >= STATUS_ORDER.length - 1 ? t('orderTracker.completed') : t('orderTracker.inProgress')}
                </Text>
              )}
              {isCompleted && (
                <Text style={[styles.statusHint, styles.completedHint]}>{t('orderTracker.completed')}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
    paddingVertical: Theme.spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: Theme.spacing.lg,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: '100%',
    zIndex: 0,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: Theme.colors.surface,
  },
  ping: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    opacity: 0.25,
    zIndex: 1,
  },
  labelWrap: {
    marginLeft: Theme.spacing.md,
    paddingTop: 5,
    flex: 1,
  },
  label: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.text,
  },
  statusHint: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeights.medium,
    marginTop: 2,
  },
  completedHint: {
    color: Theme.colors.textDisabled,
  },
});
