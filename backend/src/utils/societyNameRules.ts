/**
 * Arunachal Pradesh cooperative society naming rules:
 * - Full names only (no abbreviations / meaningless tokens)
 * - Letters, numbers, and spaces only (no special characters)
 * - AP place names + society vocabulary are allowlisted
 * - Same name cannot be repeated among active applications
 *
 * Approach: regex heuristics + blocklist + local allowlist
 * (English dictionary packages are avoided — they false-reject AP place names.)
 */

import { AppError } from './errors';
import { MEANINGFUL_WORD_ALLOWLIST } from './societyNameAllowlists';
import { validateText } from './validateText';

/** Letters, numbers, and spaces only — no special characters. */
const SOCIETY_NAME_ALLOWED_CHARS = /^[A-Za-z0-9\s]+$/;

/** Short connector words allowed in official names. */
const ALLOWED_SHORT_TOKENS = new Set([
  'ltd',
  'co',
  'of',
  'and',
  'the',
  'a',
  'an',
  'ap',
  'sc',
  'st',
]);

/**
 * Common placeholder / nonsense tokens that must not appear in a society name.
 * Matched case-insensitively as whole words.
 */
const MEANINGLESS_WORD_BLOCKLIST = new Set([
  'abc',
  'abcd',
  'xyz',
  'xyza',
  'xyze',
  'xxx',
  'yyy',
  'zzz',
  'aaa',
  'bbb',
  'ccc',
  'asdf',
  'asdfg',
  'qwer',
  'qwerty',
  'qwert',
  'zxcv',
  'zxcvb',
  'test',
  'testing',
  'tester',
  'temp',
  'tmp',
  'dummy',
  'sample',
  'demo',
  'demos',
  'lorem',
  'ipsum',
  'foo',
  'bar',
  'baz',
  'foobar',
  'null',
  'none',
  'na',
  'nill',
  'nil',
  'todo',
  'tbd',
  'unknown',
  'undefined',
  'string',
  'name',
  'societyname',
  'abcdefgh',
  'abcdef',
  'aaaa',
  'bbbb',
  'xxxx',
  'wwww',
  'asdfgh',
  'poiuy',
  'hjkl',
  'blah',
  'bla',
  'xxxxy',
  'random',
  'garbage',
  'junk',
  'fake',
  'placeholder',
]);

const hasVowel = (word: string): boolean => /[aeiouy]/i.test(word);

const abbreviationErrorMessage =
  'Abbreviated or meaningless words are not permitted in the society name. Please use a meaningful full name.';

export const normalizeSocietyName = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Resolve the society name from create/update payloads.
 * Frontend may send `cooperative_society_name` or legacy `society_name`.
 */
export const resolveSocietyNameFromBody = (data: Record<string, unknown> | null | undefined): string => {
  if (!data || typeof data !== 'object') return '';
  return (
    normalizeSocietyName(data.cooperative_society_name) ||
    normalizeSocietyName(data.society_name)
  );
};

/**
 * Reject abbreviations and meaningless tokens.
 * Allowlisted connectors, AP places, and society vocabulary are exempt.
 */
const assertMeaningfulWord = (word: string): void => {
  const lower = word.toLowerCase();

  // Always block known junk, even if it somehow appears in an allowlist later
  if (MEANINGLESS_WORD_BLOCKLIST.has(lower)) {
    throw new AppError(abbreviationErrorMessage, 400);
  }

  if (ALLOWED_SHORT_TOKENS.has(lower) || MEANINGFUL_WORD_ALLOWLIST.has(lower)) {
    return;
  }

  // Numeric tokens are allowed (e.g. "2", "Ward2") — skip letter-based abbreviation heuristics
  if (/^\d+$/.test(lower) || /\d/.test(lower)) {
    return;
  }

  // Short abbreviations: abc, xyz, MCS, etc. (1–3 letters)
  if (lower.length <= 3) {
    throw new AppError(abbreviationErrorMessage, 400);
  }

  // Entire word is the same letter repeated (aaa, xxxx)
  if (/^(.)\1+$/i.test(lower)) {
    throw new AppError(abbreviationErrorMessage, 400);
  }

  // No vowels → typically an abbreviation / gibberish (bcd, strng, mcsx)
  if (!hasVowel(lower)) {
    throw new AppError(abbreviationErrorMessage, 400);
  }
};

/**
 * Format rules for cooperative society names.
 * Throws AppError (400) with a user-facing message when invalid.
 */
export const assertSocietyNameFormat = (rawName: unknown): string => {
  const name = normalizeSocietyName(rawName);

  if (!name) {
    throw new AppError('Society name is required', 400);
  }

  // Shared meaningful-text checks (repeats, keyboard mash, symbol-only, length bounds)
  const textCheck = validateText(name);
  if (!textCheck.valid) {
    throw new AppError(textCheck.message, 400);
  }

  if (name.length < 10) {
    throw new AppError(
      'Abbreviated society names are not permitted. Please use the full name of the Cooperative Society.',
      400
    );
  }

  // Letters, numbers, and spaces only (blocks special characters)
  if (!SOCIETY_NAME_ALLOWED_CHARS.test(name)) {
    throw new AppError(
      'Society name cannot contain special characters. Please use letters, numbers, and spaces only.',
      400
    );
  }

  const words = name.split(/\s+/);
  const letterWords = words.filter((w) => /[a-zA-Z]/.test(w));
  if (letterWords.length < 2) {
    throw new AppError(
      'Abbreviated society names are not permitted. Please use the full name of the Cooperative Society.',
      400
    );
  }

  for (const word of words) {
    assertMeaningfulWord(word);
  }

  if (!societyNameHasCooperativePrivateLimited(name)) {
    throw new AppError(
      'Society name must include "Cooperative Private Limited".',
      400
    );
  }

  return name;
};

/** "Cooperative Private Limited" is required in the society name (any casing, single spaces). */
export const societyNameHasCooperativePrivateLimited = (rawName: unknown): boolean =>
  /\bcooperative\s+private\s+limited\b/i.test(normalizeSocietyName(rawName));
