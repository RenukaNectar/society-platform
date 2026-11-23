import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFImage, PDFPage } from 'pdf-lib';
import logger from './logger';

/** Government emblem watermark used on certificates, notifications, and RCS-stamped documents. */
// export const WATERMARK_RELATIVE_PATH = '../../uploads/arunachal.png';
export const WATERMARK_RELATIVE_PATH = '../../uploads/9ee6115d-f2a6-4827-b046-11af5f2e9a41.png'; //logo-filename

export const resolveWatermarkPath = (fromDirname: string): string =>
  path.join(fromDirname, WATERMARK_RELATIVE_PATH);

export const loadCertificateWatermarkImage = async (
  pdfDoc: PDFDocument,
  watermarkPath: string
): Promise<PDFImage | null> => {
  if (!fs.existsSync(watermarkPath)) {
    logger.warn('PDF watermark skipped: file not found', { watermarkPath });
    return null;
  }
  try {
    const bytes = fs.readFileSync(watermarkPath);
    const lower = watermarkPath.toLowerCase();
    if (lower.endsWith('.png')) {
      return await pdfDoc.embedPng(bytes);
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return await pdfDoc.embedJpg(bytes);
    }
    return await pdfDoc.embedPng(bytes);
  } catch (e) {
    logger.warn('PDF watermark embed failed', { watermarkPath, error: e });
    return null;
  }
};

/** 320×250 pt, opacity 0.2, centered; scale down on small pages (matches rcs_observations / bye-law docs). */
export const drawCertificateStyleWatermark = (page: PDFPage, watermarkImage: PDFImage): void => {
  const { width, height } = page.getSize();
  let wmW = 330;
  let wmH = 260;
  if (wmW > width - 40 || wmH > height - 40) {
    const s = Math.min((width - 40) / wmW, (height - 40) / wmH, 1);
    wmW *= s;
    wmH *= s;
  }
  const x = (width - wmW) / 2;
  const y = (height - wmH) / 2;
  page.drawImage(watermarkImage, {
    x,
    y,
    width: wmW,
    height: wmH,
    opacity: 0.15,
  });
};
