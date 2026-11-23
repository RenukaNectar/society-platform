import { PDFDocument } from 'pdf-lib';

export type PdfSourceMimetype = 'application/pdf' | 'image/png' | 'image/jpeg';

/**
 * Content-type from magic bytes. Callers often hardcode `application/pdf` on the
 * upload payload, so the declared mimetype cannot be trusted for stamping.
 */
export const detectPdfSourceMimetype = (buffer: Buffer): PdfSourceMimetype | null => {
  if (!buffer || buffer.length < 3) return null;

  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('utf8') === '%PDF-') {
    return 'application/pdf';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
};

/** Wrap a scanned/photographed document image in a single A4 page so stamping can run. */
export const wrapImageBufferAsPdf = async (
  buffer: Buffer,
  mimetype: 'image/png' | 'image/jpeg'
): Promise<Buffer> => {
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

/** Returns PDF bytes for a PDF or image buffer, or null when the content is neither. */
export const ensurePdfBuffer = async (buffer: Buffer): Promise<Buffer | null> => {
  const detected = detectPdfSourceMimetype(buffer);
  if (!detected) return null;
  if (detected === 'application/pdf') return buffer;
  return wrapImageBufferAsPdf(buffer, detected);
};

export const toPdfFilename = (filename: string): string =>
  /\.pdf$/i.test(filename) ? filename : `${filename.replace(/\.[^./\\]+$/, '')}.pdf`;
