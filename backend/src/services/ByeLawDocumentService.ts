import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { PDFDocument, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import logger from '../utils/logger';
import { IMediaUploadData } from './MediaService';
import {
  drawCertificateStyleWatermark,
  loadCertificateWatermarkImage,
  resolveWatermarkPath,
} from '../utils/pdfWatermark';
import { ensurePdfBuffer, toPdfFilename } from '../utils/pdfSourceBuffer';

const DEFAULT_REGISTRAR_DESIGNATION_LINES = [
  'Registrar',
  'Cooperative Societies,'
] as const;

/** Dedicated area appended below each original page for the signatory block. */
const SIGNATURE_FOOTER_HEIGHT = 150;
const SIGNATURE_FOOTER_BOTTOM_PADDING = 14;

interface IByeLawStampOptions {
  /** Society registration UUID when known; omit before first save. */
  societyRegistrationId?: string | null;
  /** Media row UUID (used in public download URL before society exists). */
  mediaId?: string;
  uploadedByUserId: string;
  uploadedByName?: string;
  /** Matches notification/certificate: Sd/- line (registrar full name). */
  signedByName?: string;
  /** Matches notification PDF designation block under signature. */
  signedByDesignationLines?: string[];
  signatureMediaUrl?: string | null;
  qrDownloadUrl?: string;
  /** RCS final approval / issuance timestamp shown on the document and embedded in QR. */
  issuedAt?: Date | string;
}

/** Date + time label for RCS-stamped module documents (IST). */
export const formatRcsDocumentIssuedDateTime = (date: Date = new Date()): string => {
  const normalized = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(normalized.getTime()) ? new Date() : normalized;
  return safeDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const resolveLocalUploadPath = (mediaUrl: string): string => {
  if (!mediaUrl) return '';

  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (path.isAbsolute(mediaUrl) && fs.existsSync(mediaUrl)) {
    return mediaUrl;
  }

  if (mediaUrl.includes('/uploads/') || mediaUrl.includes('\\uploads\\')) {
    return path.join(uploadsDir, path.basename(mediaUrl));
  }

  return path.join(uploadsDir, path.basename(mediaUrl));
};

const getSignatureBytes = (signatureMediaUrl?: string | null): Buffer | null => {
  if (!signatureMediaUrl) return null;

  try {
    const localPath = resolveLocalUploadPath(signatureMediaUrl);
    if (!localPath || !fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  } catch {
    return null;
  }
};

const getBase64FromDataUrl = (dataUrl: string): string => {
  const splitIndex = dataUrl.indexOf(',');
  if (splitIndex === -1) return '';
  return dataUrl.slice(splitIndex + 1);
};

/** Right-aligned block aligned with SocietyNotificationPdfService signature footer. */
const drawNotificationStyleSignatureBlock = (
  page: PDFPage,
  params: {
    signedByName: string;
    designationLines: string[];
    signatureImage: PDFImage | null;
    regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>;
    boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>;
    issuedAtLabel?: string;
    blockBottomY?: number;
  }
): void => {
  const mediaBox = page.getMediaBox();
  const rightMargin = 55;
  const blockRight = mediaBox.x + mediaBox.width - rightMargin;
  const imgWidth = 110;
  const imgHeight = 45;
  const regularSize = 10;
  const boldSize = 9.5;
  const lineGap = 4;

  let y = params.blockBottomY ?? 68;
  const {
    signedByName,
    designationLines,
    signatureImage,
    regularFont,
    boldFont,
    issuedAtLabel
  } = params;

  if (issuedAtLabel) {
    const dateWidth = regularFont.widthOfTextAtSize(issuedAtLabel, regularSize);
    page.drawText(issuedAtLabel, {
      x: blockRight - dateWidth,
      y,
      size: regularSize,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    y += regularSize + lineGap + 4;
  }

  for (let i = designationLines.length - 1; i >= 0; i--) {
    const line = designationLines[i];
    if (!line) continue;
    const textWidth = boldFont.widthOfTextAtSize(line, boldSize);
    page.drawText(line, {
      x: blockRight - textWidth,
      y,
      size: boldSize,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    y += boldSize + lineGap;
  }

  const sdText = `Sd/-${signedByName}`;
  const sdWidth = regularFont.widthOfTextAtSize(sdText, regularSize);
  page.drawText(sdText, {
    x: blockRight - sdWidth,
    y,
    size: regularSize,
    font: regularFont,
    color: rgb(0, 0, 0)
  });
  y += regularSize + 10;

  if (signatureImage) {
    page.drawImage(signatureImage, {
      x: blockRight - imgWidth,
      y,
      width: imgWidth,
      height: imgHeight
    });
  }
};

/**
 * Add blank space below the original page without translating or scaling its content.
 * The original page's upper and content coordinates stay unchanged; only the lower
 * MediaBox/CropBox edge is extended for the signature footer.
 */
const reserveSignatureFooter = (page: PDFPage): number => {
  const mediaBox = page.getMediaBox();
  const cropBox = page.getCropBox();
  const footerBottomY = mediaBox.y - SIGNATURE_FOOTER_HEIGHT;

  page.setMediaBox(
    mediaBox.x,
    footerBottomY,
    mediaBox.width,
    mediaBox.height + SIGNATURE_FOOTER_HEIGHT
  );
  page.setCropBox(
    cropBox.x,
    cropBox.y - SIGNATURE_FOOTER_HEIGHT,
    cropBox.width,
    cropBox.height + SIGNATURE_FOOTER_HEIGHT
  );

  return footerBottomY + SIGNATURE_FOOTER_BOTTOM_PADDING;
};

export const stampByeLawPdfWithQr = async (
  fileData: IMediaUploadData,
  options: IByeLawStampOptions
): Promise<IMediaUploadData> => {
  // Callers hardcode `application/pdf` on the payload, so detect the real type from the
  // bytes and wrap PNG/JPEG uploads into a PDF instead of leaving them unstamped.
  const sourceBuffer = await ensurePdfBuffer(fileData.buffer);
  if (!sourceBuffer) {
    return fileData;
  }

  const originalHash = createHash('sha256').update(sourceBuffer).digest('hex');
  const issuedAt = options.issuedAt ? new Date(options.issuedAt) : new Date();
  const issuedAtIso = Number.isNaN(issuedAt.getTime())
    ? new Date().toISOString()
    : issuedAt.toISOString();
  const issuedAtLabel = options.issuedAt
    ? `Issued on: ${formatRcsDocumentIssuedDateTime(issuedAt)}`
    : undefined;

  const qrPayload = options.qrDownloadUrl || JSON.stringify({
    documentType: 'BYE_LAW',
    societyRegistrationId: options.societyRegistrationId ?? null,
    mediaId: options.mediaId ?? null,
    uploadedByUserId: options.uploadedByUserId,
    uploadedByName: options.uploadedByName || null,
    uploadedAt: issuedAtIso,
    hash: originalHash
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256
  });

  const qrBase64 = getBase64FromDataUrl(qrDataUrl);
  if (!qrBase64) {
    throw new Error('Failed to generate QR code for bye-law PDF');
  }

  const pdfDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const watermarkPath = resolveWatermarkPath(__dirname);
  const certificateWatermark = await loadCertificateWatermarkImage(pdfDoc, watermarkPath);

  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const signatureBytes = getSignatureBytes(options.signatureMediaUrl);
  let signatureImage: PDFImage | null = null;
  if (signatureBytes) {
    const lower = (options.signatureMediaUrl || '').toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      signatureImage = await pdfDoc.embedJpg(signatureBytes);
    } else {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    }
  }

  const signedByName =
    String(options.signedByName ?? options.uploadedByName ?? '').trim();
  const designationLines =
    options.signedByDesignationLines?.length
      ? options.signedByDesignationLines
      : [...DEFAULT_REGISTRAR_DESIGNATION_LINES];

  for (const page of pages) {
    if (certificateWatermark) {
      drawCertificateStyleWatermark(page, certificateWatermark);
    }

    const { width, height } = page.getSize();
    const qrSize = Math.min(76, Math.max(44, Math.floor(Math.min(width, height) * 0.12) - 40));
    const qrX = width - qrSize - 20;
    const qrY = height - qrSize - 20;

    // White patch under QR to improve readability.
    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: rgb(1, 1, 1),
      opacity: 0.9
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize
    });

    const signatureBlockBottomY = reserveSignatureFooter(page);

    // SD-RCS authorized signatory on every page (RCS Observation / bye-law / AGM docs).
    drawNotificationStyleSignatureBlock(page, {
      signedByName,
      designationLines,
      signatureImage,
      regularFont: font,
      boldFont,
      issuedAtLabel,
      blockBottomY: signatureBlockBottomY,
    });
  }

  const updatedBytes = await pdfDoc.save();
  return {
    ...fileData,
    originalname: toPdfFilename(fileData.originalname),
    mimetype: 'application/pdf',
    buffer: Buffer.from(updatedBytes),
    size: updatedBytes.length
  };
};

