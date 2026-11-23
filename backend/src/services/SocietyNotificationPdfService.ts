import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import axios from 'axios';
import numberToWords from 'number-to-words';
import { getAreaOfOperationLevelById } from './AreaOfOperationLevelService';
import {
  buildAreaOfOperationConfinedTo,
} from '../utils/societyAddress';
export interface ISocietyNotificationPdfData {
  notificationNumber: string;
  issuedPlace?: string; // e.g. "Naharlagun"
  issuedDate: Date;
  actName?: string; // e.g. "Arunachal Pradesh Cooperative Societies Act, 1978 (Act 3 of 1979)"
  section?: string; // e.g. "9"
  is_conversion?: boolean; // default: false
  societyName: string;
  registrationNumber?: string;
  createdDate?: Date;
  /** society_registrations.full_address — used directly in notification address text */
  address?: string;
  /** Society `district_id` — resolved to district name in the PDF body via `getDistrictById` */
  district?: string;
  state?: string;
  pincode?: string;
  societyTypeLine?: string; // e.g. "MULTIPURPOSE COOPERATIVE SOCIETY LTD"
  validityUpto?: string; // dd/mm/yyyy
  /** Resolved display text, or pass area_of_operation_id to load from master table */
  areaOfOperation?: string;
  /** society_registrations.village_code (Block/Village area of operation) */
  village_code?: string;
  /** From districts_blocks_gp_villages (Block/Village area of operation) */
  village_name?: string;
  /** Selected block name (Block Level area of operation) */
  blockName?: string | null;
  /** Pre-built "confined to …" phrase */
  areaOfOperationConfinedTo?: string;
  /** society_registrations.area_of_operation_id → area_of_operation_levels.id */
  area_of_operation_id?: string | null;
  signedByName?: string; // e.g. "Cheechung Chukhu, APCS(AG)"
  signedBySignatureUrl?: string | null; // media url (remote or /uploads/*)
  signedByDesignationLines?: string[]; // multi-lines under signature
  memoCopyToLines?: string[]; // numbered list
  memoCopyToConversion?: string[]; // numbered list for conversion (if different from memoCopyToLines)
  conversionFromSocietyName?: string;
  conversionToSocietyName?: string;
  /** Complete address of the society after conversion. Clause 3 prints this for the re-allotted society. */
  conversionToAddress?: string;
  originalRegistrationDate?: Date | string;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? 'th'}`;
}

export function formatDateAsDayOrdinalMonthYear(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === 'day')?.value || '0');
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const dayOrdinal = getOrdinal(day);

  return `${dayOrdinal} ${month}, ${year}.`;
}

export function formatDateInWords(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  // Use IST date parts so issuance docs match India clock (server may be UTC).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === 'day')?.value || '0');
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = Number(parts.find((p) => p.type === 'year')?.value || '0');

  const dayOrdinal: string = getOrdinal(day);

  const yearInWords: string = numberToWords
    .toWords(year)
    .replace(/-/g, ' ')
    .replace(/,/g, '')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return `${dayOrdinal} day of ${month} of the year ${yearInWords}`;
}

export const formatDateWithOrdinal = (d: Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(d);
  const day = Number(parts.find((p) => p.type === 'day')?.value || '0');
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
      day % 10 === 2 && day !== 12 ? 'nd' :
        day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${month}/ ${year}`;
};

/** Issued date and time for certificate / notification signature blocks (IST). */
export const formatIssuedDateTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
};

const formatDdMmYyyy = (d: Date): string => d.toLocaleDateString('en-GB');

const formatDateDdMmYyyy = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const buildConversionShortLocation = (
  villageName: string | undefined,
  fullAddress: string
): string => {
  if (villageName?.trim()) return `${villageName.trim()}`;
  const trimmed = String(fullAddress || '').trim();
  if (!trimmed || trimmed === 'N/A') return 'N/A,';
  const first = trimmed.split(',')[0]?.trim();
  return first ? `${first}` : `${trimmed}`;
};

