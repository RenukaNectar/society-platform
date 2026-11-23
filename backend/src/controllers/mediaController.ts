import { Response } from "express";
import { AppError } from "../utils/errors";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";
import { getSocietyRegistrationById, updateSocietyRegistration } from "../services/SocietyRegistrationService";
import { uploadMedia, IMediaUploadData, createMedia, mediaUpload, detectMediaContentType } from "../services/MediaService";
import { v4 as uuidv4 } from 'uuid';
import { findUserById } from "../services/UserService";
import Media from "../models/Media";
import path from 'path';
import fs from 'fs';
import logger from "../utils/logger";

const getPublicApiBaseUrl = (req: IAuthRequest): string => {
    const envUrl = String(process.env.API_URL || '').trim();
    const derived = `${req.protocol}://${req.get('host')}`;
    const base = envUrl || derived;
    return base.replace(/\/+$/, '');
};

const resolveServeHeaders = (
    filePath: string,
    safeFilename: string
): { contentType: string; contentDisposition: string; isPdf: boolean } => {
    const header = Buffer.alloc(16);
    let bytesRead = 0;
    try {
        const fd = fs.openSync(filePath, 'r');
        bytesRead = fs.readSync(fd, header, 0, 16, 0);
        fs.closeSync(fd);
    } catch {
        bytesRead = 0;
    }

    const sniffed = bytesRead > 0 ? detectMediaContentType(header.subarray(0, bytesRead)) : null;
    const ext = path.extname(safeFilename).toLowerCase();

    if (sniffed) {
        const isPdf = sniffed.contentType === 'application/pdf';
        const isImage = sniffed.contentType.startsWith('image/');
        return {
            contentType: sniffed.contentType,
            contentDisposition: isPdf || isImage
                ? `inline; filename="${safeFilename}"`
                : `attachment; filename="${safeFilename}"`,
            isPdf,
        };
    }

    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return { contentType: 'image/jpeg', contentDisposition: 'inline', isPdf: false };
        case '.png':
            return { contentType: 'image/png', contentDisposition: 'inline', isPdf: false };
        case '.gif':
            return { contentType: 'image/gif', contentDisposition: 'inline', isPdf: false };
        case '.webp':
            return { contentType: 'image/webp', contentDisposition: 'inline', isPdf: false };
        case '.pdf':
            return {
                contentType: 'application/pdf',
                contentDisposition: `inline; filename="${safeFilename}"`,
                isPdf: true,
            };
        case '.txt':
            return {
                contentType: 'text/plain; charset=utf-8',
                contentDisposition: `inline; filename="${safeFilename}"`,
                isPdf: false,
            };
        case '.csv':
            return {
                contentType: 'text/csv; charset=utf-8',
                contentDisposition: `attachment; filename="${safeFilename}"`,
                isPdf: false,
            };
        case '.xls':
            return {
                contentType: 'application/vnd.ms-excel',
                contentDisposition: `attachment; filename="${safeFilename}"`,
                isPdf: false,
            };
        case '.xlsx':
            return {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                contentDisposition: `attachment; filename="${safeFilename}"`,
                isPdf: false,
            };
        default:
            return {
                contentType: 'application/octet-stream',
                contentDisposition: `attachment; filename="${safeFilename}"`,
                isPdf: false,
            };
    }
};

