import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { countries, getCountryFromPhone } from '../data/countries';
import type { Country } from '../data/countries';
import Theme from '../theme';

const defaultCountry = countries.find((c) => c.code === 'IT') ?? countries[0];

interface PhoneFieldProps {
  value: string;
  onChangeFormatted: (phone: string) => void;
  hasError?: boolean;
  onClearError?: () => void;
}

export default function PhoneField({ value, onChangeFormatted, hasError, onClearError }: PhoneFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const isInternalRef = useRef(false);

  const [selected, setSelected] = useState<Country>(defaultCountry);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isInternalRef.current) {
      isInternalRef.current = false;
      return;
    }
    if (!value) {
      setSelected(defaultCountry);
      setPhoneDigits('');
      return;
    }
    const parsed = getCountryFromPhone(value);
    if (parsed) {
      setSelected(parsed.country);
      setPhoneDigits(parsed.digits);
    } else {
      setSelected(defaultCountry);
      setPhoneDigits('');
    }
  }, [value]);

  const dial = selected.dial.replace(/-/g, '');

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, selected.maxLen);
    setPhoneDigits(limited);
    const full = limited ? `${dial}${limited}` : '';
    isInternalRef.current = true;
    onChangeFormatted(full);
    onClearError?.();
  };

  const handleSelectCountry = (country: Country) => {
    const newDial = country.dial.replace(/-/g, '');
    const full = phoneDigits ? `${newDial}${phoneDigits}` : '';
    setSelected(country);
    setShowPicker(false);
    setSearch('');
    isInternalRef.current = true;
    onChangeFormatted(full);
    onClearError?.();
  };

  const filtered = useMemo(
    () =>
      search
        ? countries.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.dial.includes(search) ||
              c.code.toLowerCase().includes(search.toLowerCase()),
          )
        : countries,
    [search],
  );

  return (
    <>
      <View style={[styles.container, hasError && styles.containerError]}>
        <TouchableOpacity
          style={styles.prefixWrap}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{selected.flag}</Text>
          <Text style={styles.prefixText}>{selected.dial}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={phoneDigits}
          onChangeText={handleChangeText}
          placeholder={selected.format}
          placeholderTextColor={Theme.colors.textDisabled}
          keyboardType="number-pad"
        />
      </View>

      <Modal visible={showPicker} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => { setShowPicker(false); setSearch(''); }}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>x</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search country..."
                placeholderTextColor={Theme.colors.textDisabled}
              />
            </View>
            <FlatList
              data={filtered}
              renderItem={({ item }) => {
                const isSelected = item.code === selected.code;
                return (
                  <TouchableOpacity
                    style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                    onPress={() => handleSelectCountry(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={[styles.countryName, isSelected && styles.countryNameSelected]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.countryDial, isSelected && styles.countryDialSelected]}>
                      {item.dial}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries found</Text>
              }
            />
          </View>
      </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Theme.borderRadii.md,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    minHeight: 52,
    paddingLeft: Theme.spacing.sm,
  },
  containerError: {
    borderColor: Theme.colors.error,
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  flagText: {
    fontSize: 20,
    lineHeight: 24,
  },
  prefixText: {
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    fontWeight: '500',
    fontFamily: Theme.fontFamily.medium,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.md,
    paddingLeft: Theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.borderRadii.xl,
    borderTopRightRadius: Theme.borderRadii.xl,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  modalTitle: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.text,
  },
  searchWrap: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
  },
  countryList: {
    paddingHorizontal: Theme.spacing.lg,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.md,
    gap: Theme.spacing.sm,
  },
  countryItemSelected: {
    backgroundColor: Theme.colors.surfaceElevated,
  },
  countryFlag: {
    fontSize: 22,
    lineHeight: 26,
    width: 30,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.text,
    fontFamily: Theme.fontFamily.regular,
  },
  countryNameSelected: {
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  countryDial: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.regular,
  },
  countryDialSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Theme.spacing.xxl,
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSizes.sm,
  },
});

export function isValidItalianPhone(phone: string): boolean {
  return /^\+393\d{9}$/.test(phone.replace(/\s+/g, ''));
}

export function isValidPakistaniPhone(phone: string): boolean {
  return /^\+923\d{9}$/.test(phone.replace(/\s+/g, ''));
}
