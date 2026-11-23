import { api } from "../../api";

/** API resource segment for `GET /{segment}/{id}/history` (same as societies). */
export type HistoryResourcePath =
  | "societies"
  | "society-renewals"
  | "amendments"
  | "annual-forms"
  | "audit-requests"
  | "election-requests"
  | "liquidations"
  | "appeals"
  | "enquiry-requests"
  | "society-conversions"
  | "annual-general-meeting"
  | "board-of-directors-meeting"
  | "special-general-meeting"
  | "business-activities";

export const parseHistoryResponse = (response: unknown): any[] => {
  if (!response || typeof response !== "object") {
    return Array.isArray(response) ? response : [];
  }

  const r = response as Record<string, unknown>;
  const data = r.data;

  if (r.success === true && data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.history)) return d.history;
  }

  if (Array.isArray(r.history)) return r.history;

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.history)) return d.history;
  }

  if (Array.isArray(data)) return data;

  return [];
};

/** Fetch processing history (comments + documents) for any module resource. */
export const getResourceHistory = async (
  resourcePath: HistoryResourcePath,
  resourceId: string,
): Promise<any[]> => {
  if (!resourceId) return [];

  try {
    const response = await api.get(`/${resourcePath}/${resourceId}/history`);
    return parseHistoryResponse(response);
  } catch {
    return [];
  }
};

/** @deprecated Use getResourceHistory — kept for society registration details. */
export const getSocietyHistory = (id: string) => {
  return api.get<any>(`/societies/${id}/history`);
};
