const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Liquidation office should show this line as the previous role comment. */
export function formatLiquidationWorkflowComment(
  comment: string | null | undefined
): string | null {
  const match = String(comment || "")
    .trim()
    .match(/^Workflow\s+(\w+)\s+for\s+LIQUIDATION(?:_RCS)?:\s*(.+)$/i);
  if (!match) return null;
  const societyName = match[2].trim();
  if (!societyName) return null;
  return `Workflow ${match[1].toLowerCase()} for Liquidation: ${societyName}`;
}

/** Auto-generated history line (no real officer comment) — hide from Previous Role Comment. */
export function isAutoWorkflowHistoryComment(
  comment: string | null | undefined,
  moduleName?: string,
  referenceId?: string
): boolean {
  if (!comment?.trim()) return true;
  const d = comment.trim();
  const mod = String(moduleName || "").trim();

  if (referenceId && mod) {
    const rid = String(referenceId);
    const defaults = [
      `Application approved for ${mod} ${rid}`,
      `Application returned for ${mod} ${rid}`,
      `Application back for ${mod} ${rid}`,
      `Workflow approve for ${mod} ${rid}`,
      `Workflow return for ${mod} ${rid}`,
      `Workflow back for ${mod} ${rid}`,
    ];
    if (defaults.includes(d)) return true;
  }

  if (/^Workflow\s+\w+\s+for\s+[A-Z0-9_\s]+\s+[0-9a-f-]{36}\s*$/i.test(d)) {
    return true;
  }

  if (mod && new RegExp(`^Workflow\\s+\\w+\\s+for\\s+${mod}:\\s+`, "i").test(d)) {
    return true;
  }

  if (/^Workflow\s+\w+\s+for\s+[A-Z0-9_\s]+\s*$/i.test(d) && UUID_PATTERN.test(d)) {
    return true;
  }

  return false;
}

export function pickMeaningfulHistoryComment(
  history: Array<{ comments?: string | null }> | null | undefined,
  moduleName?: string,
  referenceId?: string
): string | null {
  if (!Array.isArray(history)) return null;
  for (const entry of history) {
    const c = entry?.comments?.trim();
    if (c && !isAutoWorkflowHistoryComment(c, moduleName, referenceId)) {
      return c;
    }
  }
  return null;
}
