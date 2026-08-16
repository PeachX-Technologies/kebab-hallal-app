import { useState, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import PhoneField from '../components/PhoneField';
import { useLocale } from '../context/LocaleContext';
import { validateName, validatePhone } from '../utils/validationUtils';
import Theme from '../theme';

function InputField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  accessibilityLabel,
  hasError,
  icon,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  accessibilityLabel?: string;
  hasError?: boolean;
  icon: React.ReactNode;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const accentWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const borderColor = hasError
    ? Theme.colors.error
    : isFocused
    ? Theme.colors.primary
    : Theme.colors.border;

  return (
    <View>
      <View style={[styles.inputRow, { borderColor }]}>
        <Animated.View
          style={[
            styles.inputAccent,
            {
              width: accentWidth,
              backgroundColor: hasError ? Theme.colors.error : Theme.colors.primary,
            },
          ]}
        />
        <View style={styles.inputIconWrap}>{icon}</View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.textDisabled}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = () => {
    const nameResult = validateName(name);
    const phoneResult = validatePhone(phone);

    setNameError(nameResult.error ? t(`auth.login.${nameResult.error}`) : '');
    setPhoneError(phoneResult.error ? t(`auth.login.${phoneResult.error}`) : '');

    if (nameResult.valid && phoneResult.valid) {
      router.push({ pathname: '/otp', params: { name, phone } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.emojiContainer}>
              <Icon name="smartphone" size={40} color={Theme.colors.primary} />
            </View>
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.login.nameLabel')}</Text>
              <InputField
                value={name}
                onChangeText={(v) => { setName(v); setNameError(''); }}
                placeholder={t('auth.login.namePlaceholder')}
                autoCapitalize="words"
                accessibilityLabel={t('auth.login.nameLabel')}
                hasError={!!nameError}
                icon={<Icon name="user" size={18} color={nameError ? Theme.colors.error : Theme.colors.textSecondary} />}
              />
              {nameError ? (
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={14} color={Theme.colors.error} />
                  <Text style={styles.errorText}>{nameError}</Text>
                </View>
              ) : null}
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.login.phoneLabel')}</Text>
              <PhoneField
                value={phone}
                onChangeFormatted={(text) => { setPhone(text); setPhoneError(''); }}
                hasError={!!phoneError}
                onClearError={() => setPhoneError('')}
              />
              {phoneError ? (
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={14} color={Theme.colors.error} />
                  <Text style={styles.errorText}>{phoneError}</Text>
                </View>
              ) : null}
            </View>

            {/* OTP Info */}
            <View style={styles.otpInfoRow}>
              <Icon name="shield" size={14} color={Theme.colors.secondary} />
              <Text style={styles.otpInfo}>{t('auth.login.otpInfo')}</Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              accessibilityLabel={t('auth.login.submitButton')}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>{t('auth.login.submitButton')}</Text>
              <View style={styles.submitIconWrap}>
                <Icon name="arrow-right" size={20} color={Theme.colors.textInverse} />
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.xxl,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  emojiContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontSize: Theme.fontSizes.xxl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    letterSpacing: -0.4,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Theme.spacing.md,
  },

  // Form
  formSection: {
    gap: Theme.spacing.lg,
  },
  fieldGroup: {
    gap: Theme.spacing.xs,
  },
  label: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
    marginLeft: 2,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Theme.borderRadii.md,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    minHeight: 52,
    gap: Theme.spacing.sm,
    overflow: 'hidden',
  },
  inputAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: Theme.borderRadii.md,
    borderBottomLeftRadius: Theme.borderRadii.md,
  },
  inputIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  input: {
    flex: 1,
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.md,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginLeft: 2,
  },
  errorText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.error,
    flex: 1,
  },

  // OTP Info
  otpInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.warningLight,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.lg,
  },
  otpInfo: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.full,
    ...Theme.shadows.flame,
  },
  submitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    letterSpacing: 0.3,
  },

});
