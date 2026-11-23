import { createHash } from 'crypto';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import logger from '../utils/logger';
import { IMediaUploadData } from './MediaService';
import {
  drawCertificateStyleWatermark,
  loadCertificateWatermarkImage,
  resolveWatermarkPath,
} from '../utils/pdfWatermark';

interface ICertificateStampOptions {
  /** Society registration UUID. */
  societyRegistrationId?: string | null;
  /** Media row UUID for the certificate (used in public download URL embedded in QR). */
  mediaId?: string;
  /** Type of certificate: 'registration' | 'conversion' | 'amendment' etc. */
  certificateType?: string;
  uploadedByUserId: string;
  uploadedByName?: string;
  /** Optional pre-built public download URL to embed in the QR. If absent, a JSON payload is used. */
  qrDownloadUrl?: string;
}

const getBase64FromDataUrl = (dataUrl: string): string => {
  const splitIndex = dataUrl.indexOf(',');
  if (splitIndex === -1) return '';
  return dataUrl.slice(splitIndex + 1);
};

/**
 * Overlays verification QR (top-right) on certificate/notification PDFs.
 * For registration/conversion certificates and notifications: also draws
 * arunachal.png logo at top-left (same size as QR). Watermark is skipped for
 * those types; other types (e.g. amendment) still get the watermark.
 */
export const stampCertificatePdfWithQr = async (
  fileData: IMediaUploadData,
  options: ICertificateStampOptions
): Promise<IMediaUploadData> => {
  if (fileData.mimetype !== 'application/pdf') {
    return fileData;
  }

  const certificateType = (options.certificateType || 'registration').toLowerCase();
  const isRegistrationOrNotificationDoc =
    certificateType === 'registration' ||
    certificateType === 'notification' ||
    certificateType === 'conversion' ||
    certificateType === 'conversion-notification';
  const skipWatermark = isRegistrationOrNotificationDoc;

  const originalHash = createHash('sha256').update(fileData.buffer).digest('hex');
  const isNotification =
    certificateType === 'notification' || certificateType === 'conversion-notification';
  const qrPayload =
    options.qrDownloadUrl ||
    JSON.stringify({
      documentType: isNotification ? 'NOTIFICATION' : 'CERTIFICATE',
      certificateType,
      societyRegistrationId: options.societyRegistrationId ?? null,
      mediaId: options.mediaId ?? null,
      uploadedByUserId: options.uploadedByUserId,
      uploadedByName: options.uploadedByName || null,
      uploadedAt: new Date().toISOString(),
      hash: originalHash
    });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256
  });

  const qrBase64 = getBase64FromDataUrl(qrDataUrl);
  if (!qrBase64) {
    throw new Error('Failed to generate QR code for certificate PDF');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(fileData.buffer, { ignoreEncryption: true });
  } catch (err: any) {
    logger.warn('Certificate QR stamp skipped: failed to load PDF', { error: err?.message });
    return fileData;
  }

  const pages = pdfDoc.getPages();
  const watermarkPath = resolveWatermarkPath(__dirname);
  const certificateWatermark = skipWatermark
    ? null
    : await loadCertificateWatermarkImage(pdfDoc, watermarkPath);
  const cornerLogo = isRegistrationOrNotificationDoc
    ? await loadCertificateWatermarkImage(pdfDoc, watermarkPath)
    : null;
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    if (!page) continue;

    if (certificateWatermark) {
      drawCertificateStyleWatermark(page, certificateWatermark);
    }

    const { width, height } = page.getSize();
    // Same size for QR (top-right) and logo (top-left).
    const stampSize = Math.min(76, Math.max(44, Math.floor(Math.min(width, height) * 0.12) - 20));
    const stampY = height - stampSize - 20;

    if (cornerLogo) {
      const logoX = 20;
      page.drawRectangle({
        x: logoX - 4,
        y: stampY - 4,
        width: stampSize + 8,
        height: stampSize + 8,
        color: rgb(1, 1, 1),
        opacity: 0.9
      });
      page.drawImage(cornerLogo, {
        x: logoX,
        y: stampY,
        width: stampSize,
        height: stampSize
      });
    }

    const qrX = width - stampSize - 20;

    // White patch under QR to improve readability over borders/watermarks.
    page.drawRectangle({
      x: qrX - 4,
      y: stampY - 4,
      width: stampSize + 8,
      height: stampSize + 8,
      color: rgb(1, 1, 1),
      opacity: 0.9
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: stampY,
      width: stampSize,
      height: stampSize
    });
  }

  const updatedBytes = await pdfDoc.save();
  return {
    ...fileData,
    buffer: Buffer.from(updatedBytes),
    size: updatedBytes.length
  };
};
