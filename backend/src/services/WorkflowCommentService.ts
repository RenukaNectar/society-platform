import { Op } from 'sequelize';
import Activity from '../models/Activity';
import Media from '../models/Media';
import User from '../models/user';
import { findHistoryByReference } from './HistoryService';
import logger from '../utils/logger';

const formatDocumentLabel = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const INSPECTION_INQUIRY_ACTIVITY_MODULES = new Set(['INSPECTION_INQUIRY', 'INSPECTION_INQUIRY_RCS']);
const LIQUIDATION_ACTIVITY_MODULES = new Set(['LIQUIDATION', 'LIQUIDATION_RCS']);

/** HQ and district inspection/liquidation share one activity module name. */
const activityModuleMatches = (requestedModule: string, activityModule: unknown): boolean => {
  const activityKey = String(activityModule || '').trim();
  if (!activityKey) return false;
  if (activityKey === requestedModule) return true;
  if (
    INSPECTION_INQUIRY_ACTIVITY_MODULES.has(requestedModule) &&
    INSPECTION_INQUIRY_ACTIVITY_MODULES.has(activityKey)
  ) {
    return true;
  }
  if (
    LIQUIDATION_ACTIVITY_MODULES.has(requestedModule) &&
    LIQUIDATION_ACTIVITY_MODULES.has(activityKey)
  ) {
    return true;
  }
  return false;
};

/** Exported for history API: resolve workflow `documents` payload to flat media id list. */
export const extractDocumentMediaIds = (documents: any): Array<{ key: string; mediaId: string }> => {
  if (!documents || typeof documents !== 'object') return [];

  const result: Array<{ key: string; mediaId: string }> = [];
  for (const [key, value] of Object.entries(documents)) {
    if (typeof value === 'string' && value.trim()) {
      result.push({ key, mediaId: value });
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          result.push({ key, mediaId: item });
        } else if (item && typeof item === 'object' && typeof (item as any).mediaId === 'string') {
          result.push({ key, mediaId: (item as any).mediaId });
        }
      }
      continue;
    }

    if (value && typeof value === 'object' && typeof (value as any).mediaId === 'string') {
      result.push({ key, mediaId: (value as any).mediaId });
    }
  }

  return result;
};

const parseActivityData = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
};

export const getLatestCommentDocuments = async (
  referenceId: string,
  moduleName: string
): Promise<Array<{ key: string; label: string; mediaId: string; url: string }>> => {
  const activities = await Activity.findAll({
    where: { reference_id: referenceId },
    order: [['created_at', 'DESC']],
    limit: 25
  });

  // Merge workflow documents from all matching activities (oldest → newest so each key keeps the latest media id).
  // Do not require non-empty comments — forwards often use optional comments while still attaching required docs.
  const mergedByKey = new Map<string, string>();
  for (const activity of [...activities].reverse()) {
    const data = parseActivityData((activity as any)?.data);
    if (!activityModuleMatches(moduleName, data?.moduleName)) continue;
    if (!data?.documents || typeof data.documents !== 'object' || Object.keys(data.documents).length === 0) {
      continue;
    }
    for (const { key, mediaId } of extractDocumentMediaIds(data.documents)) {
      if (!mediaId?.trim()) continue;
      mergedByKey.set(key, mediaId.trim());
    }
  }

  const mappedDocs = Array.from(mergedByKey.entries()).map(([key, mediaId]) => ({ key, mediaId }));
  if (mappedDocs.length === 0) return [];

  const mediaIds = Array.from(new Set(mappedDocs.map(doc => doc.mediaId)));
  if (mediaIds.length === 0) return [];

  const mediaRows = await Media.findAll({
    where: { id: { [Op.in]: mediaIds }, active: true },
    attributes: ['id', 'url']
  });

  const mediaUrlMap = new Map<string, string>();
  for (const row of mediaRows as any[]) {
    if (row?.id && row?.url) mediaUrlMap.set(row.id, row.url);
  }

  return mappedDocs
    .map(doc => ({
      key: doc.key,
      label: formatDocumentLabel(doc.key),
      mediaId: doc.mediaId,
      url: mediaUrlMap.get(doc.mediaId) || ''
    }))
    .filter(doc => Boolean(doc.url));
};

export type ProcessingHistoryCommentItem = {
  id?: string;
  comment: string;
  type?: string;
  createdAt?: string | Date;
  createdBy?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string | null;
  } | null;
  documentsMedia?: Record<string, unknown> | null;
};

export type CompleteProcessingHistory = {
  title: string;
  commentsMadeDuringProcessing: {
    label: string;
    items: ProcessingHistoryCommentItem[];
  };
  previouslyUploadedDocuments: {
    label: string;
    items: Array<{ key: string; label: string; mediaId: string; url: string }>;
  };
};

const mapHistoryUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.first_name ?? undefined,
    lastName: user.last_name ?? undefined,
    email: user.email ?? undefined,
    role: user.role?.name ?? null
  };
};

