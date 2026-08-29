import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../../context/LocaleContext';
import { RESTAURANT_PHONE } from '../../constants';
import Theme from '../../theme';

const TruckSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`} width={18} height={18} />
);
const StarSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.secondary}"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>`} width={14} height={14} />
);
const PhoneSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>`} width={14} height={14} />
);

interface DriverInfoProps {
  name?: string;
  vehicle?: string;
  rating?: number;
  estimatedArrival?: string;
}

export default function DriverInfo({
  name,
  vehicle,
  rating = 4.9,
  estimatedArrival,
}: DriverInfoProps) {
  const { t } = useLocale();

  const initial = (name || t('orderTracker.driverName')).charAt(0).toUpperCase();

  const handleCall = () => {
    Linking.openURL(`tel:${RESTAURANT_PHONE}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TruckSvg />
        <Text style={styles.headerTitle}>{t('orderTracker.driverTitle')}</Text>
      </View>

      <View style={styles.driverRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{name || t('orderTracker.driverName')}</Text>
          <View style={styles.driverMeta}>
            <View style={styles.metaItem}>
              <TruckSvg />
              <Text style={styles.metaText}>{vehicle || t('orderTracker.driverVehicle')}</Text>
            </View>
            <View style={styles.metaItem}>
              <StarSvg />
              <Text style={styles.metaText}>{rating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrivingBadge}>
          <View style={styles.arrivingDot} />
          <Text style={styles.arrivingText}>{t('orderTracker.arriving')}</Text>
        </View>
      </View>

      {estimatedArrival && (
        <TouchableOpacity style={styles.contactRow} onPress={handleCall} activeOpacity={0.7}>
          <Text style={styles.estimatedText}>
            {t('orderTracker.estimatedArrival', { time: estimatedArrival })}
          </Text>
          <View style={styles.phoneBtn}>
            <PhoneSvg />
            <Text style={styles.phoneBtnText}>{t('orderTracker.callRestaurant')}</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.whatsappRow} onPress={handleCall} activeOpacity={0.7}>
        <Text style={styles.whatsappText}>{t('orderTracker.whatsappUs')}</Text>
      </TouchableOpacity>
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
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.success,
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.text,
  },
  driverMeta: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
  },
  arrivingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(46,125,50,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.2)',
  },
  arrivingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  arrivingText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.success,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  estimatedText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  phoneBtnText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.primary,
  },
  whatsappRow: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  whatsappText: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    color: '#fff',
  },
});
