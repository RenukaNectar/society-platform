import PDFDocument, { lineGap } from 'pdfkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import path, { dirname } from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import sequelize from '../config/sequelize';
import SocietyRegistration from '../models/SocietyRegistration';
import {
  buildAreaOfOperationConfinedTo,
  getSocietyAddress,
  resolveRegistrationVillageDetails,
  resolveRegistrationVillageName
} from '../utils/societyAddress';
import { mediaUpload, overwriteMediaFileBuffer } from './MediaService';
import { stampCertificatePdfWithQr } from './CertificateDocumentService';
import { height } from 'pdfkit/js/page';
import { formatDateAsDayOrdinalMonthYear, formatDateInWords, formatIssuedDateTime } from './SocietyNotificationPdfService';
import { getAreaOfOperationLevelById } from './AreaOfOperationLevelService';

export interface ICertificateData {
  societyId: string;
  societyName: string;
  localLanguageName?: string;
  registrationNumber?: string;
  /**
   * Date printed on the certificate "Dated ..." line.
   * Historically this used registration date, but for issuance we use updated_at.
   */
  dateOfRegistration?: string;
  societyType?: string;
  registrationAuthority?: string;
  state?: string;
  district?: string;
  pincode?: string;
  block?: string;
  address?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  validityPeriod?: string;
  areaOfOperation?: string;
  /** society_registrations.village_code when area of operation is Block/Village level */
  village_code?: string;
  /** From districts_blocks_gp_villages when area of operation is Block/Village level */
  village_name?: string;
  /** Pre-built "confined to …" phrase for PDF body */
  areaOfOperationConfinedTo?: string;
  /** society_registrations.area_of_operation_id → area_of_operation_levels.id */
  area_of_operation_id?: string | null;
  /** Resolved in generateSocietyCertificate via getAreaOfOperationLevelById */
  areaOfOperationLevel?: { name?: string | null; level_type?: string | null } | null;
  issuedBy?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  signature_media?: string;
  // Conversion certificate specific fields
  is_conversion?: boolean;
  conversionFrom?: string; // Society name before conversion
  conversionTo?: string; // Society name after conversion
  /** Address of the society before conversion */
  conversionFromAddress?: string;
  /** Address of the society after conversion */
  conversionToAddress?: string;
  originalRegistrationNumber?: string; // Original registration number before conversion
  conversionDate?: string; // Date of conversion
}

export const addWatermark = (doc: any, imagePath: string | Buffer) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();
  try {
    // IMPORTANT: ensure watermark opacity does not "leak" to subsequent drawing ops.
    doc.opacity(0.2);
    doc.image(imagePath, pageWidth / 2 - 150, pageHeight / 2 - 150, {
      width: 320,
      height: 250,
    });
  } catch (err) {
    console.log('Watermark error:', err);
  } finally {
    doc.restore();
    // Extra safety: PDFKit opacity can persist across ops in some cases.
    doc.opacity(1);
  }
};