const buildConversionFullLocation = (
  fullAddress: string,
  districtName: string,
  stateName: string,
  pincode?: string | number | null
): string => {
  const trimmed = String(fullAddress || '').trim();
  if (trimmed && /district/i.test(trimmed) && /pin/i.test(trimmed)) {
    return trimmed;
  }
  const parts: string[] = [];
  if (trimmed && trimmed !== 'N/A') parts.push(trimmed);
  if (districtName?.trim()) parts.push(`${districtName.trim()} District`);
  if (stateName?.trim()) parts.push(stateName.trim());
  if (pincode != null && String(pincode).trim()) {
    parts.push(`PIN - ${String(pincode).trim()}`);
  }
  return parts.length ? parts.join(', ') : 'N/A';
};

/** Fixed width for "1." … "3." so wrapped lines share one vertical text edge (original layout). */
const CONVERSION_CLAUSE_NUMBER_COL_WIDTH = 26;
/** One tab before each numbered conversion clause (matches original notification). */
const CONVERSION_CLAUSE_TAB_WIDTH = 28;

/**
 * Numbered conversion clause with hanging indent — number at left margin,
 * body left-aligned (not justify), continuation lines align under body text.
 */
const drawConversionNumberedClause = (
  doc: PDFKit.PDFDocument,
  number: number,
  text: string,
  contentX: number,
  contentWidth: number,
  options?: { isFirst?: boolean }
): void => {
  doc.font('Helvetica').fontSize(12);
  const tabOffset = CONVERSION_CLAUSE_TAB_WIDTH;
  const rowX = contentX + tabOffset;
  const rowContentWidth = contentWidth - tabOffset;
  const bodyX = rowX + CONVERSION_CLAUSE_NUMBER_COL_WIDTH;
  const bodyWidth = rowContentWidth - CONVERSION_CLAUSE_NUMBER_COL_WIDTH;

  doc.moveDown(options?.isFirst ? 0.75 : 0.55);

  const rowY = doc.y;
  const numberLabel = `${number}.`;
  const bodyHeight = doc.heightOfString(text, {
    width: bodyWidth,
    align: 'left',
    lineGap: 2
  });

  doc.text(numberLabel, rowX, rowY, {
    width: CONVERSION_CLAUSE_NUMBER_COL_WIDTH,
    align: 'left',
    lineBreak: false
  });
  doc.text(text, bodyX, rowY, {
    width: bodyWidth,
    align: 'left',
    lineGap: 2
  });

  doc.y = rowY + bodyHeight;
};

const buildNotificationDatedLabel = (issuedPlace: string, issuedDate: Date): string =>
  `Dated ${issuedPlace}, the ${formatDateWithOrdinal(issuedDate)}`;

/** Memo No. (left), then Copy to list. */
const drawMemoCopyToBlock = (
  doc: PDFKit.PDFDocument,
  params: {
    notificationNumber: string;
    memoLines: string[];
    issuedPlace: string;
    issuedDate: Date;
    contentX: number;
    contentWidth: number;
    pageWidth: number;
    /** Use same gutter as conversion clauses 1–3 for aligned Copy-to list */
    listNumberColumnWidth?: number;
  }
): void => {
  const {
    notificationNumber,
    memoLines,
    contentX,
    contentWidth,
    listNumberColumnWidth
  } = params;
  if (!memoLines.length) return;

  doc.moveDown(1.0);
  const memoRowY = doc.y;
  const memoRowLineHeight = doc.currentLineHeight(true);

  doc.font('Helvetica').fontSize(12);
  doc.text(`Memo No.${notificationNumber.replace(/^NO\./i, '')}`, contentX, memoRowY, {
    lineBreak: false
  });
  doc.y = memoRowY + memoRowLineHeight;

  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(12);
  doc.text('Copy to :-', contentX, doc.y, { width: contentWidth, align: 'left' });

  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(12);
  const listLabelWidth =
    listNumberColumnWidth ??
    doc.widthOfString(`${memoLines.length}. `) + 4;
  const listTextX = contentX + listLabelWidth;
  const listTextWidth = contentWidth - listLabelWidth;

  memoLines.forEach((line, idx) => {
    const extraTopGap = /^\s*General\s+correspondence\s+files\s+of\b/i.test(line) ? 11 : 0;

    // Keep the label and its content aligned (avoid splitting across lines/pages).
    const bottomMargin = doc.page.margins.bottom ?? 40;
    const availableBottomY = doc.page.height - bottomMargin;
    const estimatedHeight =
      extraTopGap +
      doc.heightOfString(line, {
        width: listTextWidth,
        align: 'justify',
        lineGap: 1
      });

    if (doc.y + estimatedHeight > availableBottomY) {
      doc.addPage();
    }

    if (extraTopGap) doc.y += extraTopGap;

    const rowY = doc.y;
    doc.text(`${idx + 1}.`, contentX, rowY, { lineBreak: false });
    doc.text(line, listTextX, rowY, {
      width: listTextWidth,
      align: 'justify',
      lineGap: 1
    });
  });
};

