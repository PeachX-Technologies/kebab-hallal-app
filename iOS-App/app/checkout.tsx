import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAppState, OrderMode } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import MapZonePicker from '../components/checkout/MapZonePicker';
import MenuImage from '../components/menu/MenuImage';
import PhoneField from '../components/PhoneField';
import CheckoutOtpModal from '../components/checkout/CheckoutOtpModal';
import { formatPrice } from '../utils/priceUtils';
import { getDeliveryCharge, ZoneInfo, detectZone } from '../utils/deliveryZones';
import { getMinZoneCosts } from '../services/orderService';
import { useMenu, MenuItem } from '../context/MenuContext';
import { generateTimeSlots, TimeSlot } from '../utils/scheduledOrder';
import { searchAddress } from '../utils/geocoding';
import Theme from '../theme';

type CheckoutStep = 'form' | 'summary';

const SectionCard = ({
  icon,
  title,
  trailing,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={16} color={Theme.colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {trailing}
    </View>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

export default function CheckoutScreen() {
  const { t } = useLocale();
  const { items, subtotal, recalculatePrices } = useCart();
  const { orderMode, setOrderMode, deliveryAvailable } = useAppState();
  const { user, isAuthenticated, saveProfile } = useAuth();
  const { categories, getItem } = useMenu();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  console.log('[Checkout] render, orderMode:', orderMode, 'items:', items.length, 'deliveryAvailable:', deliveryAvailable);

  const itemsMap = useMemo(() => {
    const map: Record<string, MenuItem> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        map[item.id] = item;
      }
    }
    return map;
  }, [categories]);

  const handleModeChange = useCallback((mode: OrderMode) => {
    console.log('[Checkout] handleModeChange called, mode:', mode, 'deliveryAvailable:', deliveryAvailable);
    if (mode === 'delivery' && !deliveryAvailable) return;
    setOrderMode(mode);
    try {
      recalculatePrices(itemsMap, mode);
      console.log('[Checkout] recalculatePrices done');
    } catch (e) {
      console.error('[Checkout] recalculatePrices error:', e);
    }
    if (mode === 'pickup') {
      setDetectedZone(null);
    }
  }, [setOrderMode, recalculatePrices, itemsMap, deliveryAvailable]);

  const isDelivery = orderMode === 'delivery';

  const [step, setStep] = useState<CheckoutStep>('form');

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(() => {
    if (user?.latitude && user?.longitude) {
      return { latitude: user.latitude, longitude: user.longitude };
    }
    return null;
  });
  const [detectedZone, setDetectedZone] = useState<ZoneInfo | null>(() => {
    if (user?.latitude && user?.longitude) {
      return detectZone(user.latitude, user.longitude);
    }
    return null;
  });

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber ?? '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [houseNumberError, setHouseNumberError] = useState('');

  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [houseNumberTouched, setHouseNumberTouched] = useState(false);

  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [minOrderCosts, setMinOrderCosts] = useState<Record<string, number>>({});

  const zoneNameToId: Record<string, string> = { Green: 'zone1', Blue: 'zone2', Yellow: 'zone3' };
  const minOrderAmount = isDelivery && detectedZone
    ? (minOrderCosts[zoneNameToId[detectedZone.name]] ?? 0)
    : 0;

  const deliveryFee = isDelivery ? getDeliveryCharge(detectedZone?.name) : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!deliveryAvailable && orderMode === 'delivery') {
      handleModeChange('pickup');
    }
  }, [deliveryAvailable, orderMode]);

  useEffect(() => {
    (async () => {
      try {
        const costs = await getMinZoneCosts();
        setMinOrderCosts(costs);
      } catch (e) {
        console.error('Failed to load min order costs:', e);
      }
    })();
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setAddress(user.address ?? '');
      setHouseNumber(user.houseNumber ?? '');
      if (user.latitude && user.longitude) {
        setDeliveryLocation({ latitude: user.latitude, longitude: user.longitude });
        const zone = detectZone(user.latitude, user.longitude);
        setDetectedZone(zone);
      }
    }
  }, [user]);

  // Fallback: If user has a saved address but no latitude/longitude yet, automatically geocode it
  useEffect(() => {
    if (user?.address && (!user.latitude || !user.longitude) && !deliveryLocation) {
      const fullQuery = user.houseNumber ? `${user.address} ${user.houseNumber}, Catania` : `${user.address}, Catania`;
      searchAddress(fullQuery).then((results) => {
        if (results.length > 0) {
          const first = results[0];
          const loc = { latitude: first.latitude, longitude: first.longitude };
          setDeliveryLocation(loc);
          const zone = detectZone(first.latitude, first.longitude);
          setDetectedZone(zone);
          saveProfile({ latitude: first.latitude, longitude: first.longitude });
        }
      }).catch(() => {});
    }
  }, [user?.address, user?.houseNumber, user?.latitude, user?.longitude]);

  useEffect(() => {
    if (nameTouched && !name.trim()) {
      setNameError(t('auth.login.nameRequired'));
    } else {
      setNameError('');
    }
  }, [name, nameTouched]);

  useEffect(() => {
    if (phoneTouched && !phone.trim()) {
      setPhoneError(t('auth.login.phoneRequired'));
    } else {
      setPhoneError('');
    }
  }, [phone, phoneTouched]);

  useEffect(() => {
    if (addressTouched && isDelivery && !address.trim()) {
      setAddressError(t('checkout.addressRequired'));
    } else {
      setAddressError('');
    }
  }, [address, addressTouched, isDelivery]);

  useEffect(() => {
    if (houseNumberTouched && isDelivery && !houseNumber.trim()) {
      setHouseNumberError(t('checkout.addressRequired'));
    } else {
      setHouseNumberError('');
    }
  }, [houseNumber, houseNumberTouched, isDelivery]);

  const isFormValid = useMemo(() => {
    const nameOk = name.trim().length > 0;
    const phoneOk = phone.trim().length > 0;
    if (isDelivery) {
      return nameOk && phoneOk && address.trim().length > 0 && houseNumber.trim().length > 0 && detectedZone !== null;
    }
    return nameOk && phoneOk;
  }, [name, phone, address, houseNumber, isDelivery, detectedZone]);

  const handleLocationChange = (lat: number, lng: number) => {
    setDeliveryLocation({ latitude: lat, longitude: lng });
    const zone = detectZone(lat, lng);
    setDetectedZone(zone);
  };

  const handleZoneDetected = (zone: ZoneInfo | null) => {
    setDetectedZone(zone);
  };

  const handleAddressSelected = (details: { address: string; houseNumber?: string; city?: string }) => {
    setAddress(details.address);
    setAddressTouched(true);
    if (details.houseNumber) {
      setHouseNumber(details.houseNumber);
    }
  };

  const handleMapTouchActive = useCallback((active: boolean) => {
    setScrollEnabled((current) => {
      const next = !active;
      return current === next ? current : next;
    });
  }, []);

  const saveUserProfile = () => {
    if (!name.trim() || !phone.trim()) return;
    saveProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      houseNumber: houseNumber.trim(),
      latitude: deliveryLocation?.latitude,
      longitude: deliveryLocation?.longitude,
    });
    setHasSavedOnce(true);
  };

  const handleReviewOrder = () => {
    if (isDelivery && minOrderAmount > 0 && subtotal < minOrderAmount) {
      Alert.alert(
        t('checkout.minimumOrder'),
        t('checkout.subtotalMinNotMet', {
          subtotal: subtotal.toFixed(2),
          minAmount: minOrderAmount.toFixed(2),
        })
      );
      return;
    }
    if (!isAuthenticated) {
      setShowOtpModal(true);
      return;
    }
    if (nameTouched && !nameError) saveUserProfile();
    setStep('summary');
  };

  const handleOtpVerified = () => {
    saveUserProfile();
    setShowOtpModal(false);
    setStep('summary');
  };

  const buildProductItems = useCallback(() => {
    return items.map((item) => ({
      id: item.itemId,
      itemId: item.itemId,
      itemName: t(`menu.items.${item.itemId}.name`),
      itemImage: item.itemImage || item.image || '',
      basePrice: isDelivery ? 0 : item.basePrice,
      baseDeliveryPrice: item.baseDeliveryPrice || 0,
      totalPrice: item.totalPrice,
      totalDeliveryPrice: item.totalDeliveryPrice ?? item.totalPrice,
      adPrice: item.adPrice || 0,
      selectedOptions: item.selectedOptions,
      quantity: item.quantity,
    }));
  }, [items, t, isDelivery]);

  const handleGoToPayment = () => {
    saveUserProfile();
    const products = buildProductItems();
    const params: Record<string, string> = {
      deliveryAddress: isDelivery ? `${address}, ${houseNumber}`.trim().replace(/,\s*$/, '') : '',
      deliveryNotes: deliveryNotes || '',
      totalAmount: String(total),
      subtotal: String(subtotal),
      deliveryFee: String(deliveryFee),
      products: JSON.stringify(products),
      name: name || '',
      phone: phone || '',
      ...(selectedSlot ? { scheduledAt: selectedSlot } : {}),
    };
    if (isDelivery) {
      params.address = address;
      params.houseNumber = houseNumber;
      params.city = 'Catania';
      if (deliveryLocation) {
        params.locationLat = String(deliveryLocation.latitude);
        params.locationLng = String(deliveryLocation.longitude);
      }
    }
    if (detectedZone) {
      params.zoneName = detectedZone.name;
      params.zoneId = detectedZone.id;
    }
    router.push({
      pathname: '/payment',
      params,
    });
  };

  // ---- Reusable presentational helpers (UI only, no logic changes) ----

  const renderOrderItem = (item: typeof items[0], isLast: boolean) => {
    const allDetails: string[] = [];
    for (const value of Object.values(item.selectedOptions ?? {})) {
      if (Array.isArray(value)) {
        for (const o of value) {
          if (o) allDetails.push(o.price ? `${o.name} (+${formatPrice(o.price)})` : o.name);
        }
      } else if (value) {
        allDetails.push(value.price ? `${value.name} (+${formatPrice(value.price)})` : value.name);
      }
    }
    return (
      <View key={item.id} style={[styles.orderRow, !isLast && styles.orderRowBorder]}>
        <View style={styles.thumbWrap}>
          <MenuImage
            filename={item.image}
            style={styles.thumb}
            resizeMode="cover"
            fallback={
              <Ionicons name="fast-food-outline" size={18} color={Theme.colors.secondaryDark} />
            }
          />
        </View>
        <View style={styles.orderRowInfo}>
          <View style={styles.orderNameRow}>
            <Text style={styles.orderItemName} numberOfLines={1}>
              {t(`menu.items.${item.itemId}.name`)}
            </Text>
            <Text style={styles.orderItemLineTotal}>{formatPrice(item.totalPrice)}</Text>
          </View>
          {allDetails.length > 0 && (
            <View style={styles.chipRow}>
              {allDetails.slice(0, 3).map((d, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>{d}</Text>
                </View>
              ))}
              {allDetails.length > 3 && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>+{allDetails.length - 3}</Text>
                </View>
              )}
            </View>
          )}
          {item.quantity > 1 && (
            <Text style={styles.orderQtyText}>
              {t('checkout.qty')} {item.quantity} · {formatPrice(Math.round(item.totalPrice / item.quantity))} {t('checkout.each')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderModeToggle = () => (
    <View style={styles.modeToggleRow}>
      {(['pickup', 'delivery'] as const).map((m) => {
        const active = orderMode === m;
        const isDelDisabled = m === 'delivery' && !deliveryAvailable;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.modeTogglePill, active && styles.modeTogglePillActive, isDelDisabled && styles.modeTogglePillDisabled]}
            onPress={() => {
              if (isDelDisabled) return;
              if (step === 'summary') setStep('form');
              handleModeChange(m);
            }}
            activeOpacity={isDelDisabled ? 1 : 0.85}
          >
            <Ionicons
              name={m === 'delivery' ? 'bicycle-outline' : 'storefront-outline'}
              size={16}
              color={isDelDisabled ? Theme.colors.textDisabled : active ? Theme.colors.textInverse : Theme.colors.primary}
              style={styles.modeToggleIcon}
            />
            <Text style={[styles.modeToggleText, active && styles.modeToggleTextActive, isDelDisabled && styles.modeToggleTextDisabled]}>
              {m === 'delivery' ? t('checkout.delivery') : t('checkout.pickup')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      <View style={styles.stepTrack}>
        <View style={[styles.stepSegment, styles.stepSegmentFilled]} />
        <View style={[styles.stepSegment, step === 'summary' && styles.stepSegmentFilled]} />
      </View>
      <Text style={styles.stepLabel}>
        {step === 'form'
          ? t('checkout.stepOf')
          : t('checkout.stepOf2')}
      </Text>
    </View>
  );

  const contentMaxWidth = isWide ? 640 : undefined;

  if (step === 'summary') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.sm }]}>
          <TouchableOpacity
            onPress={() => setStep('form')}
            style={styles.backBtn}
            accessibilityLabel={t('common.back')}
          >
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkout.orderSummary')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentInner, { maxWidth: contentMaxWidth }]}>
            {renderStepIndicator()}
            {renderModeToggle()}

            <SectionCard
              icon="receipt-outline"
              title={t('checkout.orderSummary')}
              trailing={
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{itemCount}</Text>
                </View>
              }
            >
              {items.map((item, i) => renderOrderItem(item, i === items.length - 1))}

              <View style={styles.totalsBlock}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('checkout.subtotal')}</Text>
                  <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
                </View>
                {isDelivery && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('checkout.deliveryFee')}</Text>
                    <Text style={styles.totalValue}>{formatPrice(deliveryFee)}</Text>
                  </View>
                )}
                {isDelivery && minOrderAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, !(subtotal >= minOrderAmount) && { color: Theme.colors.error }]}>
                      {t('checkout.minimumOrder')}
                    </Text>
                    <Text style={[styles.totalValue, !(subtotal >= minOrderAmount) && { color: Theme.colors.error }]}>
                      {formatPrice(minOrderAmount)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.grandTotalLabel}>{t('checkout.total')}</Text>
                  <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
                </View>
              </View>
            </SectionCard>

            {isDelivery && (
              <SectionCard icon="location-outline" title={t('checkout.deliveryAddress')}>
                <Text style={styles.plainValue}>
                  {address}
                  {houseNumber ? `, ${houseNumber}` : ''}
                </Text>
                {detectedZone && (
                  <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
                    <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                    <Text style={styles.statusBannerTextSuccess}>
                      {t('checkout.zoneDetected', { zone: detectedZone.name })} · {formatPrice(deliveryFee)}
                    </Text>
                  </View>
                )}
              </SectionCard>
            )}

            {/* ETA Card */}
            {isDelivery && !scheduledEnabled && (
            <View style={styles.etaCard}>
              <View style={styles.etaRow}>
                <View style={styles.etaIconWrap}>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.etaTextWrap}>
                  <Text style={styles.etaLabel}>{t('orderTracker.estimatedDelivery')}</Text>
                  <Text style={styles.etaValue}>{t('orderTracker.estimatedTimeValue')}</Text>
                </View>
              </View>
            </View>
            )}

            <SectionCard icon="person-outline" title={t('checkout.yourDetails')}>
              <View style={styles.detailRow}>
                <Ionicons name="person-circle-outline" size={18} color={Theme.colors.textSecondary} />
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>{t('checkout.yourName')}</Text>
                  <Text style={styles.detailValue}>{name}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color={Theme.colors.textSecondary} />
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>{t('checkout.yourPhone')}</Text>
                  <Text style={styles.detailValue}>{phone}</Text>
                </View>
              </View>
            </SectionCard>

            {deliveryNotes ? (
              <SectionCard icon="document-text-outline" title={t('checkout.deliveryNotes')}>
                <Text style={styles.plainValue}>{deliveryNotes}</Text>
              </SectionCard>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Theme.spacing.md + insets.bottom }]}>
          <Button
            title={t('checkout.confirmAndPay')}
            onPress={handleGoToPayment}
            accessibilityLabel={t('checkout.confirmAndPay')}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setStep('form')}
          >
            <Text style={styles.editButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.sm }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel={t('common.back')}
          >
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
        >
          <View style={[styles.contentInner, { maxWidth: contentMaxWidth }]}>
            {renderStepIndicator()}
            {renderModeToggle()}

            {/* Order summary */}
            <SectionCard
              icon="receipt-outline"
              title={t('checkout.orderSummary')}
              trailing={
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{itemCount}</Text>
                </View>
              }
            >
              {items.map((item, i) =>
                renderOrderItem(item, i === items.length - 1),
              )}
              <View style={styles.totalsBlock}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('checkout.subtotal')}</Text>
                  <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
                </View>
                {isDelivery && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('checkout.deliveryFee')}</Text>
                    <Text style={styles.totalValue}>{formatPrice(deliveryFee)}</Text>
                  </View>
                )}
                {isDelivery && minOrderAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, !(subtotal >= minOrderAmount) && { color: Theme.colors.error }]}>
                      {t('checkout.minimumOrder')}
                    </Text>
                    <Text style={[styles.totalValue, !(subtotal >= minOrderAmount) && { color: Theme.colors.error }]}>
                      {formatPrice(minOrderAmount)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.grandTotalLabel}>{t('checkout.total')}</Text>
                  <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
                </View>
              </View>
            </SectionCard>

            {/* Scheduled Order */}
            <SectionCard icon="calendar-outline" title={t('checkout.scheduled.title')}>
              <TouchableOpacity
                style={[styles.scheduledRow, scheduledEnabled && styles.scheduledRowActive]}
                onPress={() => {
                  setScheduledEnabled(!scheduledEnabled);
                  if (scheduledEnabled) {
                    setSelectedSlot(null);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, scheduledEnabled && styles.checkboxChecked]}>
                  {scheduledEnabled && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.scheduledTextWrap}>
                  <Text style={styles.scheduledLabel}>{t('checkout.scheduled.checkbox')}</Text>
                  <Text style={styles.scheduledDesc}>{t('checkout.scheduled.description')}</Text>
                </View>
              </TouchableOpacity>

              {scheduledEnabled && (
                <View style={styles.slotSection}>
                  {timeSlots.length === 0 ? (
                    <Text style={styles.noSlotsText}>{t('checkout.scheduled.noSlots')}</Text>
                  ) : (
                    (['lunch', 'dinner'] as const).map((period) => {
                      const periodSlots = timeSlots.filter((s) => s.period === period);
                      if (periodSlots.length === 0) return null;
                      return (
                        <View key={period} style={styles.periodGroup}>
                          <View style={styles.periodHeader}>
                            <Ionicons
                              name={period === 'lunch' ? 'sunny-outline' : 'moon-outline'}
                              size={16}
                              color={Theme.colors.primary}
                            />
                            <Text style={styles.periodTitle}>
                              {period === 'lunch' ? t('checkout.scheduled.lunch') : t('checkout.scheduled.dinner')}
                            </Text>
                          </View>
                          <View style={styles.slotGrid}>
                            {periodSlots.map((slot, i) => {
                              const isSelected = selectedSlot === slot.value;
                              return (
                                <TouchableOpacity
                                  key={i}
                                  style={[
                                    styles.slotPill,
                                    isSelected && styles.slotPillSelected,
                                    slot.disabled && styles.slotPillDisabled,
                                  ]}
                                  onPress={() => {
                                    if (slot.disabled) return;
                                    setSelectedSlot(slot.value);
                                  }}
                                  disabled={slot.disabled}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[
                                    styles.slotPillText,
                                    isSelected && styles.slotPillTextSelected,
                                    slot.disabled && styles.slotPillTextDisabled,
                                  ]}>
                                    {slot.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </SectionCard>

            {/* ETA Card */}
            {isDelivery && !scheduledEnabled && (
            <View style={styles.etaCard}>
              <View style={styles.etaRow}>
                <View style={styles.etaIconWrap}>
                  <Ionicons name="time-outline" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.etaTextWrap}>
                  <Text style={styles.etaLabel}>{t('orderTracker.estimatedDelivery')}</Text>
                  <Text style={styles.etaValue}>{t('orderTracker.estimatedTimeValue')}</Text>
                </View>
              </View>
            </View>
            )}

            {/* Delivery Map */}
            {isDelivery && (
              <SectionCard icon="location-outline" title={t('checkout.deliveryAddress')}>
                <View style={styles.mapHintRow}>
                  <Ionicons name="information-circle-outline" size={14} color={Theme.colors.textSecondary} />
                  <Text style={styles.mapHint}>{t('checkout.tapMapToSelect')}</Text>
                </View>
                <View style={styles.mapWrap}>
                  <MapZonePicker
                    onZoneDetected={handleZoneDetected}
                    selectedLocation={deliveryLocation}
                    onLocationChange={handleLocationChange}
                    onMapTouchActive={handleMapTouchActive}
                    onAddressSelected={handleAddressSelected}
                  />
                </View>
                {detectedZone && (
                  <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
                    <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                    <Text style={styles.statusBannerTextSuccess}>
                      {t('checkout.zoneDetected', { zone: detectedZone.name })} · {formatPrice(deliveryFee)}
                    </Text>
                  </View>
                )}
                {deliveryLocation && !detectedZone && (
                  <View style={[styles.statusBanner, styles.statusBannerError]}>
                    <Ionicons name="alert-circle-outline" size={18} color={Theme.colors.error} />
                    <View style={styles.statusBannerTextWrap}>
                      <Text style={styles.statusBannerTitleError}>
                        {t('checkout.outsideDeliveryZone')}
                      </Text>
                      <Text style={styles.statusBannerDescError}>
                        {t('checkout.outsideDeliveryZoneDesc')}
                      </Text>
                    </View>
                  </View>
                )}
              </SectionCard>
            )}
            {/* Contact Info */}
            <SectionCard icon="person-outline" title={t('settings.profile')}>
              <Input
                label={t('checkout.yourName')}
                value={name}
                onChangeText={(v) => { setName(v); setNameTouched(true); }}
                placeholder={t('checkout.yourNamePlaceholder')}
                error={nameError}
                accessibilityLabel={t('checkout.yourName')}
              />
              <View style={styles.fieldSpacer} />
              <Text style={styles.fieldLabel}>{t('checkout.yourPhone')}</Text>
              <PhoneField
                value={phone}
                onChangeFormatted={(p) => { setPhone(p); setPhoneTouched(true); }}
                hasError={!!phoneError}
                onClearError={() => setPhoneError('')}
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </SectionCard>

            {isDelivery && (
              <SectionCard icon="location-outline" title={t('checkout.deliveryAddress')}>
                <Input
                  label={t('checkout.deliveryAddress')}
                  value={address}
                  onChangeText={(v) => { setAddress(v); setAddressTouched(true); }}
                  placeholder={t('checkout.deliveryAddressPlaceholder')}
                  error={addressError}
                  accessibilityLabel={t('checkout.deliveryAddress')}
                />
                <View style={styles.fieldSpacer} />
                <Input
                  label={t('checkout.houseNumber')}
                  value={houseNumber}
                  onChangeText={(v) => { setHouseNumber(v); setHouseNumberTouched(true); }}
                  placeholder={t('checkout.houseNumberPlaceholder')}
                  error={houseNumberError}
                  accessibilityLabel={t('checkout.houseNumber')}
                />
              </SectionCard>
            )}

            <SectionCard icon="document-text-outline" title={t('checkout.deliveryNotes')}>
              <Input
                label=""
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                placeholder={t('checkout.deliveryNotesPlaceholder')}
                multiline
                numberOfLines={2}
                accessibilityLabel={t('checkout.deliveryNotes')}
              />
            </SectionCard>



            {!hasSavedOnce && (
              <View style={styles.saveHintRow}>
                <Ionicons name="information-circle-outline" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.saveHint}>{t('checkout.saveInfoHint')}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Theme.spacing.md + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.confirmButton, !isFormValid && styles.confirmButtonDisabled]}
            onPress={handleReviewOrder}
            disabled={!isFormValid}
            accessibilityLabel={t('checkout.reviewOrder')}
          >
            <View style={styles.confirmButtonContent}>
              <Text style={styles.confirmButtonText}>{t('checkout.reviewOrder')}</Text>
              <Text style={styles.confirmButtonTotal}>{formatPrice(total)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CheckoutOtpModal
        visible={showOtpModal}
        name={name}
        phone={phone}
        onVerified={handleOtpVerified}
        onClose={() => setShowOtpModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },

  // --- Header & footer (unchanged) ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomLeftRadius: Theme.borderRadii.xl,
    borderBottomRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.sm,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.textInverse,
  },
  footer: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: Theme.spacing.sm,
  },
  confirmButton: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.full,
    ...Theme.shadows.flame,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  confirmButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  confirmButtonTotal: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    opacity: 0.85,
  },
  editButton: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  editButtonText: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },

  // --- Scroll content / responsive wrapper ---
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  contentInner: {
    width: '100%',
    alignSelf: 'center',
    gap: Theme.spacing.md,
  },

  // --- Step indicator ---
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.border,
  },
  stepSegmentFilled: {
    backgroundColor: Theme.colors.primary,
  },
  stepLabel: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // --- Mode toggle ---
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 4,
  },
  modeTogglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.full,
  },
  modeTogglePillActive: {
    backgroundColor: Theme.colors.primary,
  },
  modeToggleIcon: {
    marginRight: 6,
  },
  modeToggleText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.primary,
    flexShrink: 1,
  },
  modeToggleTextActive: {
    color: Theme.colors.textInverse,
  },
  modeTogglePillDisabled: {
    opacity: 0.45,
  },
  modeToggleTextDisabled: {
    color: Theme.colors.textDisabled,
  },

  // --- Generic section card ---
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceElevated,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flexShrink: 1,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadii.md,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    flexShrink: 1,
  },
  cardBody: {
    padding: Theme.spacing.md,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  // --- Order item row ---
  orderRow: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    alignItems: 'flex-start',
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadii.md,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderRowInfo: {
    flex: 1,
    gap: 4,
  },
  orderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  orderItemName: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  orderItemLineTotal: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.full,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  orderQtyText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
  },
  moreItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Theme.spacing.xs,
  },
  moreItems: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // --- Totals ---
  totalsBlock: {
    marginTop: Theme.spacing.xs,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.xs,
  },
  totalLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.text,
  },
  subtotalLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.textSecondary,
  },
  subtotalValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.primary,
  },
  grandTotalLabel: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  grandTotalValue: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.primary,
  },

  // --- Map ---
  mapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  mapHint: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    flexShrink: 1,
  },
  mapWrap: {
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  // --- Status banners (zone detected / outside zone) ---
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.md,
  },
  statusBannerSuccess: {
    backgroundColor: Theme.colors.successLight,
  },
  statusBannerError: {
    backgroundColor: Theme.colors.errorLight,
  },
  statusBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusBannerTextSuccess: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.success,
  },
  statusBannerTitleError: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.error,
  },
  statusBannerDescError: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.error,
  },

  // --- Contact / detail rows (summary step) ---
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  detailTextWrap: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.sm,
  },
  plainValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
  },

  // --- Form fields ---
  fieldSpacer: {
    height: Theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  errorText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
  etaCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  etaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  etaTextWrap: {
    gap: 2,
  },
  etaLabel: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  etaValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  saveHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveHint: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  scheduledRowActive: {},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  scheduledTextWrap: {
    flex: 1,
    gap: 2,
  },
  scheduledLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  scheduledDesc: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  slotPill: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  slotPillSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight || 'rgba(249,18,26,0.08)',
  },
  slotPillDisabled: {
    opacity: 0.35,
  },
  slotPillText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
  },
  slotPillTextSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  slotPillTextDisabled: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textDisabled,
  },
  noSlotsText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  slotSection: {
    gap: Theme.spacing.md,
  },
  periodGroup: {
    gap: Theme.spacing.xs,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Theme.spacing.xs,
  },
  periodTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
