/**
 * Transliterates English (Latin) text into Hindi (Devanagari) script.
 * Phonetic typing only — not meaning-based translation.
 * Example: "OCTOBER 6 Society" → "अक्टूबर ६ सोसाइटी"
 */
export async function transliterateToHindi(
  text: string,
  signal?: AbortSignal
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const params = new URLSearchParams({
    text: trimmed,
    itc: 'hi-t-i0-und',
    num: '1',
    cp: '0',
    cs: '1',
    ie: 'utf-8',
    oe: 'utf-8',
    app: 'demopage',
  });

  const response = await fetch(
    `https://inputtools.google.com/request?${params}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error('Transliteration request failed');
  }

  const data = await response.json();
  const hindi =
    data?.[0] === 'SUCCESS' && Array.isArray(data?.[1]?.[0]?.[1])
      ? data[1][0][1][0]
      : null;

  if (typeof hindi !== 'string' || !hindi) {
    throw new Error('Transliteration failed');
  }

  return hindi;
}
