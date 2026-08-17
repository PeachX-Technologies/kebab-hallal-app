import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { useCallback, useState } from 'react';
import { Question, NormalizedOption } from '../../context/MenuContext';
import { useLocale } from '../../context/LocaleContext';
import { formatExtraPrice } from '../../utils/priceUtils';
import Theme from '../../theme';

const HORIZONTAL_CARD_WIDTH = 120;
const DEBUG_DRINK_SELECTION = typeof __DEV__ !== 'undefined' && __DEV__;

interface QuestionRendererProps {
  question: Question;
  selectedValues: string | string[] | undefined;
  onChange: (questionId: string, value: string | string[]) => void;
  hasError?: boolean;
  optionImages?: Record<string, number | { uri: string }>;
  variant?: 'list' | 'cards' | 'horizontal';
}

const CheckSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`}
    width={10}
    height={10}
  />
);

const AlertSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.error}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>`}
    width={13}
    height={13}
  />
);

export default function QuestionRenderer({
  question,
  selectedValues,
  onChange,
  hasError,
  optionImages,
  variant = 'list',
}: QuestionRendererProps) {
  const { t } = useLocale();
  const isSingle = question.type === 'single_choice';
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const onImageError = useCallback((optName: string) => {
    setFailedImages((prev) => {
      if (prev.has(optName)) return prev;
      const next = new Set(prev);
      next.add(optName);
      return next;
    });
  }, []);

  const handleSingleSelect = (optionName: string) => {
    if (DEBUG_DRINK_SELECTION && variant === 'horizontal') {
      console.log('[DrinkSelector] single select', {
        questionId: question.id,
        previousValue: selectedValues,
        nextValue: optionName,
      });
    }
    onChange(question.id, optionName);
  };

  const handleMultiSelect = (optionName: string) => {
    const current = Array.isArray(selectedValues) ? selectedValues : [];
    if (current.includes(optionName)) {
      onChange(question.id, current.filter((v) => v !== optionName));
    } else {
      const max = question.max_selections ?? Infinity;
      if (current.length < max) onChange(question.id, [...current, optionName]);
    }
  };

  const handleSelect = (optName: string) => {
    if (DEBUG_DRINK_SELECTION && variant === 'horizontal') {
      console.log('[DrinkSelector] press', {
        questionId: question.id,
        optionName: optName,
        selectedValues,
        isSingle,
      });
    }
    isSingle ? handleSingleSelect(optName) : handleMultiSelect(optName);
  };

  const isSelected = (optName: string) =>
    isSingle
      ? selectedValues === optName
      : Array.isArray(selectedValues) && selectedValues.includes(optName);

  return (
    <View style={[styles.container, hasError && styles.containerError]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.questionText}>
          {t(`menu.questions.${question.id}.text`)}
        </Text>
        <View style={styles.badges}>
          {question.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>{t('itemDetail.requiredQuestion')}</Text>
            </View>
          )}
          {!isSingle && question.max_selections && (
            <View style={styles.maxBadge}>
              <Text style={styles.maxText}>{t('itemDetail.maxSelections', { max: question.max_selections })}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Error ── */}
      {hasError && (
        <View style={styles.errorRow}>
          <AlertSvg />
          <Text style={styles.errorText}>Please select an option</Text>
        </View>
      )}

      {/* ── Options ── */}
      {variant === 'horizontal' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {question.options.map((opt: NormalizedOption) => {
            const sel = isSelected(opt.name);
            if (DEBUG_DRINK_SELECTION) {
              console.log('[DrinkSelector] render option', {
                questionId: question.id,
                optionName: opt.name,
                selectedValues,
                selected: sel,
                hasImage: !!optionImages?.[opt.name],
              });
            }
            return (
              <Pressable
                key={`${question.id}-${opt.name}`}
                style={({ pressed }) => [
                  styles.horizontalCard,
                  sel && styles.horizontalCardSelected,
                  pressed && styles.horizontalCardPressed,
                ]}
                onPress={() => handleSelect(opt.name)}
                accessibilityRole={isSingle ? 'radio' : 'checkbox'}
                accessibilityState={{ checked: sel }}
              >
                <View style={styles.horizontalCardImageWrap} collapsable={false}>
                  {optionImages?.[opt.name] && !failedImages.has(opt.name) ? (
                    <Image
                      source={optionImages[opt.name]}
                      style={styles.horizontalCardImage}
                      contentFit="contain"
                      onError={() => onImageError(opt.name)}
                    />
                  ) : (
                    <View style={styles.horizontalCardPlaceholder}>
                      <Text style={styles.horizontalCardEmoji}>🥤</Text>
                    </View>
                  )}
                  {sel && <View pointerEvents="none" style={styles.horizontalCardImageTint} />}
                  {opt.price > 0 && (
                    <View style={styles.horizontalCardPriceBadge}>
                      <Text style={styles.horizontalCardPriceBadgeText}>{formatExtraPrice(opt.price)}</Text>
                    </View>
                  )}
                  {sel && (
                    <View style={styles.horizontalCardCheck}>
                      <CheckSvg />
                    </View>
                  )}
                </View>
                <Text style={[styles.horizontalCardName, sel && styles.horizontalCardNameSelected]} numberOfLines={2}>
                  {t(`menu.questions.${question.id}.options.${opt.name}`)}
                </Text>
                {sel && <View pointerEvents="none" style={styles.horizontalCardSelectedRing} />}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : variant === 'cards' ? (
        <View style={styles.badgesContainer}>
          {question.options.map((opt: NormalizedOption) => {
            const sel = isSelected(opt.name);
            return (
              <TouchableOpacity
                key={opt.name}
                style={[styles.badge, sel && styles.badgeSelected]}
                onPress={() => handleSelect(opt.name)}
                activeOpacity={0.8}
                accessibilityRole={isSingle ? 'radio' : 'checkbox'}
                accessibilityState={{ checked: sel }}
              >
                <Text style={[styles.badgeText, sel && styles.badgeTextSelected]}>
                  {t(`menu.questions.${question.id}.options.${opt.name}`)}
                </Text>
                {opt.price > 0 && (
                  <Text style={[styles.badgePrice, sel && styles.badgePriceSelected]}>
                    {formatExtraPrice(opt.price)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.optionsList}>
          {question.options.map((opt: NormalizedOption) => {
            const sel = isSelected(opt.name);
            return (
              <TouchableOpacity
                key={opt.name}
                style={[styles.option, sel && styles.optionSelected]}
                onPress={() => handleSelect(opt.name)}
                activeOpacity={0.75}
                accessibilityRole={isSingle ? 'radio' : 'checkbox'}
                accessibilityState={{ checked: sel }}
              >
                <View style={[
                  styles.indicator,
                  isSingle ? styles.indicatorRound : styles.indicatorSquare,
                  sel && styles.indicatorSelected,
                ]}>
                  {sel && (
                    isSingle
                      ? <View style={styles.radioDot} />
                      : <CheckSvg />
                  )}
                </View>
                {optionImages?.[opt.name] && !failedImages.has(opt.name) && (
                  <Image source={optionImages[opt.name]} style={styles.optionImage} contentFit="contain" onError={() => onImageError(opt.name)} />
                )}
                <Text style={[styles.optionName, sel && styles.optionNameSelected]}>
                  {t(`menu.questions.${question.id}.options.${opt.name}`)}
                </Text>
                {opt.price > 0 && (
                  <View style={styles.pricePill}>
                    <Text style={styles.optionPrice}>{formatExtraPrice(opt.price)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  containerError: {
    borderColor: Theme.colors.error,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  questionText: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    letterSpacing: 0.1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requiredBadge: {
    backgroundColor: 'rgba(249,18,26,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: 'rgba(249,18,26,0.18)',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.primary,
    letterSpacing: 0.2,
  },
  maxBadge: {
    backgroundColor: Theme.colors.badge,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
  },
  maxText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.badgeText,
  },

  // ── Error ───────────────────────────────────────────────────
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
    paddingBottom: 2,
    backgroundColor: Theme.colors.errorLight,
  },
  errorText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.error,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },

  // ── List Options ────────────────────────────────────────────
  optionsList: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.md,
    minHeight: 44,
  },
  optionSelected: {
    backgroundColor: 'rgba(249,18,26,0.06)',
  },
  indicator: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indicatorRound: {
    borderRadius: Theme.borderRadii.full,
  },
  indicatorSquare: {
    borderRadius: 5,
  },
  indicatorSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: '#fff',
  },
  optionImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Theme.colors.surface,
  },
  optionName: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  optionNameSelected: {
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.text,
  },
  pricePill: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  optionPrice: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  // ── Badges (multi-select without images) ────────────────────
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    gap: 3,
  },
  badgeSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  badgeText: {
    fontSize: 11,
    color: Theme.colors.text,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  badgeTextSelected: {
    color: '#fff',
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  badgePrice: {
    fontSize: 9,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  badgePriceSelected: {
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Horizontal Cards (drinks) ───────────────────────────────
  horizontalScrollContent: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  horizontalCard: {
    width: HORIZONTAL_CARD_WIDTH,
    minHeight: 137,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Theme.colors.border,
    position: 'relative',
  },
  horizontalCardSelected: {
    borderColor: Theme.colors.primary,
  },
  horizontalCardPressed: {
    opacity: 0.86,
  },
  horizontalCardImageWrap: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 10,
    position: 'relative',
  },
  horizontalCardImageTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,18,26,0.07)',
  },
  horizontalCardImage: {
    width: '100%',
    height: '100%',
  },
  horizontalCardPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalCardEmoji: {
    fontSize: 32,
  },
  horizontalCardPriceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadii.full,
  },
  horizontalCardPriceBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  horizontalCardCheck: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  horizontalCardName: {
    fontSize: 12,
    color: Theme.colors.text,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    lineHeight: 15,
    minHeight: 43,
  },
  horizontalCardNameSelected: {
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.primary,
  },
  horizontalCardSelectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.borderRadii.xl,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
});
