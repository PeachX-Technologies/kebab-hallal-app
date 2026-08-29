import { useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { useLocale, Locale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import Theme from '../theme';

interface Slide {
  id: string;
  emoji?: string;
  titleKey?: string;
  descKey?: string;
  isLanguagePicker?: boolean;
}

const SLIDES: Slide[] = [
  { id: 'lang', isLanguagePicker: true },
  {
    id: '1',
    emoji: '🥙',
    titleKey: 'onboarding.slide1.title',
    descKey: 'onboarding.slide1.description',
  },
  {
    id: '2',
    emoji: '📱',
    titleKey: 'onboarding.slide2.title',
    descKey: 'onboarding.slide2.description',
  },
  {
    id: '3',
    emoji: '⚡',
    titleKey: 'onboarding.slide3.title',
    descKey: 'onboarding.slide3.description',
  },
];

const LANGUAGES: { locale: Locale; flag: string; name: string; native: string }[] = [
  { locale: 'it', flag: '🇮🇹', name: 'Italian', native: 'Lingua locale' },
  { locale: 'en', flag: '🇬🇧', name: 'English', native: 'International' },
];

async function completeOnboarding() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
  } catch {
    // non-fatal
  }
  router.replace('/(tabs)');
}

// Language card component
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function LanguageCard({
  item,
  isSelected,
  onPress,
  activeBg,
}: {
  item: typeof LANGUAGES[0];
  isSelected: boolean;
  onPress: () => void;
  activeBg: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${item.name} — ${item.native}`}
    >
      <Animated.View
        style={[
          styles.langCard,
          isSelected && styles.langCardActive,
          isSelected && { backgroundColor: activeBg },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Flag tile */}
        <View style={styles.flagTile}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
        </View>

        {/* Language info */}
        <View style={styles.langInfo}>
          <Text style={[styles.langName, isSelected && styles.langNameActive]}>
            {item.name}
          </Text>
          <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
            {item.native}
          </Text>
        </View>

        {/* Selection indicator */}
        <View
          style={[
            styles.radioOuter,
            isSelected ? styles.radioOuterActive : styles.radioOuterInactive,
          ]}
        >
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const { t, locale, setLocale } = useLocale();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeBg = hexToRgba(colors.primary, 0.06);
  const emojiSize = Math.min(80, Math.floor(Math.min(width, height) * 0.22));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button — hidden on language picker slide */}
      {!isFirst && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={completeOnboarding}
          accessibilityLabel={t('onboarding.skip')}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => {
          // ─── Language Picker Slide ───────────────────────────────────────
          if (item.isLanguagePicker) {
            return (
              <View style={[styles.slide, { width }]}>
                {/* Globe icon */}
                <View style={styles.globeIconWrap}>
                  <Text style={styles.globeEmoji}>🌍</Text>
                </View>


                {/* Heading */}
                <Text style={styles.languageTitle}>
                  {t('onboarding.chooseLanguage')}
                </Text>

                {/* Subtitle */}
                <Text style={styles.languageSubtitle}>
                  {t('onboarding.chooseLanguageDesc')}
                </Text>

                {/* Language cards */}
                <View
                  style={styles.langList}
                  accessibilityRole="radiogroup"
                  accessible
                >
                  {LANGUAGES.map((lang) => (
                    <LanguageCard
                      key={lang.locale}
                      item={lang}
                      isSelected={locale === lang.locale}
                      onPress={() => setLocale(lang.locale)}
                      activeBg={activeBg}
                    />
                  ))}
                </View>

                {/* Continue button — advances to next slide */}
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={goNext}
                  accessibilityLabel={t('onboarding.continue') ?? 'Continue'}
                  accessibilityRole="button"
                >
                  <Text style={styles.continueButtonText}>
                    {t('onboarding.continue') ?? 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // ─── Regular Info Slide ──────────────────────────────────────────
          return (
            <View style={[styles.slide, { width }]}>
              <Text style={[styles.slideEmoji, { fontSize: emojiSize }]}>{item.emoji}</Text>
              <Text style={styles.title}>{t(item.titleKey!)}</Text>
              <Text style={styles.description}>{t(item.descKey!)}</Text>
            </View>
          );
        }}
      />

      {/* Dot indicators — hidden on language picker */}
      {!isFirst && (
        <View style={styles.dotsContainer}>
          {SLIDES.slice(1).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex - 1 && styles.dotActive,
              ]}
              accessibilityLabel={`Slide ${i + 1} of ${SLIDES.length - 1}`}
            />
          ))}
        </View>
      )}

      {/* Bottom button */}
      <View style={styles.buttonContainer}>
        {isFirst ? (
          // Spacer — language picker has its own Continue button inside the slide
          <View style={{ height: 52 }} />
        ) : isLast ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={completeOnboarding}
            accessibilityLabel={t('onboarding.getStarted')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {t('onboarding.getStarted')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goNext}
            accessibilityLabel={t('onboarding.next')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {t('onboarding.next')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },

  // ── Skip button ──
  skipButton: {
    alignSelf: 'flex-end',
    padding: Theme.spacing.md,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  skipText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },

  // ── Slides ──
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },

  // ── Info slide ──
  slideEmoji: {
    fontSize: 80,
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSizes.xxl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  description: {
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Language picker slide ──
  globeIconWrap: {
    width: 72,
    height: 72,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.full,
  },
  globeEmoji: {
    fontSize: 34,
  },
  languageTitle: {
    fontSize: Theme.fontSizes.xxl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  languageSubtitle: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.xl,
  },

  // ── Language list ──
  langList: {
    width: '100%',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },

  // ── Language card ──
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.lg,
  },
  langCardActive: {
    borderColor: Theme.colors.primary,
  },

  // ── Flag tile ──
  flagTile: {
    width: 44,
    height: 44,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.md,
  },
  flagEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },

  // ── Language text ──
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold ?? '600',
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  langNameActive: {
    color: Theme.colors.text,
  },
  langNative: {
    fontSize: Theme.fontSizes.xs ?? 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  langNativeActive: {
    color: Theme.colors.textSecondary,
    opacity: 0.7,
  },

  // ── Radio indicator ──
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  radioOuterInactive: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },

  // ── Continue button (inside language slide) ──
  continueButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Theme.spacing.md,
    minHeight: 52,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.lg,
    ...Theme.shadows.flame,
  },
  continueButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  // ── Dot indicators ──
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.border,
  },
  dotActive: {
    backgroundColor: Theme.colors.primary,
    width: 24,
  },

  // ── Primary button (info slides) ──
  buttonContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
  },
  primaryButton: {
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.lg,
    ...Theme.shadows.flame,
  },
  primaryButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