export const generateSocietyCertificate = async (data: ICertificateData): Promise<Buffer> => {
  try {
    const areaOfOperationLevel = data.area_of_operation_id
      ? await getAreaOfOperationLevelById(data.area_of_operation_id).catch((err: unknown) => {
          logger.warn('Area of operation level not found for certificate PDF', {
            area_of_operation_id: data.area_of_operation_id,
            error: err instanceof Error ? err.message : String(err)
          });
          return null;
        })
      : data.areaOfOperationLevel ?? null;

    let village_code = data.village_code?.trim() || undefined;
    let village_name = data.village_name?.trim() || undefined;
    if (data.societyId && (!village_code || !village_name)) {
      const societyRow = await SocietyRegistration.findOne({
        where: { [Op.or]: [{ society_id: data.societyId }, { id: data.societyId }] },
        attributes: ['village_code']
      });
      if (societyRow?.village_code) {
        const details = await resolveRegistrationVillageDetails(societyRow.village_code);
        village_code = village_code || details.village_code || undefined;
        village_name =
          village_name ||
          details.village_name ||
          (await resolveRegistrationVillageName(societyRow.village_code)) ||
          undefined;
      }
    }

    const stateForConfined =
      data.state && String(data.state).trim() !== '' && data.state !== 'N/A'
        ? String(data.state).trim()
        : 'Arunachal Pradesh';
    const districtForConfined = data.district && data.district !== 'N/A' ? data.district : 'N/A';

    const certificateData: ICertificateData = {
      ...data,
      village_code,
      village_name,
      areaOfOperationConfinedTo:
        data.areaOfOperationConfinedTo?.trim() ||
        buildAreaOfOperationConfinedTo({
          districtName: districtForConfined,
          stateName: stateForConfined,
          village_name,
          blockName: data.block && data.block !== 'N/A' ? data.block : null,
          areaOfOperationLevelName: areaOfOperationLevel?.name
        }),
      areaOfOperationLevel
    };

    // Create PDF document with strict single page settings
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      },
      autoFirstPage: false,
      bufferPages: false
    });

    // Generate unique filename
    const filename = `certificate_${data.societyId}_${uuidv4()}.pdf`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);

    // Create write stream
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Manually create single page (watermark applied at QR stamp, same as rcs_observations)
    doc.addPage();

    // Add certificate content with absolute positioning
    await addCertificateContent(doc, certificateData);

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    // Read the generated PDF file
    const pdfBuffer = fs.readFileSync(filePath);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    logger.info(`Certificate generated successfully for society: ${data.societyId}`);
    return pdfBuffer;

  } catch (error) {
    logger.error('Error generating certificate:', error);
    throw error;
  }
};

const addCertificateContent = async (doc: any, data: ICertificateData) => {
  // Set page dimensions
  const pageWidth = 842; // A4 landscape width in points
  const pageHeight = 595; // A4 landscape height in points

  // Add border around the entire certificate
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
    .lineWidth(2)
    .stroke();

  // Add header section
  addHeaderSection(doc, pageWidth);

  // Add left side - Registration Certificate
  addRegistrationCertificateSection(doc, data, pageWidth);


  // const watermarkPath = path.join(__dirname, '../../uploads/arunachal.png');
  const watermarkPath = path.join(__dirname, '../../uploads/9ee6115d-f2a6-4827-b046-11af5f2e9a41.png'); //logo-filename

  // doc.addPage();
  // addWatermark(doc, watermarkPath);

  // doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
  //   .lineWidth(2)
  //   .stroke();

  // // Add right side - Renewal Record
  // addRenewalRecordSection(doc, pageWidth);

  // Add footer signature
  await addFooterSignature(
    doc,
    pageWidth,
    data.issuedBy,
    data.signature_media,
    data.dateOfRegistration
  );
};

const addHeaderSection = (doc: any, pageWidth: number) => {

  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text('GOVERNMENT OF ARUNACHAL PRADESH', 0, 30, {
      width: pageWidth,
      align: 'center'
    });

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('OFFICE OF THE REGISTRAR OF COOPERATIVE SOCIETIES', {
      width: pageWidth,
      align: 'center'
    });

  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('SAHKARITA BHAWAN, D-SECTOR', {
      width: pageWidth,
      align: 'center'
    });

  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('NAHARLAGUN-791110', {
      width: pageWidth,
      align: 'center'
    });
};