const resolveSignatureImageSource = async (
  signatureUrl: string
): Promise<string | Buffer | null> => {
  try {
    const isRemote = /^https?:\/\//i.test(signatureUrl);
    const projectUploadsDir = path.resolve(process.cwd(), 'uploads');

    if (isRemote) {
      const response = await axios.get<ArrayBuffer>(signatureUrl, {
        responseType: 'arraybuffer',
        timeout: 5000
      });
      return Buffer.from(response.data);
    }

    // Local: accept "/uploads/xyz.png" or "uploads/xyz.png" or absolute
    if (path.isAbsolute(signatureUrl) && fs.existsSync(signatureUrl)) return signatureUrl;

    const basename = path.basename(signatureUrl);
    const localPath = path.join(projectUploadsDir, basename);
    if (fs.existsSync(localPath)) return localPath;

    return null;
  } catch (err: any) {
    logger.warn(`Unable to load notification signature image: ${err?.message || 'unknown error'}`);
    return null;
  }
};

export const generateSocietyRegistrationNotificationPdf = async (
  data: ISocietyNotificationPdfData
): Promise<Buffer> => {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: 40, bottom: 40, left: 55, right: 55 },
      autoFirstPage: true,
      bufferPages: false
    });

    // Reserve vertical space on page 2 for conversion notifications so that the later
    // QR-stamp overlay (top-right, same size as other pages) doesn't overlap text.
    let pageNumber = 1;
    doc.on('pageAdded', () => {
      pageNumber += 1;
      if (data.is_conversion && pageNumber === 2) {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const top = doc.page.margins.top ?? 40;

        // Mirror qrSize calculation used during stamping.
        const reservedQrSize = Math.min(
          76,
          Math.max(44, Math.floor(Math.min(pageWidth, pageHeight) * 0.12) - 20)
        );

        // Mirror the QR's top offset (20) plus a small padding.
        const reservedPadding = 10;
        doc.y = top + reservedQrSize + 20 + reservedPadding;
      }
    });

    const filename = `notification_${uuidv4()}.pdf`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;
    const contentPaddingX = 5; // requested left/right padding for body content
    const contentX = (doc.page.margins.left ?? 0) + contentPaddingX;
    const contentWidth =
      pageWidth - (doc.page.margins.left ?? 0) - (doc.page.margins.right ?? 0) - (contentPaddingX * 2);

    // Header
    doc.font('Helvetica-Bold').fontSize(12).text('GOVERNMENT OF ARUNACHAL PRADESH', 0, 40, {
      width: pageWidth,
      align: 'center'
    });
    doc.fontSize(11).text('OFFICE OF THE REGISTRAR OF COOPERATIVE SOCIETIES', {
      width: pageWidth,
      align: 'center'
    });
    doc.fontSize(10).text('SAHKARITA BHAWAN, D-SECTOR', { width: pageWidth, align: 'center' });
    doc.fontSize(10).text('NAHARLAGUN-791110', { width: pageWidth, align: 'center' });

    // Title
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(11).text('N O T I F I C A T I O N', { width: pageWidth, align: 'center', underline: true });

    doc.moveDown(1.2);

    // Number + date line
    const issuedPlace = data.issuedPlace || 'Naharlagun';
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(data.notificationNumber, 55, doc.y, { continued: true });
    doc.font('Helvetica').text('', { continued: false });
    doc.font('Helvetica-Bold').text(buildNotificationDatedLabel(issuedPlace, data.issuedDate), 0, doc.y, {
      width: pageWidth - 55,
      align: 'right'
    });

    doc.moveDown(1.2);

    // Calculate validity period (3 years from creation date)
    const creationDate = data.createdDate ? new Date(data.createdDate) : new Date();
    const validityDate = new Date(creationDate);
    validityDate.setFullYear(validityDate.getFullYear() + 3);
    validityDate.setDate(validityDate.getDate() - 1);
    const validityPeriod = validityDate.toLocaleDateString('en-GB');

    const { getDistrictById } = await import('./DistrictService');
    const districtId = data.district;
    const district = districtId ? await getDistrictById(districtId) : null;
    const { getStateById } = await import('./StateService');
    const stateId = data.state;
    const state = stateId ? await getStateById(stateId) : null;
    const districtName = district?.name || data.district || '';
    const stateName = state?.name || data.state || '';
    const societyAddress = String(data.address ?? '').trim() || 'N/A';

    // Same pattern as district/state: resolve society_registrations.area_of_operation_id → area_of_operation_levels
    // const areaOfOperationId =
    //   data.area_of_operation_id ||
    //   (data.areaOfOperation && UUID_LIKE.test(String(data.areaOfOperation).trim())
    //     ? String(data.areaOfOperation).trim()
    //     : null);
    const areaOfOperationLevelRaw = data.area_of_operation_id
      ? await getAreaOfOperationLevelById(data.area_of_operation_id).catch((err: unknown) => {
          logger.warn('Area of operation level not found for notification PDF', {
            area_of_operation_id: data.area_of_operation_id,
            error: err instanceof Error ? err.message : String(err)
          });
          return null;
        })
      : null;
    const areaOfOperationConfinedTo =
      data.areaOfOperationConfinedTo?.trim() ||
      buildAreaOfOperationConfinedTo({
        districtName,
        stateName,
        village_name: data.village_name,
        blockName: data.blockName,
        areaOfOperationLevelName: areaOfOperationLevelRaw?.name
      });
    // const areaOfOperationName = formatAreaOfOperationLevelDisplay(areaOfOperationLevel);
    // const areaOfOperationFromText =
    //   data.areaOfOperation && !UUID_LIKE.test(String(data.areaOfOperation).trim())
    //     ? String(data.areaOfOperation).trim()
    //     : '';
    // const areaOfOperationText =
    //   areaOfOperationName ||
    //   areaOfOperationFromText ||
    //   (districtName && stateName
    //     ? `${districtName} of ${stateName}`
    //     : districtName || stateName || 'N/A');

    // Body
    // Use the same effective date as header "Dated ...": issuedDate (driven by updated_at from caller).
    const formatedDate: string = formatDateInWords(data.issuedDate);
    const validity_year = "3 Year"
    const act = data.actName || 'Arunachal Pradesh Cooperative Societies Act, 1978 (Act 3 of 1979)';
    const section = data.section || '9';
    if (data.is_conversion) {
      const fromLabel = (
        data.conversionFromSocietyName || data.societyName || 'N/A'
      ).toUpperCase();
      const toLabel = (
        data.conversionToSocietyName || data.societyName || 'N/A'
      ).toUpperCase();
      const shortLocation = buildConversionShortLocation(data.village_name, societyAddress);
      const fullLocation = buildConversionFullLocation(
        societyAddress,
        districtName,
        stateName,
        data.pincode
      );
      const previousLocation = `${shortLocation} ${fullLocation}`.trim();
      const convertedAddress = String(data.conversionToAddress || '').trim();
      const convertedLocation = convertedAddress || previousLocation;
      const originalRegDateSource =
        data.originalRegistrationDate ?? data.createdDate ?? data.issuedDate;
      const originalRegDateFormatted = originalRegDateSource
        ? formatDateDdMmYyyy(originalRegDateSource)
        : formatDateDdMmYyyy(data.issuedDate);
      const registrationNo = String(data.registrationNumber || 'N/A').trim();

      doc.font('Helvetica').fontSize(12);
      doc.text(
        `Under Section 17 of the ${act} , read with sub_rule(7) of the Rule 16 of Arunachal Pradesh Cooperative Societies Rules 1982, I, ${data.signedByName ? data.signedByName : ''}, Registrar of Cooperative Societies, ${stateName}, Naharlagun hereby give effect to the decision of conversion of "${fromLabel}", ${shortLocation}, as per resolution adopted in Special General Body Meeting held on ${formatDateWithOrdinal(data.issuedDate)} for conversion of the aforesaid Cooperative Society under the name and style "${toLabel}", ${shortLocation} and registered in this office under section 9 of ${act} and numbered as ${registrationNo}, on the  ${formatedDate} Anno Domini.`,
        contentX,
        doc.y,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 2
        }
      );

      drawConversionNumberedClause(
        doc,
        1,
        `The Bye-laws of "${toLabel}", ${shortLocation} as adopted by the society have also been registered.`,
        contentX,
        contentWidth,
        { isFirst: true }
      );

      drawConversionNumberedClause(
        doc,
        2,
        `All assets and liabilities of "${fromLabel}", ${shortLocation} shall be taken over by the "${toLabel}", ${shortLocation}.`,
        contentX,
        contentWidth
      );

      drawConversionNumberedClause(
        doc,
        3,
        `The Registration of "${fromLabel}", ${previousLocation} bearing No. ${registrationNo}, dated ${originalRegDateFormatted} stands cancelled forthwith and instead the aforesaid number is re-allotted to "${toLabel}", ${convertedLocation}.`,
        contentX,
        contentWidth
      );

      doc.moveDown(0.5);

      doc.font('Helvetica').text(`Sd/-${data.signedByName ? data.signedByName : ''}`, { align: 'right' });
      const designationLines = data.signedByDesignationLines?.length
        ? data.signedByDesignationLines
        : ['Registrar', 'Cooperative Societies,'];
      doc.font('Helvetica-Bold').fontSize(9.5);
      for (const line of designationLines) {
        doc.text(line, { align: 'right' });
      }
      const designationIssuedDateTime = formatIssuedDateTime(data.issuedDate);
      if (designationIssuedDateTime) {
        doc.font('Helvetica').fontSize(9.5).text(designationIssuedDateTime, { align: 'right' });
      }

      drawMemoCopyToBlock(doc, {
        notificationNumber: data.notificationNumber,
        memoLines: data.memoCopyToConversion?.length ? data.memoCopyToConversion : [],
        issuedPlace,
        issuedDate: data.issuedDate,
        contentX,
        contentWidth,
        pageWidth,
        listNumberColumnWidth: CONVERSION_CLAUSE_NUMBER_COL_WIDTH
      });

      // Signature block
      doc.moveDown(1.2);
      const signatureImage = data.signedBySignatureUrl
        ? await resolveSignatureImageSource(data.signedBySignatureUrl)
        : null;

      // Place signature image (if available) above "Sd/-"
      if (signatureImage) {
        const imgWidth = 110;
        const imgHeight = 45;
        const x = pageWidth - 55 - imgWidth;
        const y = doc.y;
        try {
          doc.image(signatureImage, x, y, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
          doc.moveDown(2.8);
        } catch (imgErr: any) {
          logger.warn(`Failed to render signature image in notification PDF: ${imgErr?.message || 'unknown error'}`);
        }
      }

      doc.font('Helvetica-Bold').text(`REGISTRAR`,{ align: 'right' });
      // doc.font('Helvetica').text(`Sd/-${data.signedByName ? data.signedByName : ''}`, { align: 'right' });
      // const designationLines = data.signedByDesignationLines?.length
      //   ? data.signedByDesignationLines
      //   : ['Registrar', 'Cooperative Societies,', 'Arunachal Pradesh, Naharlagun'];
      // doc.font('Helvetica-Bold').fontSize(9.5);
      // for (const line of designationLines) {
      //   doc.text(line, { align: 'right' });
      // }

      doc.end();

    } else {

      const societyNameUpper = String(data.societyName ?? '').trim().toUpperCase();
      const quotedSocietyName = `"${societyNameUpper}"`;

      doc.font('Helvetica').fontSize(12);
      doc.text(`\nUnder Section 9 of the ${act} , a Cooperative Society under the name and style ${quotedSocietyName} ${societyAddress} has been registered in this office and numbered as ${data.registrationNumber} on this ${formatedDate} Anno Domini. The validity of the Registration is upto ${validityPeriod}. The area of operation of the society shall be confined to ${areaOfOperationConfinedTo}.`, contentX, doc.y, {
        width: contentWidth,
        align: 'justify',
        lineGap: 2,
        indent: 200
      });

      doc.fontSize(12)
        .font('Helvetica')
        .text(
          '\nThe Bye-laws adopted by the society have also been registered.',
          contentX,
          doc.y,
          {
            width: contentWidth,
            align: 'justify',
            indent: 150
          }
        );

      if (data.societyTypeLine) {
        doc.font('Helvetica-Bold').text(`${data.societyTypeLine}`, contentX, doc.y, { width: contentWidth, align: 'left' });
        doc.font('Helvetica');
      }

      // Dynamic fields block (requested)
      // doc.moveDown(0.6);
      // doc.font('Helvetica-Bold').fontSize(10).text('Society Details:', contentX, doc.y, { width: contentWidth, align: 'left' });
      // doc.font('Helvetica').fontSize(10);
      // if (data.registrationNumber) doc.text(`Registration Number: ${data.registrationNumber}`, contentX, doc.y, { width: contentWidth, align: 'left' });
      // if (data.createdDate) doc.text(`Created Date: ${formatDdMmYyyy(data.createdDate)}`, contentX, doc.y, { width: contentWidth, align: 'left' });
      // if (data.state) doc.text(`State: ${data.state}`, contentX, doc.y, { width: contentWidth, align: 'left' });
      // if (data.district) doc.text(`District: ${data.district}`, contentX, doc.y, { width: contentWidth, align: 'left' });

      doc.moveDown(0.4);

      if (data.validityUpto) {
        doc.text(`The validity of the Registration is upto ${data.validityUpto}.`, contentX, doc.y, { width: contentWidth, align: 'justify' });
      }
      // if (data.areaOfOperation) {
      //   doc.text(`The area of operation of the society shall be confined to ${data.areaOfOperation}.`, contentX, doc.y, { width: contentWidth, align: 'justify' });
      // }

      // doc.moveDown(0.6);
      // doc.text('The Bye-laws adopted by the society have been registered.', contentX, doc.y, { width: contentWidth, align: 'left' });

       doc.font('Helvetica').text(`Sd/-${data.signedByName ? data.signedByName : ''}`, { align: 'right' });
      const designationLines = data.signedByDesignationLines?.length
        ? data.signedByDesignationLines
        : ['Registrar', 'Cooperative Societies,'];
      doc.font('Helvetica-Bold').fontSize(9.5);
      for (const line of designationLines) {
        doc.text(line, { align: 'right' });
      }
      const designationIssuedDateTime = formatIssuedDateTime(data.issuedDate);
      if (designationIssuedDateTime) {
        doc.font('Helvetica').fontSize(9.5).text(designationIssuedDateTime, { align: 'right' });
      }

      drawMemoCopyToBlock(doc, {
        notificationNumber: data.notificationNumber,
        memoLines: data.memoCopyToLines?.length ? data.memoCopyToLines : [],
        issuedPlace,
        issuedDate: data.issuedDate,
        contentX,
        contentWidth,
        pageWidth
      });

      // Signature block
      doc.moveDown(1.2);
      const signatureImage = data.signedBySignatureUrl
        ? await resolveSignatureImageSource(data.signedBySignatureUrl)
        : null;

      // Place signature image (if available) above "Sd/-"
      if (signatureImage) {
        const imgWidth = 110;
        const imgHeight = 45;
        const x = pageWidth - 55 - imgWidth;
        const y = doc.y;
        try {
          doc.image(signatureImage, x, y, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
          doc.moveDown(2.8);
        } catch (imgErr: any) {
          logger.warn(`Failed to render signature image in notification PDF: ${imgErr?.message || 'unknown error'}`);
        }
      }

      doc.font('Helvetica-Bold').text(`REGISTRAR`,{ align: 'right' });
      // doc.font('Helvetica').text(`Sd/-${data.signedByName ? data.signedByName : ''}`, { align: 'right' });
      // const designationLines = data.signedByDesignationLines?.length
      //   ? data.signedByDesignationLines
      //   : ['Registrar', 'Cooperative Societies,', 'Arunachal Pradesh, Naharlagun'];
      // doc.font('Helvetica-Bold').fontSize(9.5);
      // for (const line of designationLines) {
      //   doc.text(line, { align: 'right' });
      // }

      doc.end();
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    const pdfBuffer = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);
    return pdfBuffer;
  } catch (error) {
    logger.error('Error generating society notification PDF:', error);
    throw error;
  }
};

