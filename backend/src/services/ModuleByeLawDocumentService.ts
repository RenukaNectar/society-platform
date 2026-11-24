import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

import Activity from '../models/Activity';
import Amendment from '../models/Amendment';
import AnnualForm from '../models/AnnualForm';
import Appeal from '../models/Appeal';
import AuditRequest from '../models/AuditRequest';
import ElectionRequest from '../models/ElectionRequest';
import Enquiry from '../models/Enquiry';
import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import Liquidation from '../models/Liquidation';
import Media from '../models/Media';
import SocietyConversion from '../models/SocietyConversion';
import SocietyRegistration from '../models/SocietyRegistration';
import SpecialGeneralBoardMeeting from '../models/SpecialGeneralBoardMeeting';
import User from '../models/user';
import logger from '../utils/logger';
import { SD_RCS_AUTHORIZED_SIGNATORY_LINES } from './AgmProceedingsDocumentService';
import { stampByeLawPdfWithQr } from './ByeLawDocumentService';
import {
  IMediaUploadData,
  readMediaFileBuffer,
  resolveMediaFilePath,
  uploadMediaWithPredefinedId,
} from './MediaService';
import { extractDocumentMediaIds, getLatestCommentDocuments } from './WorkflowCommentService';

const JT_RCS_ROLE = 'jt_rcs_district';

/** Workflow upload keys that map to entity `bye_laws` (seeders use rcs_observations at JT RCS step). */
export const BYE_LAW_WORKFLOW_DOCUMENT_KEYS = ['bye_laws', 'rcs_observations'] as const;

const isByeLawWorkflowDocumentKey = (key: string): boolean =>
  (BYE_LAW_WORKFLOW_DOCUMENT_KEYS as readonly string[]).includes(key);

export const BYE_LAW_WORKFLOW_MODULE_CONFIG: Record<
  string,
  { jtRcsSequence: number; rcsFinalSequence: number }
> = {
  AGM: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  BOD: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  SGBM: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  APPEAL: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  AMENDMENT: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  ANNUAL_FILING: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  ELECTION: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  AUDIT_REQUEST: { jtRcsSequence: 6, rcsFinalSequence: 7 },
  SOCIETY_CONVERSION: { jtRcsSequence: 7, rcsFinalSequence: 8 },
  INSPECTION_INQUIRY: { jtRcsSequence: 8, rcsFinalSequence: 9 },
  INSPECTION_INQUIRY_RCS: { jtRcsSequence: 10, rcsFinalSequence: 11 },
  LIQUIDATION: { jtRcsSequence: 19, rcsFinalSequence: 20 },
  LIQUIDATION_RCS: { jtRcsSequence: 20, rcsFinalSequence: 21 },
};

const INSPECTION_INQUIRY_MODULE_ALIASES = new Set(['INSPECTION_INQUIRY', 'INSPECTION_INQUIRY_RCS']);
const LIQUIDATION_MODULE_ALIASES = new Set(['LIQUIDATION', 'LIQUIDATION_RCS']);

const moduleNameMatchesActivity = (moduleName: string, activityModuleName: unknown): boolean => {
  const activityKey = String(activityModuleName || '').trim();
  if (!activityKey) return false;
  if (activityKey === moduleName) return true;
  if (
    INSPECTION_INQUIRY_MODULE_ALIASES.has(moduleName) &&
    INSPECTION_INQUIRY_MODULE_ALIASES.has(activityKey)
  ) {
    return true;
  }
  if (
    LIQUIDATION_MODULE_ALIASES.has(moduleName) &&
    LIQUIDATION_MODULE_ALIASES.has(activityKey)
  ) {
    return true;
  }
  return false;
};

const pickWorkflowDocumentMediaId = (raw: unknown): string | null => {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') {
    const o = raw as { mediaId?: unknown; id?: unknown };
    if (typeof o.mediaId === 'string' && o.mediaId.trim()) return o.mediaId.trim();
    if (typeof o.id === 'string' && o.id.trim()) return o.id.trim();
  }
  return null;
};