const addRegistrationCertificateSection = (doc: any, data: ICertificateData, pageWidth: number) => {
  const leftX = 40;
  const contentWidth = pageWidth * 0.9; // 60% of page width

  const parseDdMmYyyy = (s?: string | null): Date | null => {
    if (!s) return null;
    const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  };

  const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };

  const formatDateDayOfMonthYear = (d: Date): string => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(d);
    const day = Number(parts.find((p) => p.type === 'day')?.value || '0');
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    return `${ordinal(day)} day of ${month}, ${year}`;
  };

  const formatDateOrdinalMonthYear = (d: Date): string => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(d);
    const day = Number(parts.find((p) => p.type === 'day')?.value || '0');
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    return `${ordinal(day)} ${month}, ${year}`;
  };

  // Calculate validity period (3 years from creation date)
  const creationDate = data.dateOfRegistration ? new Date(data.dateOfRegistration) : new Date();
  const validityDate = new Date(creationDate);
  validityDate.setFullYear(validityDate.getFullYear() + 3);
  validityDate.setDate(validityDate.getDate() - 1);
  const validityPeriod = validityDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
  const registrationDateInWords = formatDateInWords(creationDate);

  // Format date for display
  const displayDate = data.dateOfRegistration ?
    new Date(data.dateOfRegistration).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) :
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });

  // Get month number for display (IST)
  const monthNumber = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      month: 'numeric',
    }).format(data.dateOfRegistration ? new Date(data.dateOfRegistration) : new Date())
  );
  const monthNumberStr = monthNumber.toString().padStart(2, '0');

  // Get month name for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[monthNumber - 1] || 'January';

  const lineY = 140;
  const margin = 40;

  // 🔹 Left: Registration Number (far left)
  doc.fontSize(12)
    .font('Helvetica-Bold')
    // .text(`NO. COOP (ORG) ${data.registrationNumber || 'N/A'}`, margin, lineY);
    .text(`${data.registrationNumber || 'N/A'}`, margin, lineY);

  // 🔹 Right: Date (same line, far right)
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text(`Dated ${displayDate}`, 0, lineY, {
      width: pageWidth - margin,
      align: 'right'
    });

  // 🔹 Next line: Center Title
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text('REGISTRATION CERTIFICATE', 0, lineY + 40, {
      width: pageWidth,
      align: 'center'
    });

  // Certificate content with absolute positioning
  let currentY = 220;

  // Main certificate text - different for conversion vs regular registration
  if (data.is_conversion) {
    // Conversion certificate format
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text('This is to Certify that under Section 9 of the Arunachal Pradesh Cooperative Societies Act 1978 (Act 3 of 1979),', leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 20;
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text('Section 17 of Arunachal Pradesh Cooperative Societies Act 1978 (Act 3 of 1979) and', leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 20;
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text('Sub-Rule (7) of Rule 16 of Arunachal Pradesh Cooperative Societies Rules 1982,', leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 25;
    // doc.fontSize(10)
    //   .font('Helvetica-Bold')
    //   .text(`a Cooperative Society under the name and style "${data.societyName || 'N/A'}"`, leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 30;
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text(data.address || 'N/A', leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 20;
    // // Conversion specific text
    const effectiveConversionDate =
      parseDdMmYyyy(data.conversionDate) ||
      (data.conversionDate ? new Date(data.conversionDate) : null) ||
      parseDdMmYyyy(displayDate) ||
      (data.dateOfRegistration ? new Date(data.dateOfRegistration) : null) ||
      new Date();

    const oldRegNo = data.originalRegistrationNumber ? `NO.COOP (ORG) ${data.originalRegistrationNumber}` : null;
    const oldRegDated = data.conversionDate ? formatDateOrdinalMonthYear(effectiveConversionDate) : formatDateOrdinalMonthYear(effectiveConversionDate);

    // const conversionText = `has been registered in this office on the ${formatDateDayOfMonthYear(
    //   effectiveConversionDate
    // )}, by converting "${data.conversionFrom || 'N/A'}", ${data.address || 'N/A'}${oldRegNo ? ` and registered under ${oldRegNo}, dated ${oldRegDated}.` : '.'
    //   }`;
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text(conversionText, leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // currentY += 25;
    // doc.fontSize(10)
    //   .font('Helvetica')
    //   .text('The Bye-laws adopted by the society have also been registered.', leftX, currentY, { width: contentWidth - 20, align: 'justify' });

    // . The area of operation of the society shall be confined to ${data.district} of Arunachal Pradesh.numbered as COOP(ORG): ${data.registrationNumber || 'N/A'}

    const paragraphWidth = contentWidth; // keep your width
    const centerX = (pageWidth - paragraphWidth) / 2; // center the block

    const previousName = data.conversionFrom || data.societyName || 'N/A';
    const convertedName = data.conversionTo || data.societyName || 'N/A';
    const previousAddress = data.conversionFromAddress || data.address || 'N/A';
    const convertedAddress = data.conversionToAddress || data.address || 'N/A';

    doc.fontSize(14)
      .font('Helvetica')
      .text(
        `This is to Certify that under Section 9 of the Arunachal Pradesh Cooperative Societies Act 1978 (Act 3 of 1979) read with Section 17 of Arunachal Pradesh Cooperative Societies act 1978 (Act 3 of 1979 and Sub-Rule(7)) of Rule 16 of Arunachal Pradesh Cooperative Societies Rules 1982, a Cooperative Society under the name and style "${previousName}", ${previousAddress} has been registered in this office on this ${formatDateDayOfMonthYear(creationDate)} by converting "${convertedName}", ${convertedAddress} and registered under ${data.registrationNumber} dated ${formatDateAsDayOrdinalMonthYear(data.dateOfRegistration || new Date())}\n`,
        leftX,
        currentY,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 4,
          indent: 300
        }
      );

    currentY += 100;

    doc.fontSize(14)
      .font('Helvetica')
      .text(
        '\n\n\n\n\nThe Bye-laws adopted by the society have also been registered.',
        centerX,  // centerX / 2,
        currentY,
        {
          width: paragraphWidth,
          align: 'justify',
          indent: 100
        }
      );

  } else {
    // Regular registration certificate format (area text matches SocietyNotificationPdfService)
    const stateName =
      data.state && String(data.state).trim() !== '' && data.state !== 'N/A'
        ? String(data.state).trim()
        : 'Arunachal Pradesh';
    const districtName = data.district || 'N/A';
    const areaOfOperationConfinedTo =
      data.areaOfOperationConfinedTo?.trim() ||
      buildAreaOfOperationConfinedTo({
        districtName,
        stateName,
        village_name: data.village_name,
        blockName: data.block && data.block !== 'N/A' ? data.block : null,
        areaOfOperationLevelName: data.areaOfOperationLevel?.name
      });
     
    const paragraphWidth = contentWidth; // keep your width
    const centerX = (pageWidth - paragraphWidth) / 2; // center the block
    
    doc.fontSize(14)
      .font('Helvetica')
      .text(
        `This is to Certify that under Section 9 of the Arunachal Pradesh Cooperative Societies Act 1978 (Act 3 of 1979) a Cooperative Society under the name and style "${data.societyName || 'N/A'}" ${data.address || 'N/A'} has been registered in this office and numbered as ${data.registrationNumber || 'N/A'} on this ${registrationDateInWords} Anno Domini. The validity of the Registration is upto ${data.validityPeriod || validityPeriod}. The area of operation of the society shall be confined to ${areaOfOperationConfinedTo}.`,
        leftX,
        currentY,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 4,
          indent: 300
        }
      );


    currentY += 100;
    // doc.fontSize(12)
    //    .font('Helvetica')
    //    .text('The Bye-laws adopted by the society have also been registered.', leftX, currentY, { align: 'justify' });

    doc.fontSize(14)
      .font('Helvetica')
      .text(
        '\n\nThe Bye-laws adopted by the society have also been registered.',
        centerX,  // centerX / 2,
        currentY,
        {
          width: paragraphWidth,
          align: 'justify',
          indent: 100
        }
      );
  }
};


// const addRenewalRecordSection = (doc: any, pageWidth: number) => {
//   const rightX = pageWidth * 0.65; // 65% from left edge
//   const startY = 140;

//   // Title
//   doc.fontSize(16)
//      .font('Helvetica-Bold')
//      .text('RENEWAL RECORD', rightX, startY);

//   // Renewal entries with compact spacing
//   const entryStartY = startY + 40;
//   for (let i = 0; i < 4; i++) {
//     const yPos = entryStartY + (i * 60); // Compact spacing

//     doc.fontSize(10)
//        .font('Helvetica')
//        .text(`Renewed upto..................................`, rightX, yPos);

//     doc.fontSize(10)
//        .font('Helvetica')
//        .text(`Vide T/C No..................................`, rightX, yPos + 15);

//     doc.fontSize(10)
//        .font('Helvetica')
//        .text(`dated..................................`, rightX, yPos + 30);

//     doc.fontSize(10)
//        .font('Helvetica')
//        .text(`Signature with Seal`, rightX, yPos + 45);
//   }
// };

const addRenewalRecordSection = (doc: any, pageWidth: number) => {
  const leftX = 60;              // left margin
  const contentWidth = pageWidth - 120; // balanced margin
  const startY = 100;

  // Centered Title
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text('RENEWAL RECORD', 0, startY - 30, {
      width: pageWidth,
      align: 'center',
    });


  const entryStartY = startY + 40;

  for (let i = 0; i < 4; i++) {
    const yPos = entryStartY + (i * 80); // more spacing like image

    // Single line (as per image)
    doc.fontSize(14)
      .font('Helvetica')
      .text(
        'Renewed upto...............           Vide T/C No.....................          dated...............\n',
        leftX,
        yPos,
        {
          width: contentWidth,
          align: 'left'
        }
      );

    // Signature aligned right
    doc.text('\nSignature with Seal', leftX, yPos + 25, {
      width: contentWidth,
      align: 'right'
    });
  }
};

const addFooterSignature = async (
  doc: any,
  pageWidth: number,
  issuedBy: ICertificateData['issuedBy'] | undefined,
  signatureMedia: ICertificateData['signature_media'],
  issuedAt?: string | Date
) => {
  const leftMargin = 40;
  const rightMargin = 55;
  const textBlockWidth = pageWidth - leftMargin - rightMargin;
  const signatureY = 520;
  const imgWidth = 110;
  const imgHeight = 45;
  const imgX = pageWidth - rightMargin - imgWidth;
  const imgY = signatureY - imgHeight - 8;

  const designationLines = [
    'Registrar',
    'Cooperative Societies,',
    // 'Arunachal Pradesh, Naharlagun'
  ];

  let signatureImageSource: string | Buffer | undefined;
  try {
    if (signatureMedia) {
      const isRemote = /^https?:\/\//i.test(signatureMedia);
      const projectUploadsDir = path.resolve(process.cwd(), 'uploads');

      if (isRemote) {
        const response = await axios.get<ArrayBuffer>(signatureMedia, {
          responseType: 'arraybuffer',
          timeout: 5000
        });
        signatureImageSource = Buffer.from(response.data);
      } else {
        let localPath = signatureMedia;

        if (signatureMedia.includes('/uploads/') || signatureMedia.includes('\\uploads\\')) {
          localPath = path.join(projectUploadsDir, path.basename(signatureMedia));
        } else if (!path.isAbsolute(signatureMedia)) {
          localPath = path.join(projectUploadsDir, path.basename(signatureMedia));
        } else if (!fs.existsSync(signatureMedia)) {
          localPath = path.join(projectUploadsDir, path.basename(signatureMedia));
        }

        if (fs.existsSync(localPath)) {
          signatureImageSource = localPath;
        } else {
          logger.warn(`Signature image not found at path: ${localPath}`);
        }
      }
    }
  } catch (error: any) {
    logger.warn(`Unable to load signature image: ${error?.message}`);
  }

  if (signatureImageSource) {
    try {
      doc.image(signatureImageSource, imgX, imgY, {
        width: imgWidth,
        height: imgHeight,
        fit: [imgWidth, imgHeight]
      });
    } catch (imgErr: any) {
      logger.warn(`Failed to render certificate signature image: ${imgErr?.message || 'unknown error'}`);
    }
  }

  const signerName = String(issuedBy?.fullName ?? '').trim() || 'N/A';
  let textY = signatureY;

  doc.font('Helvetica')
    .fontSize(10)
    .text(`Sd/-${signerName}`, leftMargin, textY, { width: textBlockWidth, align: 'right' });

  textY += 14;
  doc.font('Helvetica-Bold').fontSize(9.5);
  for (const line of designationLines) {
    doc.text(line, leftMargin, textY, { width: textBlockWidth, align: 'right' });
    textY += 12;
  }

  const issuedDateTimeLabel = issuedAt ? formatIssuedDateTime(issuedAt) : '';
  if (issuedDateTimeLabel) {
    doc.font('Helvetica').fontSize(9);
    doc.text(issuedDateTimeLabel, leftMargin, textY, { width: textBlockWidth, align: 'right' });
  }
};

/**
 * Generate and upload certificate for a society
 * This is a reusable function that can be used for:
 * - Society Registration certificates
 * - Society Conversion certificates
 * - Amendment certificates
 * - Any other certificate that requires society data
 * 
 * @param societyId - The ID of the society (can be society_id or id field)
 * @param userId - The ID of the user generating the certificate
 * @param options - Optional parameters
 * @param options.certificateType - Type of certificate (e.g., 'registration', 'conversion', 'amendment')
 * @param options.transaction - Sequelize transaction (optional)
 * @param options.issuedBy - User details who issued the certificate (optional)
 * @param options.conversionData - Conversion details (required for conversion certificates)
 * @param options.conversionData.conversionFrom - Sector name converting from (e.g., "MULTIPURPOSE COOPERATIVE SOCIETY LTD")
 * @param options.conversionData.conversionTo - Sector name converting to (e.g., "LARGE SIZED MULTIPURPOSE COOPERATIVE SOCIETY LTD")
 * @param options.conversionData.originalRegistrationNumber - Original registration number before conversion
 * @param options.conversionData.conversionDate - Date of conversion
 * @returns Promise with uploaded media object containing id, url, etc.
 */
export const generateAndUploadSocietyCertificate = async (
  societyId: string,
  userId: string,
  options?: {
    certificateType?: string;
    transaction?: any;
    issuedBy?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
    conversionData?: {
      conversionFrom?: string;
      conversionTo?: string;
      conversionFromAddress?: string;
      conversionToAddress?: string;
      originalRegistrationNumber?: string;
      conversionDate?: string;
    };
  }
): Promise<any> => {
  try {
    if (!societyId || !userId) {
      throw new Error('Society ID and User ID are required');
    }

    const { certificateType = 'registration', transaction, issuedBy, conversionData } = options || {};
    const is_conversion = certificateType === 'conversion';

    // Fetch society data with all required associations
    const society = await SocietyRegistration.findOne({
      where: {
        [Op.or]: [
          { id: societyId },
          { society_id: societyId }
        ]
      },
      include: [
        {
          model: sequelize.models.CooperativeSocietyType,
          as: 'cooperativeSocietyType',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: sequelize.models.RegistrationAuthority,
          as: 'registrationAuthority',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: sequelize.models.State,
          as: 'state',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: sequelize.models.District,
          as: 'district',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: sequelize.models.Block,
          as: 'block',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      transaction
    });

    if (!society) {
      throw new Error(`Society not found with ID: ${societyId}`);
    }

    const societyLookupId = String(society.society_id || society.id || '');
    const societyAddressRes = await getSocietyAddress(societyLookupId).catch(() => null);
    const districtFromAddress = societyAddressRes?.parts?.district_name?.trim();
    const districtStr =
      districtFromAddress ||
      (society as any).district?.name?.trim() ||
      'N/A';
    const addressStr =
      societyAddressRes?.address?.trim() ||
      (society.full_address != null ? String(society.full_address).trim() : '') ||
      (districtStr !== 'N/A' ? districtStr : 'N/A');

    const stateStr =
      (society as any).state?.name?.trim() && (society as any).state?.name !== 'N/A'
        ? String((society as any).state.name).trim()
        : 'Arunachal Pradesh';

    let village_code: string | undefined;
    let village_name: string | undefined;
    if (society.village_code) {
      const details = await resolveRegistrationVillageDetails(society.village_code);
      village_code = details.village_code ?? undefined;
      village_name =
        details.village_name ??
        societyAddressRes?.parts?.village_name?.trim() ??
        undefined;
    }
    const areaOfOperationLevelRow = society.area_of_operation_id
      ? await getAreaOfOperationLevelById(society.area_of_operation_id).catch(() => null)
      : null;
    const areaOfOperationConfinedTo = buildAreaOfOperationConfinedTo({
      districtName: districtStr,
      stateName: stateStr,
      village_name:
        village_name || societyAddressRes?.parts?.village_name?.trim() || undefined,
      blockName:
        ((society as any).block?.name && (society as any).block.name !== 'N/A'
          ? String((society as any).block.name)
          : null) ||
        societyAddressRes?.parts?.block_name?.trim() ||
        null,
      areaOfOperationLevelName: areaOfOperationLevelRow?.name
    });

    // Prepare certificate data
    const certificateData: ICertificateData = {
      societyId: society.society_id || society.id,
      societyName: society.cooperative_society_name || 'N/A',
      localLanguageName: society.local_langauge_society_name || 'N/A',
      registrationNumber: society.registration_number || 'N/A',
      // Current issuance time so certificate Dated / signature match API call (IST in formatters).
      dateOfRegistration: new Date().toISOString(),
      societyType: (society as any).cooperativeSocietyType?.name || 'N/A',
      registrationAuthority: (society as any).registrationAuthority?.name || 'N/A',
      state: stateStr,
      district: districtStr,
      pincode: society.pincode != null ? String(society.pincode) : undefined,
      block: (society as any).block?.name || 'N/A',
      address: addressStr,
      contactPerson: society.mobile_number_of_secretary ? 'Secretary' : 'N/A',
      mobile: society.mobile_number_of_secretary ? String(society.mobile_number_of_secretary) : 'N/A',
      email: society.email || 'N/A',
      validityPeriod: society.certificate_issue_date
        ? new Date(society.certificate_issue_date).toLocaleDateString('en-GB')
        : undefined,
      village_code,
      village_name,
      areaOfOperationConfinedTo,
      area_of_operation_id: society.area_of_operation_id || undefined,
      areaOfOperation: society.operation_area_location || undefined,
      issuedBy: issuedBy || undefined,
      // Conversion specific fields
      is_conversion: is_conversion,
      conversionFrom: conversionData?.conversionFrom,
      conversionTo: conversionData?.conversionTo,
      conversionFromAddress: conversionData?.conversionFromAddress || addressStr,
      conversionToAddress: conversionData?.conversionToAddress || addressStr,
      originalRegistrationNumber: conversionData?.originalRegistrationNumber,
      conversionDate: conversionData?.conversionDate
    };

    // Generate certificate PDF
    const certificateBuffer = await generateSocietyCertificate(certificateData);

    // Upload certificate as media
    const mediaData = {
      originalname: `${certificateType}_certificate_${society.society_id || society.id}.pdf`,
      mimetype: 'application/pdf',
      size: certificateBuffer.length,
      buffer: certificateBuffer,
      userId
    };

    const uploadedMedia = await mediaUpload(mediaData, userId);

    // Renewal certificates are stamped with QR + SD-RCS signatory at DRCS final approval
    // (see RenewalCertificateDocumentService via WorkflowUtilService).
    if (certificateType === 'renewal') {
      logger.info('Renewal certificate QR/signatory stamping deferred to workflow final approval', {
        societyId: society.society_id || society.id,
        mediaId: uploadedMedia.id,
      });
      return uploadedMedia;
    }

    // Stamp the certificate with verification QR (mirrors bye-law QR flow).
    // QR encodes the public download URL of the just-uploaded certificate media.
    try {
      const baseUrl = String(process.env.API_URL || '').replace(/\/+$/, '');
      const certificateQrDownloadUrl = baseUrl
        ? `${baseUrl}/api/v1/public/media/${uploadedMedia.id}/download`
        : undefined;

      const stampedCertificate = await stampCertificatePdfWithQr(
        {
          originalname: mediaData.originalname,
          mimetype: 'application/pdf',
          size: certificateBuffer.length,
          buffer: certificateBuffer,
          userId
        },
        {
          societyRegistrationId: society.id,
          mediaId: uploadedMedia.id,
          certificateType,
          uploadedByUserId: userId,
          uploadedByName: issuedBy?.fullName
            || [issuedBy?.firstName, issuedBy?.lastName].filter(Boolean).join(' ')
            || undefined,
          qrDownloadUrl: certificateQrDownloadUrl
        }
      );

      await overwriteMediaFileBuffer(uploadedMedia.id, stampedCertificate.buffer, userId);
    } catch (stampErr: any) {
      logger.warn('Certificate QR stamping failed (generateAndUploadSocietyCertificate)', {
        societyId: society.society_id || society.id,
        certificateType,
        mediaId: uploadedMedia.id,
        error: stampErr?.message || String(stampErr)
      });
    }

    logger.info('Certificate generated and uploaded successfully', {
      societyId: society.society_id || society.id,
      certificateType,
      mediaId: uploadedMedia.id,
      userId
    });

    return uploadedMedia;
  } catch (error: any) {
    logger.error('Error generating and uploading certificate', {
      societyId,
      certificateType: options?.certificateType,
      error: error?.message,
      stack: error?.stack
    });
    throw error;
  }
};
