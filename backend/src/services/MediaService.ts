import Media from "../models/Media";
import logger from "../utils/logger";
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';


// Define upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'text/plain', 
  // 'application/msword', 
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'text/csv', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface IMediaUploadData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  userId?: string;
}

export interface IMediaData {
  id?: string;
  url: string;
  created_by?: string;
  updated_by?: string;
  active?: boolean;
}

export const uploadMedia = async (fileData: IMediaUploadData): Promise<string> => {
  try {
    if (!ALLOWED_FILE_TYPES.includes(fileData.mimetype)) {
      throw new Error(`File type ${fileData.mimetype} is not allowed`);
    }

    if (fileData.size > MAX_FILE_SIZE) {
      throw new Error(`File size ${fileData.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    const fileExtension = path.extname(fileData.originalname?.replace(/ /g, '_') || '');
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    fs.writeFileSync(filePath, fileData.buffer);

    logger.info(`Media uploaded successfully: ${filename}`);
    return `/uploads/${filename}`;
  } catch (error) {
    logger.error('Error uploading media:', error);
    throw error;
  }
};

export const createMedia = async (data: IMediaData): Promise<Media> => {
  try {
    const media = await Media.create(data);
    logger.info(`Media created successfully: ${media.id}`);
    

    
    return media;
  } catch (error) {
    logger.error('Error creating media:', error);
    throw error;
  }
};

export const mediaUpload = async (fileData: IMediaUploadData, userId: string): Promise<Media> => {
  try {
    // First upload the file
    const uploadUrl = await uploadMedia(fileData);
    
    // Then create the media record
    const media = await createMedia({
      url: uploadUrl,
      created_by: userId,
      active: true
    });
    
    logger.info(`Media uploaded and created successfully: ${media.id}`);
    return media;
  } catch (error) {
    logger.error('Error in mediaUpload:', error);
    throw error;
  }
};

/** Write file as `{mediaId}{ext}` and create media row with that primary key (for QR URLs known before save). */
export const uploadMediaWithPredefinedId = async (
  fileData: IMediaUploadData,
  userId: string,
  mediaId: string
): Promise<Media> => {
  if (!ALLOWED_FILE_TYPES.includes(fileData.mimetype)) {
    throw new Error(`File type ${fileData.mimetype} is not allowed`);
  }
  if (fileData.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${fileData.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }

  const fileExtension = path.extname(fileData.originalname?.replace(/ /g, '_') || '');
  const filename = `${mediaId}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, fileData.buffer);
  const url = `/uploads/${filename}`;

  const media = await createMedia({
    id: mediaId,
    url,
    created_by: userId,
    active: true
  });

  logger.info(`Media uploaded with predefined id successfully: ${media.id}`);
  return media;
};

export const getMediaBySociety = async (societyId: string): Promise<Media[]> => {
  try {
    const media = await Media.findAll({
      include: [{
        model: require('../models/SocietyRegistration'),
        where: { society_id: societyId },
        as: 'byeLawsSocieties'
      }, {
        model: require('../models/SocietyRegistration'),
        where: { society_id: societyId },
        as: 'bankCertificateSocieties'
      }, {
        model: require('../models/SocietyRegistration'),
        where: { society_id: societyId },
        as: 'economicSchemeSocieties'
      }, {
        model: require('../models/SocietyRegistration'),
        where: { society_id: societyId },
        as: 'contributorListSocieties'
      }, {
        model: require('../models/SocietyRegistration'),
        where: { society_id: societyId },
        as: 'customDocumentsSocieties'
      }],
      where: { active: true }
    });
    return media;
  } catch (error) {
    logger.error('Error getting media by society:', error);
    throw error;
  }
};

export const getUploadDirectory = (): string => {
  return UPLOAD_DIR;
};

/** Resolve a stored media URL to the on-disk uploads path. */
export const resolveMediaFilePath = (mediaUrl: string): string => {
  if (!mediaUrl) return '';

  if (path.isAbsolute(mediaUrl) && fs.existsSync(mediaUrl)) {
    return mediaUrl;
  }

  return path.join(UPLOAD_DIR, path.basename(mediaUrl));
};

/** Read the bytes for a media row URL from the uploads directory. */
export const readMediaFileBuffer = (mediaUrl: string): Buffer | null => {
  try {
    const filePath = resolveMediaFilePath(mediaUrl);
    if (!filePath || !fs.existsSync(filePath)) {
      logger.warn('Media file not found on disk', { mediaUrl, filePath });
      return null;
    }
    return fs.readFileSync(filePath);
  } catch (err) {
    logger.warn('Failed to read media file from disk', {
      mediaUrl,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
};

export const getMaxFileSize = (): number => {
  return MAX_FILE_SIZE;
};

export const getAllowedFileTypes = (): string[] => {
  return ALLOWED_FILE_TYPES;
};

/** Detect file type from magic bytes (used when extension and content diverge after stamping). */
export const detectMediaContentType = (
  buffer: Buffer
): { contentType: string; extension: string } | null => {
  if (!buffer || buffer.length < 5) return null;

  if (buffer.subarray(0, 5).toString('utf8') === '%PDF-') {
    return { contentType: 'application/pdf', extension: '.pdf' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { contentType: 'image/png', extension: '.png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: '.jpg' };
  }
  if (
    buffer.length >= 6 &&
    buffer.subarray(0, 3).toString('ascii') === 'GIF' &&
    (buffer[3] === 0x38)
  ) {
    return { contentType: 'image/gif', extension: '.gif' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: '.webp' };
  }
  return null;
};

/**
 * Overwrite the underlying file for an existing media row.
 * If buffer content type differs from the current URL extension (e.g. PNG uploaded then
 * stamped as PDF), renames the file and updates media.url so viewers get the right type.
 */
export const overwriteMediaFileBuffer = async (
  mediaId: string,
  buffer: Buffer,
  updatedBy?: string
): Promise<Media> => {
  const media = await Media.findByPk(mediaId);
  if (!media?.url) {
    throw new Error('Media not found');
  }

  const oldFilePath = resolveMediaFilePath(media.url);
  if (!oldFilePath) {
    throw new Error('Invalid media file path');
  }

  const currentExt = path.extname(oldFilePath).toLowerCase();
  const detected = detectMediaContentType(buffer);
  const nextExt = detected?.extension || currentExt || '';
  const baseName = path.basename(oldFilePath, currentExt || undefined);
  const nextFilePath =
    nextExt && nextExt !== currentExt
      ? path.join(UPLOAD_DIR, `${baseName}${nextExt}`)
      : oldFilePath;
  const nextUrl =
    nextExt && nextExt !== currentExt
      ? `/uploads/${path.basename(nextFilePath)}`
      : media.url;

  if (!fs.existsSync(oldFilePath) && nextFilePath === oldFilePath) {
    logger.warn('Media file missing on disk; creating new file', { mediaId, filePath: nextFilePath });
  }

  fs.writeFileSync(nextFilePath, buffer);

  if (nextFilePath !== oldFilePath && fs.existsSync(oldFilePath)) {
    try {
      fs.unlinkSync(oldFilePath);
    } catch (unlinkErr) {
      logger.warn('Failed to remove old media file after extension change', {
        mediaId,
        oldFilePath,
        nextFilePath,
        error: unlinkErr instanceof Error ? unlinkErr.message : String(unlinkErr),
      });
    }
  }

  logger.info('Media file overwritten on disk', {
    mediaId,
    filePath: nextFilePath,
    previousUrl: media.url,
    nextUrl,
    bytes: buffer.length,
    contentType: detected?.contentType || null,
  });

  await media.update({
    url: nextUrl,
    updated_by: updatedBy || media.updated_by || null,
  });

  return media;
};