export const uploadSocietyMediaController = async (req: IAuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        if(!id || !req.user?.userId || !(await getSocietyRegistrationById(id))) {
            throw new AppError('Society ID is required or invalid', 400);
        }

        const processFileUpload = async (file: any, fieldName: string): Promise<string> => {
            if (!file) return '';
            
            if (file.fieldname && file.originalname && file.mimetype && file.size) {
                let fileData: IMediaUploadData = {
                    originalname: file.originalname?.replace(/ /g, '_')?.replace(/:/g, '_')?.replace(/-/g, '_'),
                    mimetype: file.mimetype,
                    size: file.size,
                    buffer: file.buffer,
                    userId: req.user?.userId
                };

                const media = await mediaUpload(fileData, req.user!.userId);
                return media.id;
            } else {
                const fd: IMediaUploadData = {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    buffer: file.buffer,
                    userId: req.user?.userId
                };
                const media = await mediaUpload(fd, req.user!.userId);
                return media.id;
            }
        };

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const bye_laws = files?.bye_laws?.[0];
        const bank_certificate = files?.bank_certificate?.[0];
        const economic_scheme = files?.economic_scheme?.[0];
        const contributor_list = files?.contributor_list?.[0];
        const custom_documents = files?.custom_documents?.[0];
        const non_family_coop_certificate = files?.non_family_coop_certificate?.[0];
        const site_inspection_report = files?.site_inspection_report?.[0];
        const circular_minutes_of_meeting = files?.circular_minutes_of_meeting?.[0];
        const land_document = files?.land_document?.[0];
        const circular_for_promoters_meeting = files?.circular_for_promoters_meeting?.[0];

        if((!bye_laws && !bank_certificate && !economic_scheme && !contributor_list && !non_family_coop_certificate && !site_inspection_report && !circular_minutes_of_meeting && !land_document && !circular_for_promoters_meeting)) {
            throw new AppError('Please upload society medias', 400);
        }
        
        const updateData: any = {};
        
        try {
            if (bye_laws) {
                updateData.bye_laws = await processFileUpload(bye_laws, 'bye_laws');
            }
            if (bank_certificate) {
                updateData.bank_certificate = await processFileUpload(bank_certificate, 'bank_certificate');
            }
            if (economic_scheme) {
                updateData.economic_scheme = await processFileUpload(economic_scheme, 'economic_scheme');
            }
            if (contributor_list) {
                updateData.contributor_list = await processFileUpload(contributor_list, 'contributor_list');
            }
            if (custom_documents) {
                updateData.custom_documents = await processFileUpload(custom_documents, 'custom_documents');
            }
            if (non_family_coop_certificate) {
                updateData.non_family_coop_certificate = await processFileUpload(non_family_coop_certificate, 'non_family_coop_certificate');
            }
            if (site_inspection_report) {
                updateData.site_inspection_report = await processFileUpload(site_inspection_report, 'site_inspection_report');
            }
            if (circular_minutes_of_meeting) {
                updateData.circular_minutes_of_meeting = await processFileUpload(circular_minutes_of_meeting, 'circular_minutes_of_meeting');
            }
            if (land_document) {
                updateData.land_document = await processFileUpload(land_document, 'land_document');
            }
            if (circular_for_promoters_meeting) {
                updateData.circular_for_promoters_meeting = await processFileUpload(circular_for_promoters_meeting, 'circular_for_promoters_meeting');
            }
        } catch (fileError) {
            logger.error('File processing error in society media upload:', {
                error: fileError instanceof Error ? fileError.message : String(fileError),
                societyId: id,
                userId: req.user?.userId
            });
            throw new AppError(`File processing failed: ${fileError instanceof Error ? fileError.message : String(fileError)}`, 400);
        }
        
        const updateSociety = await updateSocietyRegistration(id, updateData);
        if(!updateSociety) {
            returnResponse(res).error('Failed to update society', 400);
        }

        returnResponse(res).ok('Media uploaded successfully', updateSociety);
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
}

export const uploadMediaController = async (req: IAuthRequest, res: Response) => {
    try {
        let document;
        
        if (req.file) {
            document = req.file;
        } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            document = req.files[0];
        } else if (req.body.document) {
            document = req.body.document;
        } else {
            returnResponse(res).error('Document is required and must be a valid file object', 400);
        }

        const authUser = req.user;
        if (!authUser || !authUser.userId) {
            returnResponse(res).error('User authentication required', 401);
            return;
        }

        const userId = authUser.userId;

        if (document && typeof document === 'object') {
            if (document.fieldname && document.originalname && document.mimetype && document.size && document.buffer) {
                const rawType = (req.body?.document_type ?? req.body?.documentType ?? '') as string;
                const documentType = String(rawType).toLowerCase().trim();

                let fileData: IMediaUploadData = {
                    originalname: document.originalname,
                    mimetype: document.mimetype,
                    size: document.size,
                    buffer: document.buffer,
                    userId
                };

                const uploadUrl = await uploadMedia(fileData);
                if (!uploadUrl) {
                    returnResponse(res).error('Failed to upload media', 400);
                }
                
                const media = await createMedia({
                    url: uploadUrl,
                    created_by: userId
                });
                returnResponse(res).ok('Media uploaded successfully', media);
            } else {
                returnResponse(res).error('Invalid file format. Please upload via form data with proper file object containing fieldname, originalname, mimetype, size, and buffer properties.', 400);
            }
        } else {
            returnResponse(res).error('Document is required and must be a valid file object', 400);
        }
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
}

