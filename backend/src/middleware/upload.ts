import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { returnResponse } from '../utils/response';

const storage = multer.memoryStorage();

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    // 'application/msword': ['.doc'],
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const startsWithSignature = (buffer: Buffer, signature: number[]) =>
    buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);

const hasValidFileSignature = (file: Express.Multer.File) => {
    const buffer = file.buffer;
    const mimeType = file.mimetype;

    if (!buffer || buffer.length === 0) {
        return false;
    }

    switch (mimeType) {
        case 'application/pdf':
            // PDF magic bytes: %PDF-
            return startsWithSignature(buffer, [0x25, 0x50, 0x44, 0x46, 0x2D]);
        case 'image/jpeg':
            return startsWithSignature(buffer, [0xFF, 0xD8, 0xFF]);
        case 'image/png':
            return startsWithSignature(buffer, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        case 'image/gif':
            return startsWithSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
                startsWithSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
        case 'image/webp':
            return startsWithSignature(buffer, [0x52, 0x49, 0x46, 0x46]) &&
                buffer.length > 12 &&
                buffer.toString('ascii', 8, 12) === 'WEBP';
        default:
            // Keep legacy support for office/text formats where signature checks
            // are less straightforward in current flow.
            return true;
    }
};

const validateUploadedFiles = (req: Request) => {
    const filesToValidate: Express.Multer.File[] = [];

    if (req.file) {
        filesToValidate.push(req.file);
    }

    if (req.files) {
        if (Array.isArray(req.files)) {
            filesToValidate.push(...req.files);
        } else {
            Object.values(req.files).forEach((files) => filesToValidate.push(...files));
        }
    }

    filesToValidate.forEach((file) => {
        const allowedExtensions = MIME_TO_EXTENSIONS[file.mimetype] || [];
        const uploadedExtension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.length) {
            throw new Error(`File type ${file.mimetype} is not allowed`);
        }

        if (!allowedExtensions.includes(uploadedExtension)) {
            throw new Error(`File extension ${uploadedExtension || '(none)'} does not match MIME type ${file.mimetype}`);
        }

        if (!hasValidFileSignature(file)) {
            throw new Error(`File content does not match declared type ${file.mimetype}`);
        }
    });
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        // 'application/msword',
        // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
};

const runUploadWithValidation = (uploadHandler: (req: Request, res: any, callback: (error?: any) => void) => void) => {
    return (req: Request, res: any, next: any) => {
        uploadHandler(req, res, (error?: any) => {
            if (error) {
                return next(error);
            }

            try {
                validateUploadedFiles(req);
                next();
            } catch (validationError) {
                next(validationError);
            }
        });
    };
};

const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only allow 1 file per request
};

const multipleFileLimits = {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Allow up to 5 files for society uploads
};

const auditRequestFileLimits = {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9 // Allow up to 9 files for audit request uploads
};

export const uploadSingle = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits
}).single('document'));

/** Bulk applicant upload — field name: file (.xlsx, .xls, .csv) */
export const uploadBulkApplicantFile = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits
}).single('file'));

export const uploadMultiple = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits: multipleFileLimits
}).fields([
    { name: 'bye_laws', maxCount: 1 },
    { name: 'bank_certificate', maxCount: 1 },
    { name: 'economic_scheme', maxCount: 1 },
    { name: 'contributor_list', maxCount: 1 },
    { name: 'custom_documents', maxCount: 1 }
]));

export const uploadAuditRequestFiles = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits: auditRequestFileLimits
}).fields([
    { name: 'audit_accounts', maxCount: 1 },
    { name: 'audit_note', maxCount: 1 },
    { name: 'vital_stats_form', maxCount: 1 },
    { name: 'shareholder_list', maxCount: 1 },
    { name: 'agm_bod_minutes', maxCount: 1 },
    { name: 'auditor_appointment_letter', maxCount: 1 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'abstract_closing_stock', maxCount: 1 },
    { name: 'asset_list_depreciation', maxCount: 1 }
]));



export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return returnResponse(res).error('File size too large. Maximum size is 10MB', null);
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return returnResponse(res).error('Too many files. Only one file allowed', null);
        }
        return returnResponse(res).error('File upload error', error.message);
    }

    if (typeof error?.message === 'string' &&
        (error.message.includes('File type') ||
            error.message.includes('File extension') ||
            error.message.includes('File content'))) {
        return returnResponse(res).error(error.message, null);
    }

    next(error);
};

export const uploadAmedmentsfile = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 2 // Allow up to 2 files (one for each byelaw type)
    }
}).fields([
    { name: 'new_proposed_byelaw', maxCount: 1 },
    { name: 'existing_byelaw', maxCount: 1 }
]));

export const uploadChallanFile = runUploadWithValidation(multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1 // Only allow 1 file
    }
}).single('challan_url'));
