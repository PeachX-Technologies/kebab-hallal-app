import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useLocale, Locale } from '../../context/LocaleContext';
import { useAppState, OrderMode } from '../../context/AppStateContext';
import { useCart } from '../../context/CartContext';
import { useMenu } from '../../context/MenuContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../../services/notificationService';
import { saveUserProfile } from '../../services/userService';
import { searchAddress } from '../../utils/geocoding';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Theme from '../../theme';
import { useTheme } from '../../context/ThemeContext';

/* ─── Icons ──────────────────────────────────────────────────── */
const BagSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/></svg>`} width={16} height={16} />
);
const TruckSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`} width={16} height={16} />
);
const CheckSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`} width={16} height={16} />
);
const BellSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>`} width={18} height={18} />
);
const UserSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`} width={18} height={18} />
);
const GlobeSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253"/></svg>`} width={18} height={18} />
);
const LogoutSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${Theme.colors.error}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/></svg>`} width={18} height={18} />
);
const ShieldSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>`} width={18} height={18} />
);
const FileTextSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>`} width={18} height={18} />
);
const SaveSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a3.75 3.75 0 0 0-.1.83V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"/></svg>`} width={18} height={18} />
);
const MoonSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>`} width={18} height={18} />
);

/* ─── Section card wrapper (website icon-in-circle style) ──────── */
function SectionCard({
  icon,
  label,
  children,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  colors?: typeof Theme.colors;
}) {
  const c = colors ?? Theme.colors;
  return (
    <View style={[card.wrap, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[card.header, { borderBottomColor: c.border }]}>
        <View style={[card.iconWrap, { backgroundColor: c.primary + '12' }]}>{icon}</View>
        <Text style={[card.label, { color: c.text }]}>{label}</Text>
      </View>
      <View style={card.body}>{children}</View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    letterSpacing: 0.3,
  },
  body: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
});

/* ─── Segmented control (pill-style) ──────────────────────────── */
function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  renderOption,
  colors,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  renderOption: (v: T, active: boolean) => React.ReactNode;
  colors?: typeof Theme.colors;
}) {
  const c = colors ?? Theme.colors;
  return (
    <View style={[seg.wrap, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[seg.btn, active && { backgroundColor: c.primary }]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            {renderOption(opt, active)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: Theme.borderRadii.lg,
    padding: 3,
    borderWidth: 1,
    gap: 3,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
  },
});

/* ─── Main screen ─────────────────────────────────────────────── */
export default function SettingsScreen() {
  const { t, locale, setLocale } = useLocale();
  const { user, firebaseUser, isAuthenticated, saveProfile, logout, deleteAccount } = useAuth();
  const { orderMode, setOrderMode, deliveryAvailable } = useAppState();
  const { recalculatePrices } = useCart();
  const { categories } = useMenu();
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme, colors } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!deliveryAvailable && orderMode === 'delivery') {
      setOrderMode('pickup');
      const itemMap: Record<string, any> = {};
      for (const cat of categories) {
        for (const item of cat.items) itemMap[item.id] = item;
      }
      recalculatePrices(itemMap, 'pickup');
    }
  }, [deliveryAvailable, orderMode, categories]);

  const origName = useRef(user?.name ?? '');
  const origAddress = useRef('');
  const origHouse = useRef(user?.houseNumber ?? '');
  const origNotif = useRef(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ADDRESS),
      AsyncStorage.getItem(STORAGE_KEYS.PROFILE_HOUSE),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
    ]).then(([addr, house, notif]) => {
      const a = addr ?? '';
      const h = house ?? user?.houseNumber ?? '';
      const n = notif !== 'false';
      setAddress(a);
      setHouseNumber(h);
      setNotificationsEnabled(n);
      origAddress.current = a;
      origHouse.current = h;
      origNotif.current = n;
    });
  }, []);

  useEffect(() => {
    const changed =
      name !== origName.current ||
      address !== origAddress.current ||
      houseNumber !== origHouse.current ||
      notificationsEnabled !== origNotif.current;
    setIsDirty(changed);
    if (changed) setSaved(false);
  }, [name, address, houseNumber, notificationsEnabled]);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ADDRESS, address);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_HOUSE, houseNumber);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(notificationsEnabled));
      if (user) {
        if (notificationsEnabled) {
          if (firebaseUser) await registerForPushNotifications(firebaseUser.uid);
        } else {
          if (firebaseUser) await unregisterPushNotifications(firebaseUser.uid);
        }
        let lat = user.latitude;
        let lng = user.longitude;
        if (address.trim() && (address !== origAddress.current || houseNumber !== origHouse.current || !lat)) {
          try {
            const query = houseNumber.trim() ? `${address.trim()} ${houseNumber.trim()}, Catania` : `${address.trim()}, Catania`;
            const results = await searchAddress(query);
            if (results.length > 0) {
              lat = results[0].latitude;
              lng = results[0].longitude;
            }
          } catch {}
        }
        saveProfile({ name, address, houseNumber, phone: user.phone, latitude: lat, longitude: lng });
      }
      origName.current = name;
      origAddress.current = address;
      origHouse.current = houseNumber;
      origNotif.current = notificationsEnabled;
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-fatal
    }
  };

  const handleLocaleChange = (newLocale: Locale) => setLocale(newLocale);

  const handleOrderModeChange = (mode: OrderMode) => {
    if (mode === 'delivery' && !deliveryAvailable) return;
    setOrderMode(mode);
    const itemMap: Record<string, any> = {};
    for (const cat of categories) {
      for (const item of cat.items) itemMap[item.id] = item;
    }
    recalculatePrices(itemMap, mode);
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    await deleteAccount();
    router.replace('/login');
  };

  const segText = (text: string, active: boolean) => (
    <Text style={{ fontSize: Theme.fontSizes.sm, fontWeight: active ? Theme.fontWeights.bold : Theme.fontWeights.medium, fontFamily: active ? Theme.fontFamily.bold : Theme.fontFamily.medium, color: active ? '#fff' : colors.textSecondary }}>
      {text}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ paddingTop: insets.top + Theme.spacing.sm }}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
          </View>
        </View>
        <View style={[styles.headerAccent, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Language ── */}
        <SectionCard icon={<GlobeSvg color={colors.primary} />} label={t('settings.language')} colors={colors}>
          <SegmentControl
            options={['it', 'en'] as Locale[]}
            value={locale}
            onChange={handleLocaleChange}
            renderOption={(lang, active) => (
              <>
                <Text style={{ fontSize: 15 }}>{lang === 'it' ? '🇮🇹' : '🇬🇧'}</Text>
                <Text style={[styles.segLabel, { color: colors.textSecondary }, active && styles.segLabelActive]}>
                  {lang === 'it' ? t('settings.languageIt') : t('settings.languageEn')}
                </Text>
              </>
            )}
            colors={colors}
          />
        </SectionCard>

        {/* ── Order mode ── */}
        <SectionCard icon={<BagSvg color={colors.primary} />} label={t('settings.orderMode')} colors={colors}>
          <SegmentControl
            options={['pickup', 'delivery'] as OrderMode[]}
            value={orderMode as OrderMode}
            onChange={handleOrderModeChange}
            renderOption={(mode, active) => {
              const isDelDisabled = mode === 'delivery' && !deliveryAvailable;
              return (
                <>
                  {mode === 'pickup'
                    ? <BagSvg color={active ? '#fff' : (isDelDisabled ? colors.textDisabled : colors.textSecondary)} />
                    : <TruckSvg color={active ? '#fff' : (isDelDisabled ? colors.textDisabled : colors.textSecondary)} />
                  }
                  <Text style={[styles.segLabel, { color: colors.textSecondary }, active && styles.segLabelActive, isDelDisabled && styles.segLabelDisabled]}>
                    {t(`orderMode.${mode}`)}
                  </Text>
                </>
              );
            }}
            colors={colors}
          />
        </SectionCard>

        {/* ── Profile ── */}
        {isAuthenticated ? (
          <SectionCard icon={<UserSvg color={colors.primary} />} label={t('settings.profile')} colors={colors}>
            <Input
              label={t('settings.name')}
              value={name}
              onChangeText={setName}
              placeholder={t('settings.namePlaceholder')}
              accessibilityLabel={t('settings.name')}
            />
            <Input
              label={t('settings.deliveryAddress')}
              value={address}
              onChangeText={setAddress}
              placeholder={t('settings.deliveryAddressPlaceholder')}
              accessibilityLabel={t('settings.deliveryAddress')}
            />
            <Input
              label={t('settings.houseNumber')}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder={t('settings.houseNumberPlaceholder')}
              accessibilityLabel={t('settings.houseNumber')}
            />
          </SectionCard>
        ) : (
          <SectionCard icon={<UserSvg color={colors.primary} />} label={t('settings.profile')} colors={colors}>
            <View style={styles.loginPromptWrap}>
              <Text style={[styles.loginPromptText, { color: colors.textSecondary }]}>{t('settings.loginPrompt')}</Text>
              <TouchableOpacity
                style={[styles.loginPromptButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
              >
                <UserSvg color="#fff" />
                <Text style={[styles.loginPromptButtonText, { color: colors.textInverse }]}>{t('settings.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>
        )}

        {/* ── Notifications ── */}
        <SectionCard icon={<BellSvg color={colors.primary} />} label={t('settings.notifications')} colors={colors}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.notifications')}</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{t('settings.notificationsDesc')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel={t('settings.notifications')}
            />
          </View>
        </SectionCard>

        {/* ── Dark Mode ── */}
        <SectionCard icon={<MoonSvg color={colors.primary} />} label={t('settings.appearance')} colors={colors}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{t('settings.darkModeDesc')}</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel={t('settings.darkMode')}
            />
          </View>
        </SectionCard>

        {/* ── Legal ── */}
        <SectionCard icon={<ShieldSvg color={colors.primary} />} label={t('settings.legal')} colors={colors}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => router.push('/privacy')}
            activeOpacity={0.7}
            accessibilityLabel={t('settings.privacy')}
            accessibilityRole="button"
          >
            <View style={[styles.legalIconWrap, { backgroundColor: colors.primary + '10' }]}>
              <ShieldSvg color={colors.primary} />
            </View>
            <Text style={[styles.legalRowText, { color: colors.text }]}>{t('settings.privacy')}</Text>
            <Text style={[styles.legalChevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
          <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => router.push('/terms')}
            activeOpacity={0.7}
            accessibilityLabel={t('settings.terms')}
            accessibilityRole="button"
          >
            <View style={[styles.legalIconWrap, { backgroundColor: colors.primary + '10' }]}>
              <FileTextSvg color={colors.primary} />
            </View>
            <Text style={[styles.legalRowText, { color: colors.text }]}>{t('settings.terms')}</Text>
            <Text style={[styles.legalChevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Save button (only when dirty) ── */}
        {(isDirty || saved) && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: saved ? colors.success : colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.88}
            accessibilityLabel={t('common.save')}
            accessibilityRole="button"
          >
            {saved ? (
              <CheckSvg color="#fff" />
            ) : (
              <SaveSvg />
            )}
            <Text style={styles.saveButtonText}>
              {saved ? t('settings.saved') : t('common.save')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Sign in / Logout ── */}
        {isAuthenticated ? (
          <>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.errorLight, borderColor: 'rgba(211,47,47,0.3)' }]}
              onPress={handleLogout}
              activeOpacity={0.85}
              accessibilityLabel={t('settings.logout')}
              accessibilityRole="button"
            >
              <LogoutSvg />
              <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
            </TouchableOpacity>

            <ConfirmDialog
              visible={showLogoutModal}
              title={t('settings.logout')}
              message={t('settings.logoutConfirm')}
              confirmLabel={t('settings.logout')}
              cancelLabel={t('common.cancel')}
              onConfirm={confirmLogout}
              onCancel={() => setShowLogoutModal(false)}
              destructive
            />

            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: 'rgba(211,47,47,0.2)' }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.85}
              accessibilityLabel={t('settings.deleteAccount')}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteText, { color: colors.error }]}>{t('settings.deleteAccount')}</Text>
            </TouchableOpacity>

            <ConfirmDialog
              visible={showDeleteModal}
              title={t('settings.deleteAccount')}
              message={t('settings.deleteAccountConfirm')}
              confirmLabel={t('settings.deleteAccount')}
              cancelLabel={t('common.cancel')}
              onConfirm={confirmDeleteAccount}
              onCancel={() => setShowDeleteModal(false)}
              destructive
            />
          </>
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
            accessibilityLabel={t('settings.signIn')}
            accessibilityRole="button"
          >
            <UserSvg color={colors.primary} />
            <Text style={[styles.loginButtonText, { color: colors.primary }]}>{t('settings.signIn')}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    letterSpacing: -0.3,
  },
  headerAccent: {
    height: 3,
    width: 60,
    borderTopRightRadius: Theme.borderRadii.full,
    borderBottomRightRadius: Theme.borderRadii.full,
  },

  // ── Scroll ───────────────────────────────────────────────
  scrollContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },

  // ── Segment labels ───────────────────────────────────────
  segLabel: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    textAlign: 'center',
    flexShrink: 1,
  },
  segLabelActive: {
    color: '#fff',
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  segLabelDisabled: {
    opacity: 0.45,
  },

  // ── Setting rows (notifications, dark mode) ──────────────
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  settingDesc: {
    fontSize: Theme.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Save ─────────────────────────────────────────────────
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    height: 52,
    borderRadius: Theme.borderRadii.lg,
    ...Theme.shadows.flame,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    letterSpacing: 0.2,
  },

  // ── Logout ───────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    height: 52,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },

  // ── Delete Account ──────────────────────────────────────
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadii.lg,
    height: 48,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },

  // ── Login prompt (unauthenticated) ──
  loginPromptWrap: {
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  loginPromptText: {
    fontSize: Theme.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    height: 48,
    paddingHorizontal: Theme.spacing.xl,
    minWidth: 200,
  },
  loginPromptButtonText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  // ── Legal ───────────────────────────────────────────────
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
  },
  legalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalRowText: {
    flex: 1,
    fontSize: Theme.fontSizes.sm + 1,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  legalChevron: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  legalDivider: {
    height: 1,
    marginVertical: Theme.spacing.xs,
  },

  // ── Sign in button (when logged out) ──
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    height: 52,
    borderWidth: 1.5,
  },
  loginButtonText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
});
