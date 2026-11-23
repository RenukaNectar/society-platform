import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { Op } from 'sequelize';
import { PDFDocument } from 'pdf-lib';

import Activity from '../models/Activity';
import History from '../models/History';
import Media from '../models/Media';
import User from '../models/user';
import logger from '../utils/logger';
import { SD_RCS_AUTHORIZED_SIGNATORY_LINES_RENEWAL } from './AgmProceedingsDocumentService';
import { stampByeLawPdfWithQr } from './ByeLawDocumentService';
import {
  IMediaUploadData,
  overwriteMediaFileBuffer,
  readMediaFileBuffer,
  resolveMediaFilePath,
} from './MediaService';
import { extractDocumentMediaIds, getLatestCommentDocuments } from './WorkflowCommentService';

const RENEWAL_MODULE_KEY = 'SOCIETY_RENEWAL';
const DRCS_ROLE = 'drcs_arcs_district';
const JICS_ROLE = 'jics_sics_district';
const JICS_EXAMINATION_SEQUENCE = 3;
const DRCS_FINAL_SEQUENCE = 4;

const pickWorkflowDocumentMediaId = (raw: unknown): string | null => {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') {
    const o = raw as { mediaId?: unknown; id?: unknown; url?: unknown };
    if (typeof o.mediaId === 'string' && o.mediaId.trim()) return o.mediaId.trim();
    if (typeof o.id === 'string' && o.id.trim()) return o.id.trim();
  }
  return null;
};

const parseStoredJson = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const workflowSequenceMatches = (raw: unknown, expected: number): boolean =>
  Number(raw) === expected;

const detectBufferMimetype = (buffer: Buffer): string => {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('utf8') === '%PDF-') {
    return 'application/pdf';
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return 'application/octet-stream';
};

const getBackendPublicBaseUrl = (): string => {
  // APP_URL should point to backend; API_URL is sometimes (mis)configured to the frontend.
  const env = String(process.env.APP_URL || process.env.API_URL || '').trim();
  return env.replace(/\/+$/, '');
};

