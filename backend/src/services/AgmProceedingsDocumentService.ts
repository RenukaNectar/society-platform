import fs from 'fs';
import path from 'path';

import Activity from '../models/Activity';
import Media from '../models/Media';
import User from '../models/user';
import logger from '../utils/logger';
import { stampByeLawPdfWithQr } from './ByeLawDocumentService';
import { overwriteMediaFileBuffer } from './MediaService';
import { extractDocumentMediaIds } from './WorkflowCommentService';

const AGM_MODULE_KEY = 'AGM';
const JT_RCS_ROLE = 'jt_rcs_district';
const JT_RCS_WORKFLOW_SEQUENCE = 7;

export const SD_RCS_AUTHORIZED_SIGNATORY_LINES = [
  'SD-RCS',
  'Authorized Signatory',
  'Registrar of Cooperative Societies,'
  // 'Arunachal Pradesh, Naharlagun',
] as const;

export const SD_RCS_AUTHORIZED_SIGNATORY_LINES_RENEWAL = [
  'Authorized Signatory',
  'Assistant Registrar of Cooperative Societies'
  // 'Arunachal Pradesh, Naharlagun',
] as const;

const pickWorkflowDocumentMediaId = (raw: unknown): string | null => {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') {
    const o = raw as { mediaId?: unknown; id?: unknown };
    if (typeof o.mediaId === 'string' && o.mediaId.trim()) return o.mediaId.trim();
    if (typeof o.id === 'string' && o.id.trim()) return o.id.trim();
  }
  return null;
};

const readMediaBuffer = (mediaUrl: string): Buffer | null => {
  try {
    const filePath = path.resolve(__dirname, '../../uploads', path.basename(mediaUrl));
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
};

/**
 * Finds the proceedings document (other_documents) uploaded by JT RCS at workflow sequence 7.
 * Falls back to the latest other_documents attachment on the AGM if sequence 7 upload is missing.
 */
export const findJtRcsProceedingsMediaId = async (
  agmId: string,
  moduleName: string = AGM_MODULE_KEY,
): Promise<string | null> => {
  const activities = await Activity.findAll({
    where: { reference_id: agmId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  for (const activity of activities) {
    const data = (activity as any)?.data || {};
    if (data?.moduleName !== moduleName) continue;

    const isJtRcsUpload =
      data?.workflowSequence === JT_RCS_WORKFLOW_SEQUENCE ||
      data?.currentRole === JT_RCS_ROLE;

    if (!isJtRcsUpload || !data?.documents) continue;

    const mediaId = pickWorkflowDocumentMediaId((data.documents as any)?.other_documents);
    if (mediaId) return mediaId;
  }

  for (const activity of [...activities].reverse()) {
    const data = (activity as any)?.data || {};
    if (data?.moduleName !== moduleName || !data?.documents) continue;

    for (const { key, mediaId } of extractDocumentMediaIds(data.documents)) {
      if (key === 'other_documents' && mediaId) {
        return mediaId;
      }
    }
  }

  return null;
};

export type IssueAgmProceedingsDocumentResult = {
  issuedMediaId: string;
  stamped: boolean;
};

/**
 * Stamps JT RCS proceedings PDF with verification QR and SD-RCS authorized signatory block,
 * then overwrites the underlying media file in place.
 */
export const issueAgmProceedingsDocument = async (
  agmId: string,
  approverUserId: string,
  societyRegistrationId?: string | null,
): Promise<IssueAgmProceedingsDocumentResult | null> => {
  const sourceMediaId = await findJtRcsProceedingsMediaId(agmId);
  if (!sourceMediaId) {
    logger.warn('AGM proceedings issuance skipped: no JT RCS other_documents found', { agmId });
    return null;
  }

  const sourceMedia = await Media.findByPk(sourceMediaId);
  if (!sourceMedia?.url) {
    logger.warn('AGM proceedings issuance skipped: source media not found', { agmId, sourceMediaId });
    return null;
  }

  const originalBytes = readMediaBuffer(sourceMedia.url);
  if (!originalBytes) {
    logger.warn('AGM proceedings issuance skipped: media file missing on disk', {
      agmId,
      sourceMediaId,
      url: sourceMedia.url,
    });
    return null;
  }

  const approver = await User.findByPk(approverUserId, {
    attributes: ['id', 'first_name', 'last_name', 'signature_media_id'],
    include: [{ association: 'media', attributes: ['url'], required: false }],
  });

  const signedByName = approver
    ? `${approver.first_name || ''} ${approver.last_name || ''}`.trim()
    : '';

  const signatureMediaUrl = (approver as any)?.media?.url ?? null;
  const baseUrl = String(process.env.API_URL || '').replace(/\/+$/, '');
  const qrDownloadUrl = baseUrl
    ? `${baseUrl}/api/v1/public/media/${sourceMediaId}/download`
    : undefined;

  let stamped = false;
  try {
    const issuedAt = new Date();
    const stampedFile = await stampByeLawPdfWithQr(
      {
        originalname: path.basename(sourceMedia.url),
        mimetype: 'application/pdf',
        size: originalBytes.length,
        buffer: originalBytes,
        userId: approverUserId,
      },
      {
        societyRegistrationId: societyRegistrationId ?? null,
        mediaId: sourceMediaId,
        uploadedByUserId: approverUserId,
        uploadedByName: signedByName || undefined,
        signedByName: signedByName || 'RCS District',
        signedByDesignationLines: [...SD_RCS_AUTHORIZED_SIGNATORY_LINES],
        signatureMediaUrl,
        qrDownloadUrl,
        issuedAt,
      },
    );

    await overwriteMediaFileBuffer(sourceMediaId, stampedFile.buffer, approverUserId);
    stamped = true;

    logger.info('AGM proceedings document issued with QR and SD-RCS signatory', {
      agmId,
      sourceMediaId,
      approverUserId,
    });
  } catch (err) {
    logger.error('AGM proceedings document stamping failed', {
      agmId,
      sourceMediaId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    issuedMediaId: sourceMediaId,
    stamped,
  };
};