export const serveImage = async (req: IAuthRequest, res: Response) => {
    try {
        const { filename } = req.params as { filename: string };

        if (!filename) {
            return returnResponse(res).error('Filename is required', 400);
        }
        
        // Construct file path
        // Prevent path traversal by forcing filename to its basename only.
        const safeFilename = path.basename(filename);
        const filePath = path.resolve(__dirname, '../../uploads', safeFilename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return returnResponse(res).error('File not found', 404);
        }
        
        // Get file stats
        const stats = fs.statSync(filePath);
        const { contentType, contentDisposition, isPdf } = resolveServeHeaders(filePath, safeFilename);
        
        // Set appropriate headers (content sniffed so stamped PDFs saved as .png still open)
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', contentDisposition);
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
        
        // For PDFs, add additional headers to ensure proper display
        if (isPdf) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
}

/** Public download by media row id (used in QR before society registration exists). */
export const downloadMediaByIdController = async (req: IAuthRequest, res: Response) => {
    try {
        const { mediaId } = req.params as { mediaId: string };
        if (!mediaId) {
            return returnResponse(res).error('Media ID is required', 400);
        }

        const media = await Media.findByPk(mediaId);
        if (!media?.url) {
            return returnResponse(res).error('File not found', 404);
        }

        const filePath = path.resolve(__dirname, '../../uploads', path.basename(media.url));
        if (!fs.existsSync(filePath)) {
            return returnResponse(res).error('File does not exist on server', 404);
        }

        const safeFilename = path.basename(filePath);
        const { contentType, contentDisposition, isPdf } = resolveServeHeaders(filePath, safeFilename);
        const downloadName = `document_${mediaId}${path.extname(safeFilename) || ''}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader(
            'Content-Disposition',
            contentDisposition.includes('inline')
                ? `inline; filename="${downloadName}"`
                : `attachment; filename="${downloadName}"`
        );
        if (isPdf) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        logger.error('Error downloading media by id:', error);
        return res.status(500).json({ error: 'Failed to download file' });
    }
};

export const downloadByeLawsBySocietyIdController = async (req: IAuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        if (!id) {
            return returnResponse(res).error('Society registration ID is required', 400);
        }

        const society: any = await getSocietyRegistrationById(id);
        if (!society || !society.bye_laws) {
            return returnResponse(res).error('Bye-law document not found', 404);
        }

        const media = await Media.findByPk(society.bye_laws);
        if (!media?.url) {
            return returnResponse(res).error('Bye-law media not found', 404);
        }

        const filePath = path.resolve(__dirname, '../../uploads', path.basename(media.url));
        if (!fs.existsSync(filePath)) {
            return returnResponse(res).error('Bye-law file does not exist on server', 404);
        }

        const safeFilename = path.basename(filePath);
        const { contentType, contentDisposition, isPdf } = resolveServeHeaders(filePath, safeFilename);
        const fileName = `bye_law_${id}${path.extname(safeFilename) || '.pdf'}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader(
            'Content-Disposition',
            contentDisposition.includes('inline')
                ? `inline; filename="${fileName}"`
                : `attachment; filename="${fileName}"`
        );
        if (isPdf) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        logger.error('Error downloading bye-law file:', error);
        return res.status(500).json({ error: 'Failed to download bye-law file' });
    }
};