import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '../utils/firebase';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from '../constants';
import Theme from '../theme';
import { useOtpAutoFill } from 'expo-otp-autofill';

// Guards against duplicate SMS sends: one send per session, with a per-phone
// window so remounts (StrictMode, navigation) never fire a second SMS.
let lastSentPhone: string | null = null;
let lastSentAt = 0;

export default function OtpScreen() {
  const { t } = useLocale();
  const { login } = useAuth();
  const { name, phone } = useLocalSearchParams<{ name: string; phone: string }>();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef(phone);
  const sentRef = useRef(false);
  const sendOtpRef = useRef<() => void>(() => {});

  const autoFill = useOtpAutoFill({ length: OTP_LENGTH, timeout: 0 });

  useEffect(() => {
    if (autoFill.otp && otp !== autoFill.otp) {
      setOtp(autoFill.otp);
      inputRef.current?.focus();
    }
  }, [autoFill.otp]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const sendOtp = useCallback(async () => {
    if (!phoneRef.current) return;
    if (sentRef.current) return;
    setIsSendingOtp(true);
    setError('');

    if (!auth) {
      setError(t('auth.otp.sendError'));
      setIsSendingOtp(false);
      return;
    }

    const now = Date.now();
    if (
      lastSentPhone === phoneRef.current &&
      now - lastSentAt < RESEND_COOLDOWN_SECONDS * 1000
    ) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setIsSendingOtp(false);
      return;
    }

    try {
      const result = await auth().signInWithPhoneNumber(phoneRef.current);
      lastSentPhone = phoneRef.current;
      lastSentAt = now;
      setConfirmationResult(result);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      console.error('[sendOtp] code:', e?.code, '| message:', e?.message);
      if (e?.code === 'auth/too-many-requests') {
        setError(t('auth.otp.tooManyRequests'));
      } else if (e?.code === 'auth/invalid-phone-number') {
        setError(t('auth.otp.invalidPhone') ?? 'Invalid phone number format.');
      } else if (e?.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else if (e?.code === 'auth/captcha-check-failed') {
        setError('Security check failed. Please restart the app.');
      } else if (e?.code === 'auth/missing-phone-number') {
        setError('Phone number is missing.');
      } else {
        setError(`${t('auth.otp.sendError')} (${e?.code ?? 'unknown'})`);
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [t]);

  sendOtpRef.current = sendOtp;

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendOtpRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      setError(t('auth.otp.incorrectError'));
      triggerShake();
      return;
    }
    if (!confirmationResult) {
      setError(t('auth.otp.sendError'));
      return;
    }
    setIsVerifying(true);
    try {
      await confirmationResult.confirm(otp);
      await login(name ?? '', phone ?? '');
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.code === 'auth/invalid-verification-code') {
        setError(t('auth.otp.incorrectError'));
      } else {
        setError(t('auth.otp.verifyError'));
      }
      setOtp('');
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  }, [otp, confirmationResult, login, name, phone, t, triggerShake]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (otp.length === OTP_LENGTH && !error && !isVerifying && confirmationResult) {
      handleVerify();
    }
  }, [otp, handleVerify, error, isVerifying, confirmationResult]);

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    setError('');
  };

  const handleResend = () => {
    setOtp('');
    setError('');
    autoFill.clear();
    sentRef.current = false;
    sendOtp();
    inputRef.current?.focus();
  };

  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? '');
  const isFilled = otp.length === OTP_LENGTH;
  const isCorrect = otp.length === OTP_LENGTH && !error && isFilled && !isSendingOtp;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <View style={styles.content}>
          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={Theme.colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.emojiContainer}>
              <Icon name="lock" size={40} color={Theme.colors.primary} />
            </View>
            <Text style={styles.title}>{t('auth.otp.title')}</Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.subtitle}>
              {t('auth.otp.subtitle')}
            </Text>
            <View style={styles.phoneBadge}>
              <Icon name="smartphone" size={14} color={Theme.colors.secondary} />
              <Text style={styles.phoneHighlight}>{phone}</Text>
            </View>
          </View>

          {/* OTP Boxes */}
          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            <TouchableOpacity
              style={styles.otpRowInner}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
              accessibilityLabel="OTP input"
            >
              {boxes.map((digit, i) => {
                const isActive = i === otp.length && otp.length < OTP_LENGTH;
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      isActive ? styles.otpBoxActive : null,
                      error ? styles.otpBoxError : null,
                      isCorrect ? styles.otpBoxCorrect : null,
                    ]}
                  >
                    <Text style={[styles.otpDigit, error && styles.otpDigitError, isCorrect && styles.otpDigitCorrect]}>
                      {digit || (isActive ? '|' : '')}
                    </Text>
                  </View>
                );
              })}
            </TouchableOpacity>
          </Animated.View>

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            accessibilityLabel="OTP code input"
          />

          {/* Error / Hint */}
          {error ? (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={14} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>{t('auth.otp.hint')}</Text>
          )}

          {/* Resend */}
          {resendCooldown > 0 ? (
            <View style={styles.resendCooldown}>
              <Icon name="rotate-cw" size={14} color={Theme.colors.textDisabled} />
              <Text style={styles.resendCooldownText}>
                {t('auth.otp.resendButton')} in {resendCooldown}s
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              activeOpacity={0.7}
            >
              <Icon name="rotate-cw" size={14} color={Theme.colors.primary} />
              <Text style={styles.resendText}>{t('auth.otp.resendButton')}</Text>
            </TouchableOpacity>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              !isFilled && styles.verifyButtonDisabled,
              isVerifying && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isVerifying || !isFilled}
            accessibilityLabel={t('auth.otp.submitButton')}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={[styles.verifyButtonText, !isFilled && styles.verifyButtonTextDisabled]}>
              {isVerifying ? t('common.loading') : t('auth.otp.submitButton')}
            </Text>
            {!isVerifying && (
              <View style={[styles.submitIconWrap, !isFilled && styles.submitIconWrapDisabled]}>
                <Icon name="arrow-right"
                  size={20}
                  color={isFilled ? Theme.colors.textInverse : Theme.colors.textSecondary}
                />
              </View>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    alignItems: 'center',
  },

  // Back
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  backIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceElevated,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  phoneHighlight: {
    color: Theme.colors.text,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    fontSize: Theme.fontSizes.sm,
  },

  // OTP
  otpRow: {
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  otpRowInner: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: Theme.borderRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  otpBoxFilled: {
    borderColor: Theme.colors.primary,
  },
  otpBoxActive: {
    borderColor: Theme.colors.primary,
    borderWidth: 2,
  },
  otpBoxError: {
    backgroundColor: Theme.colors.errorLight,
    borderColor: Theme.colors.error,
  },
  otpBoxCorrect: {
    backgroundColor: Theme.colors.successLight,
    borderColor: Theme.colors.success,
  },
  otpDigit: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  otpDigitError: {
    color: Theme.colors.error,
  },
  otpDigitCorrect: {
    color: Theme.colors.success,
  },

  // Hidden input
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  // Error / hint
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: Theme.fontSizes.sm,
    textAlign: 'center',
  },
  hint: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSizes.xs,
    marginBottom: Theme.spacing.sm,
  },

  // Resend
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  resendText: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  resendCooldown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  resendCooldownText: {
    color: Theme.colors.textDisabled,
    fontSize: Theme.fontSizes.sm,
  },

  // Verify button
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    width: '100%',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.full,
    ...Theme.shadows.flame,
  },
  verifyButtonDisabled: {
    backgroundColor: Theme.colors.border,
  },
  verifyButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    letterSpacing: 0.3,
  },
  verifyButtonTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  submitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIconWrapDisabled: {
    backgroundColor: 'transparent',
  },

});
