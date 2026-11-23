export function parseWorkflowDocuments(docs?: string | string[] | null): string[] {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs.map(String);
  try {
    const parsed = JSON.parse(docs);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Applicant must upload/re-upload challan (workflow sequence 9). */
export function isApplicantChallanReuploadStep(society: {
  workflowStatus?: { next?: { sequence?: number; approval_documents?: string | string[] | null } };
} | null | undefined): boolean {
  const next = society?.workflowStatus?.next;
  if (!next || Number(next.sequence) !== 9) return false;
  return parseWorkflowDocuments(next.approval_documents).includes("challan_receipt");
}

export function needsApplicantChallanAction(
  society: {
    status?: { key?: string };
    statusDetails?: { key?: string };
    workflowStatus?: { next?: { sequence?: number; approval_documents?: string | string[] | null } };
  } | null | undefined,
  statusKey?: string | null
): boolean {
  const key =
    statusKey ??
    society?.status?.key ??
    society?.statusDetails?.key ??
    null;
  if (key === "challan_pending") return true;
  return isApplicantChallanReuploadStep(society);
}