/** Resolves bye_laws media id from workflow `documents` (bye_laws or rcs_observations). */
export const pickByeLawsMediaIdFromDocuments = (documents: unknown): string | null => {
  if (!documents || typeof documents !== 'object') return null;
  const docs = documents as Record<string, unknown>;
  for (const docKey of BYE_LAW_WORKFLOW_DOCUMENT_KEYS) {
    const direct = pickWorkflowDocumentMediaId(docs[docKey]);
    if (direct) return direct;
  }
  for (const { key, mediaId } of extractDocumentMediaIds(documents)) {
    if (isByeLawWorkflowDocumentKey(key) && mediaId) return mediaId;
  }
  return null;
};

const findByeLawsMediaIdInMergedDocuments = (
  mergedDocs: Array<{ key: string; mediaId: string }>,
): string | null => {
  for (const docKey of BYE_LAW_WORKFLOW_DOCUMENT_KEYS) {
    const mediaId = mergedDocs.find((d) => d.key === docKey)?.mediaId;
    if (mediaId) return mediaId;
  }
  return null;
};

const workflowSequenceMatches = (raw: unknown, expected: number): boolean =>
  Number(raw) === expected;

const getBackendPublicBaseUrl = (): string =>
  String(process.env.APP_URL || process.env.API_URL || '')
    .trim()
    .replace(/\/+$/, '');

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

const prepareModuleByeLawPdf = async (
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
    `Module bye-law document must be a PDF or image (received ${mimetype || detected})`,
  );
};

const resolveSignatoryDetails = async (
  approverUserId: string,
): Promise<{ signedByName: string; signatureMediaUrl: string | null }> => {
  const approver = await User.findByPk(approverUserId, {
    attributes: ['id', 'first_name', 'last_name', 'signature_media_id'],
    include: [{ association: 'media', attributes: ['url'], required: false }],
  });

  if (!approver) {
    return { signedByName: 'RCS District', signatureMediaUrl: null };
  }

  const signedByName =
    `${approver.first_name || ''} ${approver.last_name || ''}`.trim() || 'RCS District';
  const signatureUrl = (approver as { media?: { url?: string } })?.media?.url ?? null;
  const signatureMediaUrl =
    signatureUrl && readMediaFileBuffer(signatureUrl) ? signatureUrl : null;

  return { signedByName, signatureMediaUrl };
};

