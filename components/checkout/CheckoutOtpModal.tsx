import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '../../utils/firebase';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { OTP_LENGTH } from '../../constants';
import Theme from '../../theme';
import { useOtpAutoFill } from 'expo-otp-autofill';

const RESEND_COOLDOWN = 30;
const TEST_PHONE = '+921111111111';

interface CheckoutOtpModalProps {
  visible: boolean;
  name: string;
  phone: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function CheckoutOtpModal({ visible, name, phone, onVerified, onClose }: CheckoutOtpModalProps) {
  const { t } = useLocale();
  const { login } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef(phone);

  const autoFill = useOtpAutoFill({ length: OTP_LENGTH, timeout: 0 });

  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);

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
    setIsSendingOtp(true);
    setError('');

    if (phoneRef.current === TEST_PHONE) {
      setConfirmationResult({ confirm: async () => {} });
      setResendCooldown(RESEND_COOLDOWN);
      setIsSendingOtp(false);
      return;
    }

    if (!auth) {
      setError(t('auth.otp.sendError'));
      setIsSendingOtp(false);
      return;
    }

    try {
      const result = await auth().signInWithPhoneNumber(phoneRef.current);
      setConfirmationResult(result);
      setResendCooldown(RESEND_COOLDOWN);
    } catch (e: any) {
      if (e?.code === 'auth/too-many-requests') {
        setError(t('auth.otp.tooManyRequests'));
      } else {
        setError(t('auth.otp.sendError'));
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible) {
      sendOtp();
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible, sendOtp]);

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
      await login(name, phone);
      setOtp('');
      setError('');
      onVerified();
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
  }, [otp, confirmationResult, login, name, phone, t, triggerShake, onVerified]);

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
    sendOtp();
    inputRef.current?.focus();
  };

  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? '');
  const isFilled = otp.length === OTP_LENGTH;
  const isCorrect = otp.length === OTP_LENGTH && !error && isFilled && !isSendingOtp;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
      >
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            onTouchEnd={() => inputRef.current?.focus()}
          >
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <View style={styles.headerSection}>
              <View style={styles.emojiContainer}>
                <Icon name="lock" size={32} color={Theme.colors.primary} />
              </View>
              <Text style={styles.title}>{t('auth.otp.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.otp.subtitle')}</Text>
              <View style={styles.phoneBadge}>
                <Icon name="smartphone" size={14} color={Theme.colors.secondary} />
                <Text style={styles.phoneHighlight}>{phone}</Text>
              </View>
            </View>

            <Animated.View
              style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
            >
              <View style={styles.otpRowInner} pointerEvents="none">
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
              </View>
              <TextInput
                ref={inputRef}
                style={styles.otpInput}
                value={otp}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                textContentType="oneTimeCode"
                caretHidden
              />
            </Animated.View>

            {error ? (
              <View style={styles.errorRow}>
                <Icon name="alert-circle" size={14} color={Theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <Text style={styles.hint}>{t('auth.otp.hint')}</Text>
            )}

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

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.verifyButton, !isFilled && styles.verifyButtonDisabled, isVerifying && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={isVerifying || !isFilled}
                activeOpacity={0.85}
              >
                <Text style={[styles.verifyButtonText, !isFilled && styles.verifyButtonTextDisabled]}>
                  {isVerifying ? t('common.loading') : t('auth.otp.submitButton')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.borderRadii.xl,
    borderTopRightRadius: Theme.borderRadii.xl,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
    alignItems: 'center',
    maxHeight: '85%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  handleRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.border,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
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
  },
  phoneHighlight: {
    color: Theme.colors.text,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    fontSize: Theme.fontSizes.sm,
  },
  otpRow: {
    width: '100%',
    marginBottom: Theme.spacing.md,
    position: 'relative',
  },
  otpRowInner: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    justifyContent: 'center',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: Theme.borderRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  otpBoxFilled: {
    borderColor: Theme.colors.primary,
    borderWidth: 1.5,
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
  otpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
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
  footer: {
    width: '100%',
    gap: Theme.spacing.sm,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
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
  },
  verifyButtonTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  cancelText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
});