const isMeaningfulProcessingComment = (comment: unknown): comment is string =>
  typeof comment === 'string' && comment.trim().length > 0;

const sortByCreatedAtDesc = <T extends { createdAt?: string | Date }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

const loadHistoryRows = async (
  referenceId: string,
  historyResources: string[]
): Promise<any[]> => {
  const merged = new Map<string, any>();
  for (const resource of historyResources) {
    try {
      const rows = await findHistoryByReference(referenceId, resource);
      for (const row of rows) {
        if (row?.id) merged.set(String(row.id), row);
      }
    } catch (err: any) {
      logger.warn('loadHistoryRows failed for resource', {
        referenceId,
        resource,
        error: err?.message
      });
    }
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const loadActivityComments = async (
  referenceId: string,
  moduleName: string
): Promise<ProcessingHistoryCommentItem[]> => {
  const activities = await Activity.findAll({
    where: { reference_id: referenceId },
    order: [['created_at', 'DESC']],
    limit: 50,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  const items: ProcessingHistoryCommentItem[] = [];
  for (const activity of activities as any[]) {
    const data = activity?.data || {};
    if (!activityModuleMatches(moduleName, data?.moduleName)) continue;
    if (!isMeaningfulProcessingComment(data?.comments)) continue;
    items.push({
      id: activity.id,
      comment: String(data.comments).trim(),
      type: 'workflow_activity',
      createdAt: activity.created_at,
      createdBy: mapHistoryUser(activity.creator)
    });
  }
  return items;
};

/** Build unified processing history block for module detail APIs. */
export const buildCompleteProcessingHistory = async (
  referenceId: string,
  moduleName: string,
  options?: {
    historyResources?: string[];
    existingHistory?: any[];
    existingDocuments?: Array<{ key: string; label: string; mediaId: string; url: string }>;
  }
): Promise<CompleteProcessingHistory> => {
  const historyResources = options?.historyResources?.length
    ? options.historyResources
    : [moduleName];

  let previouslyUploadedDocuments = options?.existingDocuments;
  if (!Array.isArray(previouslyUploadedDocuments)) {
    try {
      previouslyUploadedDocuments = await getLatestCommentDocuments(referenceId, moduleName);
    } catch {
      previouslyUploadedDocuments = [];
    }
  }

  let historyRows = Array.isArray(options?.existingHistory) ? options.existingHistory : [];
  if (historyRows.length === 0) {
    historyRows = await loadHistoryRows(referenceId, historyResources);
  }

  const commentsFromHistory: ProcessingHistoryCommentItem[] = historyRows
    .filter((row) => isMeaningfulProcessingComment(row?.comments))
    .map((row) => ({
      id: row.id,
      comment: String(row.comments).trim(),
      type: row.type,
      createdAt: row.created_at,
      createdBy: mapHistoryUser(row.createdByUser),
      documentsMedia: row.documents_media ?? null
    }));

  const activityComments = await loadActivityComments(referenceId, moduleName);

  const seen = new Set<string>();
  const mergedComments = sortByCreatedAtDesc(
    [...commentsFromHistory, ...activityComments].filter((item) => {
      const key = `${item.id || ''}|${item.comment}|${item.createdAt || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  );

  return {
    title: 'The complete history of:',
    commentsMadeDuringProcessing: {
      label: 'Comments made during processing',
      items: mergedComments
    },
    previouslyUploadedDocuments: {
      label: 'Previously uploaded documents',
      items: previouslyUploadedDocuments
    }
  };
};

/**
 * Attach `completeHistory` (and back-fill `history` / `previousCommentDocuments`) on module detail payloads.
 */
export const attachCompleteProcessingHistoryToDetail = async (
  detail: Record<string, any>,
  referenceId: string,
  moduleName: string,
  options?: { historyResources?: string[] }
): Promise<Record<string, any>> => {
  if (!detail || !referenceId || !moduleName) return detail;

  const historyResources = options?.historyResources?.length
    ? options.historyResources
    : [moduleName];

  if (!Array.isArray(detail.previousCommentDocuments)) {
    try {
      detail.previousCommentDocuments = await getLatestCommentDocuments(referenceId, moduleName);
    } catch {
      detail.previousCommentDocuments = [];
    }
  }

  if (!Array.isArray(detail.history) || detail.history.length === 0) {
    try {
      detail.history = await loadHistoryRows(referenceId, historyResources);
    } catch {
      detail.history = [];
    }
  }

  detail.completeHistory = await buildCompleteProcessingHistory(referenceId, moduleName, {
    historyResources,
    existingHistory: detail.history,
    existingDocuments: detail.previousCommentDocuments
  });

  try {
    const { resolveAndAttachByeLawsMediaForDetail } = await import('./ModuleByeLawDocumentService');
    await resolveAndAttachByeLawsMediaForDetail(detail, referenceId, moduleName);
  } catch (err) {
    logger.warn('Failed to attach byeLawsMedia from workflow documents', {
      referenceId,
      moduleName,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return detail;
};