const downloadPublicMediaBytes = async (mediaId: string): Promise<Buffer | null> => {
  const baseUrl = getBackendPublicBaseUrl();
  if (!baseUrl) return null;

  const url = `${baseUrl}/api/v1/public/media/${mediaId}/download`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn('Module bye-law: failed to download public media bytes', {
        mediaId,
        url,
        status: res.status,
      });
      return null;
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    logger.warn('Module bye-law: public media download threw error', {
      mediaId,
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
};

export const resolveModuleSocietyRegistrationId = async (
  entity: {
    get?: (key: string) => unknown;
    society_id?: string | null;
    society_registration_id?: string | null;
    society_registration_no?: string | null;
  },
  moduleName?: string,
): Promise<string | null> => {
  const societyId = entity.get ? entity.get('society_id') : entity.society_id;
  if (societyId) return String(societyId);

  const societyRegId = entity.get
    ? entity.get('society_registration_id')
    : entity.society_registration_id;
  if (societyRegId) return String(societyRegId);

  if (moduleName === 'APPEAL') {
    const regNo = entity.get
      ? entity.get('society_registration_no')
      : entity.society_registration_no;
    if (regNo) {
      const registration = await SocietyRegistration.findOne({
        where: { registration_number: String(regNo) },
        attributes: ['id'],
      });
      if (registration?.id) return String(registration.id);
    }
  }

  return null;
};

/**
 * Finds bye_laws uploaded by JT RCS at the module's JT RCS workflow step.
 */
export const findJtRcsByeLawsMediaId = async (
  resourceId: string,
  moduleName: string,
): Promise<string | null> => {
  const moduleConfig = BYE_LAW_WORKFLOW_MODULE_CONFIG[moduleName];
  if (!moduleConfig) return null;

  const activities = await Activity.findAll({
    where: { reference_id: resourceId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  for (const activity of activities) {
    const data = (activity as { data?: Record<string, unknown> })?.data || {};
    if (!moduleNameMatchesActivity(moduleName, data?.moduleName) || !data?.documents) continue;

    const isJtRcsUpload =
      workflowSequenceMatches(data.workflowSequence, moduleConfig.jtRcsSequence) ||
      data?.currentRole === JT_RCS_ROLE;

    if (!isJtRcsUpload) continue;

    const mediaId = pickByeLawsMediaIdFromDocuments(data.documents);
    if (mediaId) return mediaId;
  }

  for (const activity of [...activities].reverse()) {
    const data = (activity as { data?: Record<string, unknown> })?.data || {};
    if (!moduleNameMatchesActivity(moduleName, data?.moduleName) || !data?.documents) continue;

    const mediaId = pickByeLawsMediaIdFromDocuments(data.documents);
    if (mediaId) return mediaId;
  }

  return null;
};

export const resolveModuleByeLawsMediaId = async (
  resourceId: string,
  moduleName: string,
  entity: { get?: (key: string) => unknown; bye_laws?: string | null },
  documents?: Record<string, unknown> | null,
): Promise<string | null> => {
  const fromEntity = entity.get ? entity.get('bye_laws') : entity.bye_laws;
  if (fromEntity) return String(fromEntity);

  const fromRequest = documents ? pickByeLawsMediaIdFromDocuments(documents) : null;
  if (fromRequest) return fromRequest;

  try {
    const mergedDocs = await getLatestCommentDocuments(resourceId, moduleName);
    const fromMerged = findByeLawsMediaIdInMergedDocuments(mergedDocs);
    if (fromMerged) return fromMerged;
  } catch (err) {
    logger.warn('resolveModuleByeLawsMediaId: getLatestCommentDocuments failed', {
      resourceId,
      moduleName,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return findJtRcsByeLawsMediaId(resourceId, moduleName);
};

export type IssueModuleByeLawDocumentResult = {
  issuedMediaId: string;
  stamped: boolean;
};

/**
 * Stamps module bye-laws PDF with verification QR and SD-RCS authorized signatory block,
 * saves as a new media row, and returns the issued media id for entity.bye_laws.
 */
export const issueModuleByeLawDocument = async (
  sourceMediaId: string,
  approverUserId: string,
  societyRegistrationId?: string | null,
): Promise<IssueModuleByeLawDocumentResult | null> => {
  const sourceMedia = await Media.findByPk(sourceMediaId);
  if (!sourceMedia?.url) {
    logger.warn('Module bye-law issuance skipped: source media not found', { sourceMediaId });
    return null;
  }

  let originalBytes = readMediaFileBuffer(sourceMedia.url);
  if (!originalBytes) {
    const downloaded = await downloadPublicMediaBytes(sourceMediaId);
    if (downloaded?.length) {
      try {
        const filePath = resolveMediaFilePath(sourceMedia.url);
        if (filePath) {
          fs.writeFileSync(filePath, downloaded);
          originalBytes = downloaded;
        }
      } catch (persistErr) {
        logger.warn('Module bye-law: failed to persist downloaded media bytes', {
          sourceMediaId,
          error: persistErr instanceof Error ? persistErr.message : String(persistErr),
        });
      }
    }
  }

  if (!originalBytes) {
    logger.warn('Module bye-law issuance skipped: media file missing on disk', {
      sourceMediaId,
      url: sourceMedia.url,
      filePath: resolveMediaFilePath(sourceMedia.url),
    });
    return null;
  }

  const signatory = await resolveSignatoryDetails(approverUserId);
  const issuedMediaId = uuidv4();
  const baseUrl = getBackendPublicBaseUrl();
  const qrDownloadUrl = baseUrl
    ? `${baseUrl}/api/v1/public/media/${issuedMediaId}/download`
    : undefined;

  let stamped = false;
  try {
    const issuedAt = new Date();
    const prepared = await prepareModuleByeLawPdf(originalBytes, detectBufferMimetype(originalBytes));
    const preparedHash = createHash('sha256').update(prepared.buffer).digest('hex');

    const uploadData: IMediaUploadData = {
      originalname: path.basename(sourceMedia.url) || 'bye_law.pdf',
      mimetype: prepared.mimetype,
      size: prepared.buffer.length,
      buffer: prepared.buffer,
      userId: approverUserId,
    };

    const stampedFile = await stampByeLawPdfWithQr(uploadData, {
      societyRegistrationId: societyRegistrationId ?? null,
      mediaId: issuedMediaId,
      uploadedByUserId: approverUserId,
      uploadedByName: signatory.signedByName || undefined,
      signedByName: signatory.signedByName,
      signedByDesignationLines: [...SD_RCS_AUTHORIZED_SIGNATORY_LINES],
      signatureMediaUrl: signatory.signatureMediaUrl,
      qrDownloadUrl,
      issuedAt,
    });

    const stampedHash = createHash('sha256').update(stampedFile.buffer).digest('hex');
    if (stampedHash === preparedHash) {
      throw new Error('QR stamping did not modify the module bye-law PDF');
    }

    await uploadMediaWithPredefinedId(
      {
        ...stampedFile,
        originalname: `bye_law_issued_${issuedMediaId}.pdf`,
        mimetype: 'application/pdf',
      },
      approverUserId,
      issuedMediaId,
    );
    stamped = true;

    logger.info('Module bye-law document issued with QR and SD-RCS signatory', {
      sourceMediaId,
      issuedMediaId,
      approverUserId,
      societyRegistrationId: societyRegistrationId ?? null,
      originalBytes: originalBytes.length,
      stampedBytes: stampedFile.buffer.length,
    });
  } catch (err) {
    logger.error('Module bye-law document stamping failed', {
      sourceMediaId,
      issuedMediaId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      issuedMediaId: sourceMediaId,
      stamped: false,
    };
  }

  return {
    issuedMediaId,
    stamped,
  };
};

const backfillModuleByeLawsColumn = async (
  moduleName: string,
  resourceId: string,
  mediaId: string,
): Promise<void> => {
  const payload = { bye_laws: mediaId };
  switch (moduleName) {
    case 'AGM':
    case 'BOD':
      await GeneralBodyMeeting.update(payload, { where: { id: resourceId } });
      break;
    case 'SGBM':
      await SpecialGeneralBoardMeeting.update(payload, { where: { id: resourceId } });
      break;
    case 'APPEAL':
      await Appeal.update(payload, { where: { id: resourceId } });
      break;
    case 'AMENDMENT':
      await Amendment.update(payload, { where: { id: resourceId } });
      break;
    case 'ANNUAL_FILING':
      await AnnualForm.update(payload, { where: { id: resourceId } });
      break;
    case 'ELECTION':
      await ElectionRequest.update(payload, { where: { id: resourceId } });
      break;
    case 'AUDIT_REQUEST':
      await AuditRequest.update(payload, { where: { id: resourceId } });
      break;
    case 'SOCIETY_CONVERSION':
      await SocietyConversion.update(payload, { where: { id: resourceId } });
      break;
    case 'INSPECTION_INQUIRY':
    case 'INSPECTION_INQUIRY_RCS':
      await Enquiry.update(payload, { where: { id: resourceId } });
      break;
    case 'LIQUIDATION':
    case 'LIQUIDATION_RCS':
      await Liquidation.update(payload, { where: { id: resourceId } });
      break;
    default:
      break;
  }
};

const isModuleDetailApproved = (
  detail: Record<string, any>,
  moduleName: string,
): boolean => {
  // Detail APIs use different status association names (status, appealStatus, …).
  const statusKey =
    detail?.status?.key ??
    detail?.appealStatus?.key ??
    detail?.statusDetails?.key ??
    detail?.status_details?.key ??
    detail?.statusInfo?.key ??
    detail?.statusObj?.key ??
    detail?.statusKey ??
    null;
  if (
    statusKey === 'approved' ||
    statusKey === 'registrar_approved' ||
    statusKey === 'inspection_approved' ||
    statusKey === 'inspection_inquiry_approved' ||
    statusKey === 'inquiry_approved' ||
    statusKey === 'liquidation_approved'
  ) {
    return true;
  }

  // Do not treat "parked on final RCS workflow step" as approved — JT RCS upload must
  // stay unstamped in byeLawsMedia until rcs_district approves (seq 8).
  return false;
};

const resolveFinalRcsApproverUserId = async (
  detail: Record<string, any>,
  resourceId: string,
  moduleName: string,
  rcsFinalSequence: number,
): Promise<string | null> => {
  if (detail?.status_changed_by) return String(detail.status_changed_by);

  const activities = await Activity.findAll({
    where: { reference_id: resourceId },
    order: [['created_at', 'DESC']],
    limit: 40,
  });

  for (const activity of activities) {
    const data = (activity as { data?: Record<string, unknown> })?.data || {};
    if (!moduleNameMatchesActivity(moduleName, data?.moduleName) || data?.action !== 'approve') continue;
    if (!workflowSequenceMatches(data.workflowSequence, rcsFinalSequence)) continue;
    const userId = (activity as { created_by?: string }).created_by;
    if (userId) return String(userId);
  }

  return null;
};

const isIssuedByeLawMedia = (mediaId: string, url: unknown): boolean => {
  const raw = typeof url === 'string' ? url.trim() : '';
  if (!raw) return false;
  return path.basename(raw, path.extname(raw)) === mediaId;
};

/**
 * Stamp the amendment's new byelaw with the same QR and RCS signatory used on
 * RCS observations. Skips a file that was already issued.
 */
export const stampAmendmentProposedByelawIfNeeded = async (
  amendmentId: string,
  approverUserId: string,
  societyRegistrationId?: string | null,
): Promise<string | null> => {
  const amendment = await Amendment.findByPk(amendmentId, {
    attributes: ['id', 'new_proposed_byelaw_media_id'],
  });
  const sourceMediaId = String(amendment?.get('new_proposed_byelaw_media_id') || '').trim();
  if (!sourceMediaId) return null;

  const sourceMedia = await Media.findByPk(sourceMediaId, { attributes: ['id', 'url'] });
  if (isIssuedByeLawMedia(sourceMediaId, sourceMedia?.url)) return sourceMediaId;

  const issuance = await issueModuleByeLawDocument(
    sourceMediaId,
    approverUserId,
    societyRegistrationId,
  );
  if (!issuance?.stamped || !issuance.issuedMediaId) {
    logger.warn('Amended byelaw QR and RCS signature stamping did not complete', {
      amendmentId,
      sourceMediaId,
    });
    return null;
  }

  await Amendment.update(
    { new_proposed_byelaw_media_id: issuance.issuedMediaId },
    { where: { id: amendmentId } },
  );
  logger.info('Amended byelaw updated with QR and RCS signature', {
    amendmentId,
    sourceMediaId,
    issuedMediaId: issuance.issuedMediaId,
  });
  return issuance.issuedMediaId;
};

/**
 * Approved records may still point bye_laws at the JT RCS upload when final stamping
 * failed or ran before the issued-media fix. Re-stamp on detail fetch when needed.
 */
export const ensureStampedByeLawsMediaForApprovedDetail = async (
  detail: Record<string, any>,
  resourceId: string,
  moduleName: string,
): Promise<void> => {
  const moduleConfig = BYE_LAW_WORKFLOW_MODULE_CONFIG[moduleName];
  if (!moduleConfig || !isModuleDetailApproved(detail, moduleName)) return;

  const jtSourceMediaId = await findJtRcsByeLawsMediaId(resourceId, moduleName);
  if (!jtSourceMediaId) return;

  const currentMediaId = detail?.byeLawsMedia?.id ?? detail?.bye_laws ?? null;
  if (currentMediaId && String(currentMediaId) !== String(jtSourceMediaId)) {
    return;
  }

  const approverUserId = await resolveFinalRcsApproverUserId(
    detail,
    resourceId,
    moduleName,
    moduleConfig.rcsFinalSequence,
  );
  if (!approverUserId) {
    logger.warn('Approved module bye_laws repair skipped: no RCS approver user', {
      resourceId,
      moduleName,
    });
    return;
  }

  const societyRegId = await resolveModuleSocietyRegistrationId(detail, moduleName);
  const issuance = await issueModuleByeLawDocument(jtSourceMediaId, approverUserId, societyRegId);
  if (!issuance?.stamped || !issuance.issuedMediaId) {
    logger.warn('Approved module bye_laws repair: stamping did not complete on detail fetch', {
      resourceId,
      moduleName,
      jtSourceMediaId,
    });
    return;
  }

  await backfillModuleByeLawsColumn(moduleName, resourceId, issuance.issuedMediaId);
  const media = await Media.findByPk(issuance.issuedMediaId, { attributes: ['id', 'url'] });
  detail.bye_laws = issuance.issuedMediaId;
  detail.byeLawsMedia = media ? media.toJSON() : { id: issuance.issuedMediaId };

  logger.info('Repaired approved module bye_laws with stamped document on detail fetch', {
    resourceId,
    moduleName,
    jtSourceMediaId,
    issuedMediaId: issuance.issuedMediaId,
  });
};

/**
 * When entity.bye_laws was not persisted at JT RCS approve, attach byeLawsMedia from
 * workflow documents (rcs_observations / bye_laws) and optionally backfill the entity column.
 */
export const resolveAndAttachByeLawsMediaForDetail = async (
  detail: Record<string, any>,
  resourceId: string,
  moduleName: string,
): Promise<void> => {
  if (!BYE_LAW_WORKFLOW_MODULE_CONFIG[moduleName]) return;

  try {
    await ensureStampedByeLawsMediaForApprovedDetail(detail, resourceId, moduleName);
    if (moduleName === 'AMENDMENT' && isModuleDetailApproved(detail, moduleName)) {
      const moduleConfig = BYE_LAW_WORKFLOW_MODULE_CONFIG.AMENDMENT;
      if (!moduleConfig) return;
      const approverUserId = await resolveFinalRcsApproverUserId(
        detail,
        resourceId,
        moduleName,
        moduleConfig.rcsFinalSequence,
      );
      if (approverUserId) {
        const societyRegId = await resolveModuleSocietyRegistrationId(detail, moduleName);
        const issuedId = await stampAmendmentProposedByelawIfNeeded(
          resourceId,
          approverUserId,
          societyRegId,
        );
        if (issuedId) {
          const media = await Media.findByPk(issuedId, { attributes: ['id', 'url'] });
          detail.new_proposed_byelaw_media_id = issuedId;
          if (media) detail.newProposedByelawMedia = media.toJSON();
        }
      }
    }
  } catch (err) {
    logger.warn('ensureStampedByeLawsMediaForApprovedDetail failed', {
      resourceId,
      moduleName,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (detail?.byeLawsMedia?.id) {
    // After final RCS approve, bye_laws column may point at stamped media while include is stale.
    if (detail.bye_laws && String(detail.bye_laws) !== String(detail.byeLawsMedia.id)) {
      const media = await Media.findByPk(String(detail.bye_laws), { attributes: ['id', 'url'] });
      if (media) {
        detail.byeLawsMedia = media.toJSON();
      }
    }
    return;
  }

  const existingByeLaws = detail.bye_laws;
  if (existingByeLaws) {
    const media = await Media.findByPk(String(existingByeLaws), { attributes: ['id', 'url'] });
    if (media) {
      detail.byeLawsMedia = media.toJSON();
    }
    return;
  }

  let mediaId: string | null = null;
  let url: string | undefined;

  for (const docKey of BYE_LAW_WORKFLOW_DOCUMENT_KEYS) {
    const fromMerged = Array.isArray(detail.previousCommentDocuments)
      ? detail.previousCommentDocuments.find((d: { key?: string }) => d.key === docKey)
      : null;
    if (fromMerged?.mediaId) {
      mediaId = fromMerged.mediaId;
      url = fromMerged.url;
      break;
    }
  }

  if (!mediaId) {
    try {
      const mergedDocs = await getLatestCommentDocuments(resourceId, moduleName);
      mediaId = findByeLawsMediaIdInMergedDocuments(mergedDocs);
      if (mediaId) {
        url = mergedDocs.find((d) => d.mediaId === mediaId)?.url;
      }
    } catch (err) {
      logger.warn('resolveAndAttachByeLawsMediaForDetail: getLatestCommentDocuments failed', {
        resourceId,
        moduleName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!mediaId) {
    mediaId = await findJtRcsByeLawsMediaId(resourceId, moduleName);
  }

  if (!mediaId) return;

  if (!url) {
    const media = await Media.findByPk(mediaId, { attributes: ['id', 'url'] });
    if (!media) return;
    detail.bye_laws = mediaId;
    detail.byeLawsMedia = media.toJSON();
  } else {
    detail.bye_laws = mediaId;
    detail.byeLawsMedia = { id: mediaId, url };
  }

  try {
    await backfillModuleByeLawsColumn(moduleName, resourceId, mediaId);
  } catch (err) {
    logger.warn('Failed to backfill bye_laws column from workflow media', {
      resourceId,
      moduleName,
      mediaId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

/** JT RCS steps whose uploads are signed on final RCS approval. `other_documents` on these steps is skipped. */
const LIQUIDATION_JT_RCS_SIGN_SEQUENCES: Record<string, number[]> = {
  LIQUIDATION: [7, 9, 13, 15, 19],
  LIQUIDATION_RCS: [3, 5, 8, 10, 14, 16, 20],
};

/**
 * Officers complete `next`, while the activity stores the previous `current` sequence.
 * A JT upload is therefore recorded either on the JT sequence or on the step before it.
 */
export const liquidationJtStepForRecordedSequence = (
  recordedSequence: number,
  jtSequences: readonly number[],
): number | null => {
  if (!Number.isFinite(recordedSequence)) return null;
  if (jtSequences.includes(recordedSequence)) return recordedSequence;
  const completedNextStep = recordedSequence + 1;
  if (jtSequences.includes(completedNextStep)) return completedNextStep;
  return null;
};

const SKIPPED_FINAL_SIGNATURE_DOCUMENT_KEYS = new Set(['other_documents']);
const LIQUIDATOR_OBSERVATIONS_DOCUMENT_KEY = 'liquidator_appointment_observations';

export type LiquidationSignedDocument = {
  key: string;
  sequence: number;
  sourceMediaId: string;
  issuedMediaId: string;
  stamped: boolean;
};

const parseActivityPayload = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

/**
 * On final RCS approval, stamp every JT RCS upload from the listed steps except `other_documents`.
 * Observations and rcs_observations that were already signed are stored as-is.
 */
export const issueLiquidationJtUploadsOnFinalApproval = async (params: {
  moduleName: string;
  resourceId: string;
  approverUserId: string;
  societyRegistrationId?: string | null;
  existingObservationsMediaId?: string | null;
  existingByeLawsMediaId?: string | null;
}): Promise<LiquidationSignedDocument[]> => {
  const sequences = LIQUIDATION_JT_RCS_SIGN_SEQUENCES[params.moduleName];
  if (!sequences?.length) return [];

  const activities = await Activity.findAll({
    where: { reference_id: params.resourceId },
    order: [['created_at', 'ASC']],
  });

  const latestBySequence = new Map<number, Record<string, unknown>>();
  for (const activity of activities) {
    const data = parseActivityPayload((activity as { data?: unknown }).data);
    if (!moduleNameMatchesActivity(params.moduleName, data.moduleName)) continue;
    if (String(data.action || '') !== 'approve') continue;
    const jtStep = liquidationJtStepForRecordedSequence(Number(data.workflowSequence), sequences);
    if (jtStep == null) continue;
    latestBySequence.set(jtStep, data);
  }

  const signed: LiquidationSignedDocument[] = [];
  const issuedBySource = new Map<string, { issuedMediaId: string; stamped: boolean }>();
  let byeLawsIssuedId = params.existingByeLawsMediaId?.trim() || null;

  for (const sequence of sequences) {
    const data = latestBySequence.get(sequence);
    if (!data?.documents) continue;

    for (const { key, mediaId } of extractDocumentMediaIds(data.documents)) {
      const sourceMediaId = mediaId?.trim();
      if (!sourceMediaId || SKIPPED_FINAL_SIGNATURE_DOCUMENT_KEYS.has(key)) continue;

      const existingObservationsMediaId = params.existingObservationsMediaId?.trim() || null;
      if (
        key === LIQUIDATOR_OBSERVATIONS_DOCUMENT_KEY &&
        existingObservationsMediaId &&
        existingObservationsMediaId !== sourceMediaId
      ) {
        signed.push({
          key,
          sequence,
          sourceMediaId,
          issuedMediaId: existingObservationsMediaId,
          stamped: true,
        });
        continue;
      }

      if (
        (key === 'rcs_observations' || key === 'bye_laws') &&
        byeLawsIssuedId &&
        byeLawsIssuedId !== sourceMediaId
      ) {
        signed.push({
          key,
          sequence,
          sourceMediaId,
          issuedMediaId: byeLawsIssuedId,
          stamped: true,
        });
        continue;
      }

      const cached = issuedBySource.get(sourceMediaId);
      if (cached) {
        signed.push({ key, sequence, sourceMediaId, ...cached });
        continue;
      }

      const issuance = await issueModuleByeLawDocument(
        sourceMediaId,
        params.approverUserId,
        params.societyRegistrationId,
      );
      const issuedMediaId = issuance?.issuedMediaId || sourceMediaId;
      const stamped = Boolean(issuance?.stamped);
      issuedBySource.set(sourceMediaId, { issuedMediaId, stamped });
      if ((key === 'rcs_observations' || key === 'bye_laws') && stamped) {
        byeLawsIssuedId = issuedMediaId;
      }
      signed.push({ key, sequence, sourceMediaId, issuedMediaId, stamped });
    }
  }

  return signed;
};
