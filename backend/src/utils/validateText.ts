export type ValidateTextSuccess = {
  valid: true;
  value: string;
};

export type ValidateTextFailure = {
  valid: false;
  message: string;
};

export type ValidateTextResult = ValidateTextSuccess | ValidateTextFailure;

/**
 * General meaningful-text validation (length, symbol-only, repeats, keyboard mash, long tokens).
 */
export function validateText(value: unknown): ValidateTextResult {
  if (value == null || !String(value).trim()) {
    return { valid: false, message: 'Input is required.' };
  }

  const text = String(value).trim();

  // Minimum and maximum length
  if (text.length < 2 || text.length > 500) {
    return {
      valid: false,
      message: 'Text must be between 2 and 500 characters.',
    };
  }

  // Reject symbol-only input
  if (/^[\p{P}\p{S}\s]+$/u.test(text)) {
    return {
      valid: false,
      message: 'Enter meaningful text.',
    };
  }

  // Reject excessive repeated characters: aaaaaaaa, 11111111
  if (/(.)\1{6,}/iu.test(text)) {
    return {
      valid: false,
      message: 'Repeated characters are not allowed.',
    };
  }

  // Reject keyboard mashing
  if (/(?:asdf|qwerty|zxcv|qazwsx){2,}/i.test(text)) {
    return {
      valid: false,
      message: 'Please enter meaningful text.',
    };
  }

  // Reject long uninterrupted alphanumeric strings
  if (/\b[a-z0-9]{18,}\b/i.test(text)) {
    return {
      valid: false,
      message: 'Please check your input.',
    };
  }

  return { valid: true, value: text };
}