const downloadPublicMediaBytes = async (
  mediaId: string,
): Promise<{ buffer: Buffer; mimetype: string } | null> => {
  const baseUrl = getBackendPublicBaseUrl();
  if (!baseUrl) return null;

  const url = `${baseUrl}/api/v1/public/media/${mediaId}/download`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn('Failed to download public media bytes', { mediaId, url, status: res.status });
      return null;
    }
    const arr = await res.arrayBuffer();
    const mimetype = String(res.headers.get('content-type') || '').split(';')[0] || 'application/octet-stream';
    return { buffer: Buffer.from(arr), mimetype };
  } catch (err) {
    logger.warn('Public media download threw error', {
      mediaId,
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
};

/** Wrap a scanned certificate image in a single-page PDF so QR stamping can run. */
const wrapImageBufferAsPdf = async (buffer: Buffer, mimetype: string): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const embedded =
    mimetype === 'image/png'
      ? await pdfDoc.embedPng(buffer)
      : await pdfDoc.embedJpg(buffer);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const imageDims = embedded.scaleToFit(width - 80, height - 80);
  page.drawImage(embedded, {
    x: (width - imageDims.width) / 2,
    y: (height - imageDims.height) / 2,
    width: imageDims.width,
    height: imageDims.height,
  });

  return Buffer.from(await pdfDoc.save());
};

const prepareRenewalCertificatePdf = async (
  buffer: Buffer,
  mimetype: string,
): Promise<{ buffer: Buffer; mimetype: string }> => {
  const detected = detectBufferMimetype(buffer);
  if (detected === 'application/pdf' || mimetype === 'application/pdf') {
    return { buffer, mimetype: 'application/pdf' };
  }

  if (detected === 'image/png' || detected === 'image/jpeg') {
    const pdfBuffer = await wrapImageBufferAsPdf(buffer, detected);
    return { buffer: pdfBuffer, mimetype: 'application/pdf' };
  }

  throw new Error(
    `Renewal certificate must be a PDF or image (received ${mimetype || detected})`,
  );
};

const pickRenewalCertificateFromDocuments = (documents: unknown): string | null => {
  const parsed = parseStoredJson(documents) ?? (documents as Record<string, unknown> | null);
  if (!parsed) return null;
  const direct = pickWorkflowDocumentMediaId(parsed.renewal_certificate);
  if (direct) return direct;
  for (const { key, mediaId } of extractDocumentMediaIds(parsed)) {
    if (key === 'renewal_certificate' && mediaId) return mediaId;
  }
  return null;
};

/**
 * Finds renewal_certificate uploaded during workflow (JICS examination step 3, or DRCS final step 4).
 */
export const findRenewalCertificateMediaId = async (
  renewalId: string,
  moduleName: string = RENEWAL_MODULE_KEY,
): Promise<string | null> => {
  try {
    const mergedDocs = await getLatestCommentDocuments(renewalId, moduleName);
    const fromMerged = mergedDocs.find((d) => d.key === 'renewal_certificate')?.mediaId;
    if (fromMerged) return fromMerged;
  } catch (err) {
    logger.warn('findRenewalCertificateMediaId: getLatestCommentDocuments failed', {
      renewalId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const activities = await Activity.findAll({
    where: { reference_id: renewalId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  // Prefer JICS/SICS examination upload (step 3).
  for (const activity of [...activities].reverse()) {
    const data = parseStoredJson((activity as any)?.data) || {};
    if (data?.moduleName !== moduleName || !data?.documents) continue;
    const isJicsExamination =
      workflowSequenceMatches(data.workflowSequence, JICS_EXAMINATION_SEQUENCE) ||
      data?.currentRole === JICS_ROLE;
    if (!isJicsExamination) continue;
    const mediaId = pickRenewalCertificateFromDocuments(data.documents);
    if (mediaId) return mediaId;
  }

  // DRCS final-step upload (when configured on sequence 4).
  for (const activity of activities) {
    const data = parseStoredJson((activity as any)?.data) || {};
    if (data?.moduleName !== moduleName || !data?.documents) continue;
    const isDrcsFinalUpload =
      workflowSequenceMatches(data.workflowSequence, DRCS_FINAL_SEQUENCE) ||
      data?.currentRole === DRCS_ROLE;
    if (!isDrcsFinalUpload) continue;
    const mediaId = pickRenewalCertificateFromDocuments(data.documents);
    if (mediaId) return mediaId;
  }

  // Workflow history rows (documents may exist here even when activity lookup fails).
  const historyRows = await History.findAll({
    where: {
      reference_id: renewalId,
      resource: { [Op.in]: [moduleName, 'society_renewal', 'SOCIETY_RENEWAL'] },
    },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  for (const row of [...historyRows].reverse()) {
    const parsed = parseStoredJson((row as any)?.data);
    const mediaId = pickRenewalCertificateFromDocuments(parsed?.documents);
    if (mediaId) return mediaId;
  }

  // Fallback: any workflow activity that attached renewal_certificate.
  for (const activity of [...activities].reverse()) {
    const data = parseStoredJson((activity as any)?.data) || {};
    if (data?.moduleName !== moduleName || !data?.documents) continue;
    const mediaId = pickRenewalCertificateFromDocuments(data.documents);
    if (mediaId) return mediaId;
  }

  return null;
};

export type IssueRenewalCertificateDocumentResult = {
  issuedMediaId: string;
  issuedUrl: string;
  stamped: boolean;
};

type RenewalSignatoryDetails = {
  signedByName: string;
  signatureMediaUrl: string | null;
};

/**
 * Uses the DRCS/ARCS District user who performs final renewal approval as signatory.
 */
const resolveRenewalCertificateSignatory = async (
  approverUserId: string,
): Promise<RenewalSignatoryDetails> => {
  const user = await User.findByPk(approverUserId, {
    attributes: ['id', 'first_name', 'last_name', 'signature_media_id'],
    include: [{ association: 'media', attributes: ['url'], required: false }],
  });

  if (!user) {
    return {
      signedByName: 'DRCS/ARCS District',
      signatureMediaUrl: null,
    };
  }

  const signedByName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const signatureUrl = (user as { media?: { url?: string } }).media?.url ?? null;
  const signatureMediaUrl =
    signatureUrl && readMediaFileBuffer(signatureUrl) ? signatureUrl : null;

  logger.info('Renewal certificate signatory resolved from final approver', {
    approverUserId,
    hasSignature: !!signatureMediaUrl,
  });

  return {
    signedByName: signedByName || 'DRCS/ARCS District',
    signatureMediaUrl,
  };
};

/**
 * Stamps JICS/DRCS renewal certificate PDF with verification QR and SD-RCS signatory,
 * then overwrites the underlying media file in place.
 */
export const issueRenewalCertificateDocument = async (
  sourceMediaId: string,
  approverUserId: string,
  societyRegistrationId?: string | null,
): Promise<IssueRenewalCertificateDocumentResult | null> => {
  const sourceMedia = await Media.findByPk(sourceMediaId);
  if (!sourceMedia?.url) {
    logger.warn('Renewal certificate issuance skipped: source media not found', { sourceMediaId });
    return null;
  }

  let originalBytes = readMediaFileBuffer(sourceMedia.url);
  // If the file isn't on disk, fetch it from the public download endpoint and
  // persist it locally so stamping can happen in the same final approval.
  if (!originalBytes) {
    const downloaded = await downloadPublicMediaBytes(sourceMediaId);
    if (downloaded?.buffer?.length) {
      try {
        const filePath = resolveMediaFilePath(sourceMedia.url);
        if (filePath) {
          fs.writeFileSync(filePath, downloaded.buffer);
          originalBytes = downloaded.buffer;
          logger.info('Renewal certificate bytes recovered from public download', {
            sourceMediaId,
            filePath,
            bytes: downloaded.buffer.length,
          });
        }
      } catch (persistErr) {
        logger.warn('Failed to persist downloaded media bytes to disk', {
          sourceMediaId,
          error: persistErr instanceof Error ? persistErr.message : String(persistErr),
        });
      }
    }
  }

  if (!originalBytes) {
    logger.warn('Renewal certificate issuance skipped: media file missing on disk', {
      sourceMediaId,
      url: sourceMedia.url,
      filePath: resolveMediaFilePath(sourceMedia.url),
    });
    return null;
  }

  const signatory = await resolveRenewalCertificateSignatory(approverUserId);

  const baseUrl = getBackendPublicBaseUrl();
  const qrDownloadUrl = baseUrl
    ? `${baseUrl}/api/v1/public/media/${sourceMediaId}/download`
    : undefined;

  let stamped = false;

  try {
    const issuedAt = new Date();
    const storedMimetype = detectBufferMimetype(originalBytes);
    const prepared = await prepareRenewalCertificatePdf(originalBytes, storedMimetype);
    const preparedHash = createHash('sha256').update(prepared.buffer).digest('hex');

    const uploadData: IMediaUploadData = {
      originalname: path.basename(sourceMedia.url),
      mimetype: prepared.mimetype,
      size: prepared.buffer.length,
      buffer: prepared.buffer,
      userId: approverUserId,
    };

    const stampedFile = await stampByeLawPdfWithQr(uploadData, {
      societyRegistrationId: societyRegistrationId ?? null,
      mediaId: sourceMediaId,
      uploadedByUserId: approverUserId,
      uploadedByName: signatory.signedByName || undefined,
      signedByName: signatory.signedByName,
      signedByDesignationLines: [...SD_RCS_AUTHORIZED_SIGNATORY_LINES_RENEWAL],
      signatureMediaUrl: signatory.signatureMediaUrl,
      qrDownloadUrl,
      issuedAt,
    });

    const stampedHash = createHash('sha256').update(stampedFile.buffer).digest('hex');
    if (stampedHash === preparedHash) {
      throw new Error('QR stamping did not modify the renewal certificate PDF');
    }

    await overwriteMediaFileBuffer(sourceMediaId, stampedFile.buffer, approverUserId);
    stamped = true;

    const refreshedAfterStamp = await Media.findByPk(sourceMediaId, { attributes: ['id', 'url'] });
    logger.info('Renewal certificate issued with QR and SD-RCS signatory', {
      sourceMediaId,
      approverUserId,
      originalBytes: originalBytes.length,
      stampedBytes: stampedFile.buffer.length,
      issuedUrl: refreshedAfterStamp?.url || sourceMedia.url,
      filePath: resolveMediaFilePath(refreshedAfterStamp?.url || sourceMedia.url),
    });
  } catch (err) {
    logger.error('Renewal certificate stamping failed', {
      sourceMediaId,
      url: sourceMedia.url,
      filePath: resolveMediaFilePath(sourceMedia.url),
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const refreshed = await Media.findByPk(sourceMediaId, { attributes: ['id', 'url'] });

  return {
    issuedMediaId: sourceMediaId,
    issuedUrl: refreshed?.url || sourceMedia.url,
    stamped,
  };
};
