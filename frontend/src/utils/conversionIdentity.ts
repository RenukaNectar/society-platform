export const CONVERTED_SOCIETY_NAME_KEY = "converted_society_name";
export const CONVERTED_SOCIETY_ADDRESS_KEY = "converted_society_address";

function asRecord(data: unknown): Record<string, unknown> {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  return {};
}

export function readConvertedSocietyIdentity(data: unknown): {
  name: string;
  address: string;
} {
  const source = asRecord(data);

  return {
    name: String(source[CONVERTED_SOCIETY_NAME_KEY] ?? "").trim(),
    address: String(source[CONVERTED_SOCIETY_ADDRESS_KEY] ?? "").trim(),
  };
}

export function withoutConvertedSocietyIdentity(
  data: unknown,
): Record<string, unknown> {
  const source = { ...asRecord(data) };

  delete source[CONVERTED_SOCIETY_NAME_KEY];
  delete source[CONVERTED_SOCIETY_ADDRESS_KEY];
  return source;
}
