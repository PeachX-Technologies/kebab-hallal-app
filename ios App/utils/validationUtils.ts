import { MIN_NAME_LENGTH } from '../constants';
import { getCountryFromPhone } from '../data/countries';

export function isWhitespaceOnly(str: string | null | undefined): boolean {
  if (str == null) return true;
  return str.trim().length === 0;
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (isWhitespaceOnly(name)) {
    return { valid: false, error: 'nameRequired' };
  }
  if (name.trim().length < MIN_NAME_LENGTH) {
    return { valid: false, error: 'nameError' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (isWhitespaceOnly(phone)) {
    return { valid: false, error: 'phoneRequired' };
  }
  const stripped = phone.replace(/\s+/g, '');
  if (!stripped.startsWith('+')) {
    return { valid: false, error: 'phoneError' };
  }
  const parsed = getCountryFromPhone(stripped);
  if (!parsed) {
    return { valid: false, error: 'phoneError' };
  }
  const digits = parsed.digits;
  if (digits.length < parsed.country.minLen || digits.length > parsed.country.maxLen) {
    return { valid: false, error: 'phoneError' };
  }
  return { valid: true };
}
