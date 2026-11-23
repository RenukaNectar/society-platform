/**
 * Status labels on applicant/details pages: when the API sends "Rejected"
 * (or close variants) for a return/re-view action, show "Returned".
 */
export function formatStatusTitleForDisplay(
  title: string | null | undefined,
): string {
  if (title == null || title === "") return "";
  let t = String(title);
  t = t.replace(/\bRejected\b/g, "Returned");
  t = t.replace(/\brejected\b/g, "returned");
  t = t.replace(/\bRejection\b/g, "Returned");
  t = t.replace(/\brejection\b/g, "returned");
  t = t.replace(/\bRejections\b/g, "Returned");
  return t;
}

const isRejectedStatusLabel = (statusKey?: string | null, statusTitle?: string | null): boolean => {
  const key = String(statusKey || "").trim().toLowerCase();
  const title = String(statusTitle || "").trim();
  return key === "rejected" || /\brejected\b/i.test(title);
};

/** Head Office inquiry/inspection calls a return "Returned", not "Rejected". */
export function enquiryHeadOfficeStatusLabel(
  isRcsInitiated: boolean | null | undefined,
  statusKey?: string | null,
  statusTitle?: string | null,
): string {
  const title = String(statusTitle || "");
  if (isRcsInitiated && isRejectedStatusLabel(statusKey, title)) {
    return "Returned";
  }
  if (String(statusKey || "").trim().toLowerCase() === "rejected") {
    return "Returned";
  }
  return isRcsInitiated ? formatStatusTitleForDisplay(title) : title;
}
