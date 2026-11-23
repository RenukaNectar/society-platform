import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  getAllSocietyRegistrations,
  getSocietyRegistrationById,
  getSocietyByUserId,
  createSocietyRegistration,
  updateSocietyRegistration,
  updateSocietyAdditionalData,
  deleteSocietyRegistration,
  findSocietyCreatedByUser,
  findSocietyRegistrationById
} from "../services/SocietyRegistrationService";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";
import { findUserById } from "../services/UserService";
import { logOperation } from "../services/HistoryService";
import { findStatusByKey } from "../services/StatusService";
import SocietyRegistration from "../models/SocietyRegistration";
import { generateSocietyCertificate } from '../services/CertificateService';
import { mediaUpload, overwriteMediaFileBuffer } from '../services/MediaService';
import { generateSocietyRegistrationNotificationPdf } from '../services/SocietyNotificationPdfService';
import Module from "../models/Module";
import ModuleWorkflow from "../models/ModuleWorkflow";
import { getUsers, notifyRegistrarsInDistrict, sendNotification } from "../services/NotificationService";
import NotificationTemplate from "../models/NotificationTemplate";
import { NOTIFICATIONS } from "../config/notifications";
import { sendNotificationEmail } from "../utils/email";
import { getNcdPayloadForSociety, uploadSocietyToNcd } from "../services/NcdApiService";
import { getUserById } from "./userController";
import Media from "../models/Media";
import SocietyConversion from "../models/SocietyConversion";
import { Op } from "sequelize";
import fs from 'fs';
import path from 'path';
import { stampByeLawPdfWithQr } from "../services/ByeLawDocumentService";
import { stampCertificatePdfWithQr } from "../services/CertificateDocumentService";
import { getDistrictById } from "../services/DistrictService";
import { getBlockById } from "../services/BlockService";
import { getBankById } from "../services/BankService";
import {
  buildAreaOfOperationConfinedTo,
  getSocietyAddress,
  resolveRegistrationVillageDetails
} from "../utils/societyAddress";
import { getAreaOfOperationLevelById } from "../services/AreaOfOperationLevelService";
import { getStateById } from "../services/StateService";
import { getConversionSectorNamesForCertificate } from "../services/SocietyConversionService";
import User from '../models/user';
import Role from '../models/Role';

/** RCS desk after applicant uploads/re-uploads challan (step 10). */
async function resolveRcsAssigneeForChallanReview(
  districtId: string | null | undefined,
  stateId: string | null | undefined,
  priorOfficerUserId: string | null | undefined
): Promise<string | null> {
  if (priorOfficerUserId) {
    const prior = await User.findByPk(priorOfficerUserId, {
      attributes: ['id', 'is_active'],
      include: [{ model: Role, as: 'role', attributes: ['name'], required: false }]
    });
    const roleName = (prior as { role?: { name?: string } } | null)?.role?.name;
    if (prior?.is_active !== false && roleName === 'rcs_district') {
      return String(prior.id);
    }
  }

  if (districtId) {
    const byDistrict = await getUsers({
      districtId,
      roleNames: ['rcs_district'],
      isActive: true
    });
    if (byDistrict.length > 0) {
      return String(byDistrict[0]);
    }
  }

  if (stateId) {
    const stateRcs = await User.findAll({
      where: {
        state_id: stateId,
        is_active: true,
        [Op.or]: [{ district_id: null }, { district_id: '' }]
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name'],
          where: { name: 'rcs_district', is_active: true },
          required: true
        }
      ],
      limit: 1
    });
    if (stateRcs.length > 0) {
      return String(stateRcs[0].id);
    }
  }

  return null;
}

/** Copy-to #10: bank.name only — never append branch_name (handles comma / dash in DB name). */
const bankNameForNotificationMemo = (
  bank: { name?: string | null; branch_name?: string | null } | null
): string => {
  if (!bank) return '';
  const rawName = String(bank.name ?? '').trim();
  const branch = String(bank.branch_name ?? '').trim();
  let name = rawName;

  // "Bank Name, Branch..." → keep part before first comma
  if (name.includes(',')) {
    name = (name.split(',')[0] ?? '').trim();
  }

  // Dropdown style: "Bank Name - Branch Name"
  if (name.includes(' - ')) {
    const dashParts = name.split(' - ').map((s) => s.trim());
    const left = dashParts[0] ?? '';
    const right = dashParts.slice(1).join(' - ');
    if (left && (!right || !branch || right === branch || /\bbranch\b/i.test(right))) {
      name = left;
    }
  }

  if (branch) {
    const escaped = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const sep of [`,\\s*`, `\\s*-\\s*`, `\\s+`]) {
      name = name.replace(new RegExp(`${sep}${escaped}\\s*\\.?$`, 'i'), '').trim();
    }
  }

  logger.info('Notification bank memo: normalized bank name', {
    raw_name: rawName,
    branch_name: branch,
    result: name
  });
  console.log('[Notification bank memo]', { raw_name: rawName, branch_name: branch, result: name });

  return name;
};

export const getSocietyRegistrations = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const filters = {
      status: req.query.status as string,
      reference_year: req.query.reference_year as string,
      from: req.query.from as string,
      to: req.query.to as string,
      district_id: req.query.district_id as string,
      state_id: req.query.state_id as string,
      cooperative_society_type_id: req.query.cooperative_society_type_id as string,
      functional_status: req.query.functional_status as string,
      has_applicant: req.query.has_applicant as string,
    };
    const result = await getAllSocietyRegistrations(
      page,
      limit,
      search,
      req.user?.userId,
      filters
    );

    returnResponse(res).ok('Society registrations retrieved successfully', {
      societyRegistrations: result.societyRegistrations,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get society registrations:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSocietyRegistrationByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const societyRegistration = await getSocietyRegistrationById(id);

    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    returnResponse(res).ok('Society registration retrieved successfully', societyRegistration);
  } catch (error) {
    logger.error('Failed to get society registration:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSocietyByUserIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const society = await getSocietyByUserId(userId);

    if (!society) {
      throw new AppError('Society not found for this user', 404);
    }

    returnResponse(res).ok('Society retrieved successfully', society);
  } catch (error) {
    logger.error('Failed to get society by user ID:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createSocietyRegistrationController = async (req: IAuthRequest, res: Response) => {
  try {
    const societyData = req.body;
    const userId = req?.user?.userId as string;

    if (!userId) {
      logger.error('User ID is missing in createSocietyRegistrationController');
      return returnResponse(res).error('User authentication required', null);
    }

    const isUserExist = await findUserById(userId)
    if (!isUserExist) {
      logger.warn('User not found in createSocietyRegistrationController', { userId });
      return returnResponse(res).error('User not found', null);
    }

    const isSocietyAlreadyCreatedByUser = await findSocietyCreatedByUser(userId)

    if (isSocietyAlreadyCreatedByUser) {
      return returnResponse(res).error('Society already registered by this user', null);
    }
    const newSociety = await createSocietyRegistration(societyData, req);

    return returnResponse(res).ok('Society registration created successfully', newSociety);

  } catch (error) {
    logger.error('Failed to create society registration:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const updateSocietyRegistrationController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const societyData = req.body;

    // Lightweight existence check only — avoid heavy getSocietyRegistrationById (workflow + conversion) on every save; that caused gateway timeouts on draft PUT.
    const isUserExist = await findSocietyRegistrationById(id);
    if (!isUserExist) {
      return returnResponse(res).error('Society registration not found', null);
    }
    const newSociety = await updateSocietyRegistration(id, societyData, req);

    if (!newSociety) {
      return returnResponse(res).error('Failed to resubmit your application', null);
    }
    returnResponse(res).ok('Your application has been resubmitted', newSociety);

  } catch (error) {
    logger.error('Failed to resubmit your application:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error) {
      const errorAny = error as any;
      const statusCode =
        typeof errorAny?.statusCode === 'number' ? errorAny.statusCode : 500;
      throw new AppError(errorAny.message || 'Internal server error', statusCode);
    }
    throw new AppError(String(error) || 'Internal server error', 500);
  }
};

export const updateSocietyAdditionalDataController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { additional_data, sector_of_operation } = req.body;

    const updatedSociety = await updateSocietyAdditionalData(
      id,
      { additional_data, sector_of_operation },
      req
    );

    returnResponse(res).ok('Society additional data saved successfully', updatedSociety);
  } catch (error) {
    logger.error('Failed to update society additional data:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error) {
      const errorAny = error as any;
      const statusCode =
        typeof errorAny?.statusCode === 'number' ? errorAny.statusCode : 500;
      throw new AppError(errorAny.message || 'Internal server error', statusCode);
    }
    throw new AppError(String(error) || 'Internal server error', 500);
  }
};

export const deleteSocietyRegistrationController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const deletedSociety = await deleteSocietyRegistration(id, req);

    if (!deletedSociety) {
      throw new AppError('Society registration not found', 404);
    }

    returnResponse(res).ok('Society registration deleted successfully', null);

  } catch (error) {
    logger.error('Failed to delete society registration:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const uploadChallanController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req?.user?.userId as string;

    if (!id || !userId) {
      throw new AppError('Society ID and user authentication required', 400);
    }

    const societyRegistration = await findSocietyRegistrationById(id);
    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    if (!req.file) {
      throw new AppError('Challan file is required', 400);
    }

    if (req.file.mimetype !== 'application/pdf') {
      throw new AppError('Only PDF files are allowed for challan upload', 400);
    }

    const { mediaUpload } = await import('../services/MediaService');

    const fileData = {
      originalname: req.file.originalname?.replace(/ /g, '_'),
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      userId: userId
    };

    const media = await mediaUpload(fileData, userId);
    if (!media) {
      throw new AppError('Failed to upload challan file', 500);
    }

    const mediaId = media.id;

    // Get SOCIETY_REGISTRATION module
    const module = await Module.findOne({
      where: { key: 'SOCIETY_REGISTRATION', active: true }
    });

    if (!module) {
      throw new AppError('SOCIETY_REGISTRATION module not found. Please ensure modules are seeded.', 500);
    }

    const workflowStepLevel10 = await ModuleWorkflow.findOne({
      where: {
        module_id: module.id,
        sequence: 10,
        active: true
      }
    });

    if (!workflowStepLevel10) {
      throw new AppError('Workflow step for level 10 (RCS final review) not found. Please ensure workflow steps are seeded.', 500);
    }

    const status = await findStatusByKey('challan_uploaded');
    if (!status) {
      throw new AppError('challan_uploaded status not found', 404);
    }

    const districtId = societyRegistration.district_id;
    const stateId = societyRegistration.state_id;
    const priorOfficerUserId = societyRegistration.status_changed_by;
    const assignedToUserId = await resolveRcsAssigneeForChallanReview(
      districtId,
      stateId,
      priorOfficerUserId
    );

    if (!assignedToUserId) {
      throw new AppError(
        'No RCS officer could be assigned for challan review. Ensure an active rcs_district user exists for this district or state.',
        503
      );
    }

    // Challan upload completes applicant step (9); case moves to RCS final step (10).
    const updateData = {
      challan_receipt: mediaId,
      challan_receipt_at: new Date(),
      status: status.id,
      workflow_status: workflowStepLevel10.id,
      status_changed_by: userId,
      status_changed_at: new Date(),
      assigned_to_user_id: assignedToUserId
    };

    const updatedSociety = await SocietyRegistration.update(updateData, { where: { id } });
    if (!updatedSociety) {
      throw new AppError('Failed to update society registration with challan details', 500);
    }

    await logOperation(
      'society_registration',
      'challan_uploaded',
      societyRegistration.society_id,
      userId,
      `Challan uploaded with media ID: ${mediaId}`
    );

    if (districtId) {
      try {
        const districtRcsUserIds = await getUsers({
          districtId,
          roleNames: ['rcs_district'],
          isActive: true
        });
        const rcsUserIds = Array.from(new Set([
          ...districtRcsUserIds,
          assignedToUserId
        ].filter((recipientId): recipientId is string => Boolean(recipientId))));
        if (rcsUserIds.length > 0) {
          const uploader = await findUserById(userId);
          const username =
            uploader && typeof (uploader as any).getFullName === 'function'
              ? (uploader as any).getFullName()
              : [uploader?.first_name, uploader?.last_name].filter(Boolean).join(' ') || 'Applicant';
          const societyName =
            societyRegistration.cooperative_society_name ||
            (societyRegistration as any).local_langauge_society_name ||
            'Society';

          let notifTitle: string = NOTIFICATIONS.notifications.society.registration.challan_uploaded.title as string;
          let notifDescription = `${username} has uploaded the challan for ${societyName}.`;
          const tpl = await NotificationTemplate.findOne({
            where: { key: 'society_challan_uploaded', active: true }
          });
          if (tpl?.description) {
            notifTitle = tpl.title as string;
            notifDescription = tpl.description
              .replace(/\{\{username\}\}/g, username)
              .replace(/\{\{SocietyName\}\}/g, societyName);
          }

          await sendNotification(rcsUserIds, {
            title: notifTitle,
            description: notifDescription,
            redirect_path: NOTIFICATIONS.notifications.society.registration.challan_uploaded.path.replace(
              '{id}',
              id
            ),
            data: {
              resource_id: id,
              module_name: 'SOCIETY_REGISTRATION',
              action: 'challan_uploaded',
              district_id: districtId
            },
            created_by: userId,
            notification_template_id: tpl?.id
          });
          logger.info('Challan upload notification sent to RCS (same district)', {
            districtId,
            recipientCount: rcsUserIds.length
          });
        } else {
          logger.warn('Challan uploaded but no rcs_district users in district', { districtId });
        }
      } catch (notifErr: any) {
        logger.error('Challan upload RCS notification failed', {
          error: notifErr?.message,
          districtId
        });
      }
    } else {
      logger.warn('Challan uploaded but registration has no district_id; RCS notification skipped');
    }

    returnResponse(res).ok('Challan uploaded successfully', {
      mediaId,
      uploadedAt: updateData.challan_receipt_at,
      uploadedBy: userId,
      workflowLevel: 10,
      assignedToUserId: assignedToUserId ?? undefined,
      status: 'challan_uploaded'
    });

  } catch (error) {
    logger.error('Failed to upload challan:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const issueCertificateController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const rawIsConversion = req.query?.is_conversion;
    const isConversionValue = Array.isArray(rawIsConversion) ? rawIsConversion[0] : rawIsConversion;
    const isConversion = String(isConversionValue ?? '').toLowerCase() === 'true' || String(isConversionValue ?? '') === '1';
    const userId = req?.user?.userId as string;
    const user_signature = await findUserById(userId);
    if (!id || !userId) {
      throw new AppError('Society ID and user authentication required', 400);
    }

    const societyRegistration = await getSocietyRegistrationById(id);
    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    if (req.user?.role !== 'rcs_district') {
      throw new AppError('Only registrars can issue certificates', 403);
    }

    // Get the user who last updated the society status
    let statusUpdatedByUser = null;
    if (societyRegistration.status_changed_by) {
      try {
        statusUpdatedByUser = await findUserById(societyRegistration.status_changed_by);
      } catch (error) {
        logger.warn('Could not find user who updated status:', error);
      }
    }

    // Get the current user details for certificate issuance
    let currentUser = null;
    try {
      currentUser = await findUserById(userId);
    } catch (error) {
      logger.warn('Could not find current user:', error);
    }

    const regId = societyRegistration.society_id || societyRegistration.id;
    const fullAddressFromRegistration =
      societyRegistration.full_address != null && String(societyRegistration.full_address).trim() !== ''
        ? String(societyRegistration.full_address).trim()
        : '';
    const societyAddressResult = await getSocietyAddress(regId).catch(() => null);
    const districtId = (societyRegistration as any).district_id as string | undefined;
    let districtDisplay =
      societyAddressResult?.parts?.district_name?.trim() ||
      (societyRegistration as any).district?.name?.trim();
    let districtHeadquarters = String(
      (societyRegistration as any).district?.district_headquarters ?? ''
    ).trim();
    if ((!districtDisplay || !districtHeadquarters) && districtId) {
      const dRow = await getDistrictById(districtId).catch(() => null);
      if (!districtDisplay) districtDisplay = dRow?.name?.trim();
      if (!districtHeadquarters) {
        districtHeadquarters = String(dRow?.district_headquarters ?? '').trim();
      }
    }
    const districtName = districtDisplay || 'N/A';

    let stateDisplay = (societyRegistration as any).state?.name?.trim();
    if (!stateDisplay && (societyRegistration as any).state_id) {
      const stateRow = await getStateById((societyRegistration as any).state_id).catch(() => null);
      stateDisplay = stateRow?.name?.trim();
    }
    const stateName = stateDisplay || 'Arunachal Pradesh';

    let village_code: string | undefined;
    let village_name: string | undefined;
    if (societyRegistration.village_code) {
      const villageDetails = await resolveRegistrationVillageDetails(societyRegistration.village_code);
      village_code = villageDetails.village_code ?? undefined;
      village_name =
        villageDetails.village_name ??
        societyAddressResult?.parts?.village_name?.trim() ??
        undefined;
    }
    // Urban "town" selection may be stored as local body when village is absent
    if (!village_name) {
      village_name =
        societyAddressResult?.parts?.local_body_name?.trim() ||
        societyAddressResult?.parts?.village_name?.trim() ||
        undefined;
    }
    const areaOfOperationLevelRow = societyRegistration.area_of_operation_id
      ? await getAreaOfOperationLevelById(societyRegistration.area_of_operation_id).catch(() => null)
      : null;

    let blockName: string | null =
      societyAddressResult?.parts?.block_name?.trim() ||
      (societyRegistration as any).block?.name?.trim() ||
      null;
    if ((!blockName || blockName === 'N/A') && (societyRegistration as any).block_id) {
      const blockRow = await getBlockById((societyRegistration as any).block_id).catch(() => null);
      blockName = blockRow?.name?.trim() || null;
    }
    if (blockName === 'N/A') blockName = null;

    const areaOfOperationConfinedTo = buildAreaOfOperationConfinedTo({
      districtName,
      stateName,
      village_name,
      blockName,
      areaOfOperationLevelName: areaOfOperationLevelRow?.name
    });

    let conversionFromSocietyLabel: string | undefined;
    let conversionToSocietyLabel: string | undefined;
    let originalRegistrationNumber: string | undefined;
    let conversionDate: string | undefined;
    let conversionOriginalAddress: string | undefined;
    let conversionConvertedAddress: string | undefined;

    if (isConversion) {
      const conversionSectors = await getConversionSectorNamesForCertificate(id);
      conversionFromSocietyLabel = conversionSectors.fromSocietyLabel;
      conversionToSocietyLabel = conversionSectors.toSocietyLabel;
      originalRegistrationNumber =
        conversionSectors.originalRegistrationNumber ||
        societyRegistration.registration_number ||
        undefined;
      conversionDate = conversionSectors.conversionDate || undefined;
      conversionOriginalAddress =
        conversionSectors.originalAddress?.trim() || fullAddressFromRegistration || undefined;
      conversionConvertedAddress =
        conversionSectors.convertedAddress?.trim() || conversionOriginalAddress;
    }

    // Single issuance instant (IST formatting applied in PDF helpers) for certificate,
    // notification, and RCS-stamped bye-law / rcs_observations docs.
    const issuedAt = new Date();

    // Generate certificate PDF
    const certificateData = {
      is_conversion: isConversion,
      societyId: societyRegistration.society_id,
      societyName: societyRegistration.cooperative_society_name || 'N/A',
      localLanguageName: societyRegistration.local_langauge_society_name || 'N/A',
      registrationNumber: societyRegistration.registration_number || 'N/A',
      // Current API-call time so certificate "Dated ..." / signature time match issuance.
      dateOfRegistration: issuedAt.toISOString(),
      societyType: societyRegistration.cooperativeSocietyType?.name || 'N/A',
      registrationAuthority: societyRegistration.registrationAuthority?.name || 'N/A',
      state: stateName,
      district: districtName,
      pincode: societyRegistration.pincode || 'N/A',
      block: blockName || 'N/A',
      address: isConversion
        ? (conversionOriginalAddress || fullAddressFromRegistration)
        : fullAddressFromRegistration,
      contactPerson: societyRegistration.mobile_number_of_secretary ? 'Secretary' : 'N/A',
      mobile: societyRegistration.mobile_number_of_secretary ? String(societyRegistration.mobile_number_of_secretary) : 'N/A',
      email: societyRegistration.email || 'N/A',
      village_name,
      conversionFrom: conversionFromSocietyLabel,
      conversionTo: conversionToSocietyLabel,
      conversionFromAddress: conversionOriginalAddress,
      conversionToAddress: conversionConvertedAddress,
      originalRegistrationNumber,
      conversionDate,
      areaOfOperationConfinedTo,
      area_of_operation_id: societyRegistration.area_of_operation_id || undefined,
      areaOfOperation: societyRegistration.operation_area_location || undefined,
      issuedBy: {
        firstName: statusUpdatedByUser?.first_name || currentUser?.first_name || 'N/A',
        lastName: statusUpdatedByUser?.last_name || currentUser?.last_name || 'N/A',
        fullName: statusUpdatedByUser ?
          `${statusUpdatedByUser.first_name || ''} ${statusUpdatedByUser.last_name || ''}`.trim() :
          currentUser ?
            `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() :
            'N/A'
      },
      // signature_media: user_signature?.media?.dataValues?.url ?? null
      signature_media: (user_signature as any)?.media?.url ?? null
    };

    const certificateBuffer = await generateSocietyCertificate(certificateData);

    // Upload certificate as media
    const mediaData = {
      originalname: `certificate_${societyRegistration.society_id}.pdf`,
      mimetype: 'application/pdf',
      size: certificateBuffer.length,
      buffer: certificateBuffer,
      userId
    };

    const uploadedMedia = await mediaUpload(mediaData, userId);

    // Stamp the certificate PDF with a verification QR (mirrors bye-law QR flow).
    // QR encodes the public download URL of the just-uploaded certificate media.
    try {
      const baseUrl = String(process.env.API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      const certificateQrDownloadUrl = `${baseUrl}/api/v1/public/media/${uploadedMedia.id}/download`;

      const stampedCertificate = await stampCertificatePdfWithQr(
        {
          originalname: mediaData.originalname,
          mimetype: 'application/pdf',
          size: certificateBuffer.length,
          buffer: certificateBuffer,
          userId
        },
        {
          societyRegistrationId: id,
          mediaId: uploadedMedia.id,
          certificateType: isConversion ? 'conversion' : 'registration',
          uploadedByUserId: userId,
          uploadedByName: currentUser
            ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || undefined
            : undefined,
          qrDownloadUrl: certificateQrDownloadUrl
        }
      );

      await overwriteMediaFileBuffer(uploadedMedia.id, stampedCertificate.buffer, userId);
    } catch (certStampErr: any) {
      // QR stamping is non-critical; do not fail certificate issuance.
      logger.warn('Certificate QR stamping failed during issuance', {
        id,
        certificateMediaId: uploadedMedia.id,
        error: certStampErr?.message || String(certStampErr)
      });
    }

    // Generate notification PDF (as per govt notification format) and upload
    const notificationNumber = societyRegistration.registration_number
      ? String(societyRegistration.registration_number).trim()
      : `NO.COOP(ORG)/${societyRegistration.society_id}/${new Date().getFullYear()}/`;

    const regDistrictId = (societyRegistration as any)?.district_id as string | undefined;
    let notificationMemoDistrictName = String(
      districtName !== 'N/A' ? districtName : ((societyRegistration as any)?.district?.name ?? "")
    ).trim();
    let notificationMemoDistrictHq = districtHeadquarters;
    if ((!notificationMemoDistrictName || !notificationMemoDistrictHq) && regDistrictId) {
      const districtRow = await getDistrictById(regDistrictId).catch(() => null);
      if (!notificationMemoDistrictName) {
        notificationMemoDistrictName = String(districtRow?.name ?? "").trim();
      }
      if (!notificationMemoDistrictHq) {
        notificationMemoDistrictHq = String(districtRow?.district_headquarters ?? "").trim();
      }
    }
    const notificationMemoDistrict = notificationMemoDistrictName
      ? `${notificationMemoDistrictName} District`
      : "the concerned District";
    // e.g. "Lower Siang District, Likabali"
    const notificationMemoDistrictPlace = notificationMemoDistrictHq
      ? `${notificationMemoDistrict}, ${notificationMemoDistrictHq}`
      : notificationMemoDistrict;

    const contactPerson = String((societyRegistration as any)?.contact_person ?? '').trim();
    const promoterDesignation = String((societyRegistration as any)?.designation ?? '').trim();
    const chiefPromoterLabel =
      contactPerson && promoterDesignation
        ? `${contactPerson}, ${promoterDesignation}`
        : contactPerson || promoterDesignation || 'Chief Promoter';
    const notificationSocietyNameUpper = (
      societyRegistration.cooperative_society_name ||
      societyRegistration.local_langauge_society_name ||
      ''
    )
      .toString()
      .toUpperCase();
    const defaultBankMemoLine =
      'The Branch Manager, A.P. State Rural Bank.';
    const societyBankType = String((societyRegistration as any)?.bank_type ?? '')
      .trim()
      .toLowerCase();
    const societyBankId =
      societyBankType === 'cooperative'
        ? String((societyRegistration as any)?.cooperative_society_bank_id ?? '').trim()
        : societyBankType === 'commercial'
          ? String((societyRegistration as any)?.other_bank ?? '').trim()
          : '';
    let notificationBankMemoLine = defaultBankMemoLine;
    logger.info('Notification bank memo: building Copy-to line', {
      societyRegistrationId: id,
      societyId: societyRegistration.society_id,
      bank_type: societyBankType,
      bank_id: societyBankId || null,
      defaultBankMemoLine
    });
    if (societyBankId) {
      const bank = await getBankById(societyBankId).catch((err) => {
        logger.warn('Notification bank memo: getBankById failed', {
          societyRegistrationId: id,
          bank_id: societyBankId,
          error: err instanceof Error ? err.message : String(err)
        });
        return null;
      });
      logger.info('Notification bank memo: bank record from DB', {
        societyRegistrationId: id,
        bank_id: societyBankId,
        bank_found: !!bank,
        bank_name: bank?.name ?? null,
        bank_branch_name: bank?.branch_name ?? null,
        bank_city: (bank as any)?.city ?? null
      });
      const bankName = bankNameForNotificationMemo(bank);
      if (bankName) {
        notificationBankMemoLine = `The Branch Manager, ${bankName}.`;
      }
    }
    logger.info('Notification bank memo: final Copy-to line', {
      societyRegistrationId: id,
      notificationBankMemoLine
    });

    const registrarSignedByName = currentUser
      ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
      : undefined;
    const registrarDesignationLines = ['Registrar', 'Cooperative Societies,'];

    const quotedSocietyName = `"${notificationSocietyNameUpper}"`;

    const notificationPdfBuffer = await generateSocietyRegistrationNotificationPdf({
      notificationNumber,
      issuedPlace: 'Naharlagun',
      issuedDate: issuedAt,
      section: '9',
      is_conversion: isConversion,
      societyName: societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name || 'N/A',
      conversionFromSocietyName: isConversion ? conversionFromSocietyLabel : undefined,
      conversionToSocietyName: isConversion ? conversionToSocietyLabel : undefined,
      conversionToAddress: isConversion ? conversionConvertedAddress : undefined,
      originalRegistrationDate: isConversion
        ? (societyRegistration.date_registration
            ? new Date(societyRegistration.date_registration)
            : conversionDate
              ? new Date(conversionDate)
              : undefined)
        : undefined,
      societyTypeLine: isConversion
        ? undefined
        : (societyRegistration as any)?.cooperativeSocietyType?.name || undefined,
      registrationNumber: societyRegistration.registration_number || undefined,
      // Same issuance instant as certificate signature / Dated line.
      createdDate: issuedAt,
      // district: (societyRegistration as any)?.district?.id || undefined,
      // state: (societyRegistration as any)?.state?.name || undefined,
      pincode: (societyRegistration as any)?.pincode || undefined,
      district: (societyRegistration as any)?.district_id || undefined,
      state: (societyRegistration as any)?.state_id || undefined,
      address: (isConversion ? conversionOriginalAddress : fullAddressFromRegistration) || undefined,
      validityUpto: isConversion
        ? undefined
        : societyRegistration.certificate_issue_date
          ? new Date(societyRegistration.certificate_issue_date).toLocaleDateString('en-GB')
          : undefined,
      area_of_operation_id: societyRegistration.area_of_operation_id || undefined,
      areaOfOperation: societyRegistration.operation_area_location || undefined,
      village_code,
      village_name,
      blockName,
      areaOfOperationConfinedTo,
      signedByName: registrarSignedByName,
      signedBySignatureUrl: (user_signature as any)?.media?.url ?? null,
      signedByDesignationLines: registrarDesignationLines,
      memoCopyToLines: [
        'The PPS to Hon’ble Chief Minister, Arunachal Pradesh, Itanagar.',
        'The Director, Printing, Govt. of Arunachal Pradesh, Papunallah, Naharlagun with request to publish this Notification in the next issue of A.P. Gazette.',
        `The Deputy Commissioner, ${notificationMemoDistrictPlace} for information.`,
        `The Assistant Registrar of Cooperative Societies, ${notificationMemoDistrictPlace} along with a copy of Registered Bye-laws and Registration Certificate.`,
        `${chiefPromoterLabel}, ${quotedSocietyName} ${fullAddressFromRegistration} along with a copy of Registered Bye-laws and registration certificate.`,
        'The DRCS (Audit)Hqs.',
        'The ARCS (Statistics) Hqs.',
        'The Managing Director, A.P. State Cooperative Apex Bank Ltd, Naharlagun.',
        'The Chief Executive Officer, A.P. State Cooperative Union, Naharlagun.',
        notificationBankMemoLine,
        'Spare copy/Guard copy.'
      ],

      memoCopyToConversion: [
        'The PPS to Hon’ble Chief Minister, Arunachal Pradesh, Itanagar.',
        'The Director, Printing, Govt. of Arunachal Pradesh, Papunallah, Naharlagun with request to publish this Notification in the next issue of A.P. Gazette.',
        `The Deputy Commissioner, ${notificationMemoDistrictPlace} for information.`,
        `The Assistant Registrar of Cooperative Societies, ${notificationMemoDistrictPlace}, along with a copy of Registered Bye-laws and Registration Certificate.`,
        `"${conversionFromSocietyLabel}", ${chiefPromoterLabel}, ${conversionOriginalAddress || fullAddressFromRegistration} for information along with a copy of Registered Bye-laws and registration certificate. He should surrender Certificates of Registration, Notification of Registration and Bye-laws of "${conversionFromSocietyLabel}", Seren to this office.`,
        'The DRCS (Audit)Hqs.',
        'The ARCS (Statistics) Hqs.',
        'The Managing Director, A.P. State Cooperative Apex Bank Ltd., Naharlagun',
        'The Chief Executive Officer, A.P. State Cooperative Union, Naharlagun.',
        notificationBankMemoLine,
        `General correspondence files of, “${(conversionFromSocietyLabel || societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name || '').toString().toUpperCase()}” ${conversionOriginalAddress || fullAddressFromRegistration}`,
        'Office copy.'
      ]

    });

    const uploadedNotificationMedia = await mediaUpload({
      originalname: `notification_${societyRegistration.society_id}.pdf`,
      mimetype: 'application/pdf',
      size: notificationPdfBuffer.length,
      buffer: notificationPdfBuffer,
      userId
    }, userId);

    // Stamp the notification PDF with a verification QR (mirrors certificate QR flow).
    // QR encodes the public download URL of the just-uploaded notification media.
    try {
      const baseUrl = String(process.env.API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
      const notificationQrDownloadUrl = `${baseUrl}/api/v1/public/media/${uploadedNotificationMedia.id}/download`;

      const stampedNotification = await stampCertificatePdfWithQr(
        {
          originalname: `notification_${societyRegistration.society_id}.pdf`,
          mimetype: 'application/pdf',
          size: notificationPdfBuffer.length,
          buffer: notificationPdfBuffer,
          userId
        },
        {
          societyRegistrationId: id,
          mediaId: uploadedNotificationMedia.id,
          certificateType: isConversion ? 'conversion-notification' : 'notification',
          uploadedByUserId: userId,
          uploadedByName: currentUser
            ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || undefined
            : undefined,
          qrDownloadUrl: notificationQrDownloadUrl
        }
      );

      await overwriteMediaFileBuffer(uploadedNotificationMedia.id, stampedNotification.buffer, userId);
    } catch (notifStampErr: any) {
      // QR stamping is non-critical; do not fail certificate issuance.
      logger.warn('Notification QR stamping failed during issuance', {
        id,
        notificationMediaId: uploadedNotificationMedia.id,
        error: notifStampErr?.message || String(notifStampErr)
      });
    }

    // Stamp Bye-law PDF with QR + RCS signature at issuance time (not at upload time)
    try {
      if (societyRegistration.bye_laws) {
        const byeLawMediaId = String(societyRegistration.bye_laws);
        const byeLawMedia = await Media.findByPk(byeLawMediaId);
        if (byeLawMedia?.url) {
          const filePath = path.resolve(__dirname, '../../uploads', path.basename(byeLawMedia.url));
          if (fs.existsSync(filePath)) {
            const baseUrl = String(process.env.API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
            const qrDownloadUrl = `${baseUrl}/api/v1/public/media/${byeLawMediaId}/download`;

            const originalBytes = fs.readFileSync(filePath);
            const stamped = await stampByeLawPdfWithQr(
              {
                originalname: `bye_law_${societyRegistration.society_id}.pdf`,
                mimetype: 'application/pdf',
                size: originalBytes.length,
                buffer: originalBytes,
                userId
              },
              {
                societyRegistrationId: id,
                mediaId: byeLawMediaId,
                uploadedByUserId: userId,
                signedByName: registrarSignedByName,
                signedByDesignationLines: registrarDesignationLines,
                signatureMediaUrl: (user_signature as any)?.media?.url ?? null,
                qrDownloadUrl,
                issuedAt,
              }
            );

            await overwriteMediaFileBuffer(byeLawMediaId, stamped.buffer, userId);
          } else {
            logger.warn('Bye-law media file missing on server; skipping stamping', { byeLawMediaId, id });
          }
        } else {
          logger.warn('Bye-law media not found; skipping stamping', { byeLawMediaId, id });
        }
      }
    } catch (byeLawStampErr: any) {
      // Do not fail certificate issuance if bye-law stamping fails
      logger.warn('Bye-law stamping failed during certificate issuance', {
        id,
        error: byeLawStampErr?.message || String(byeLawStampErr)
      });
    }

    // Stamp society conversion bye-law (same society_id) when present — mirrors registration bye-law handling
    try {
      if (societyRegistration.society_id) {
        const conversion = await SocietyConversion.findOne({
          where: {
            society_id: societyRegistration.society_id,
            bye_laws: { [Op.ne]: null }
          },
          order: [['updated_at', 'DESC']]
        });

        if (conversion?.bye_laws) {
          const convByeLawMediaId = String(conversion.bye_laws);
          const convByeLawMedia = await Media.findByPk(convByeLawMediaId);
          if (convByeLawMedia?.url) {
            const convFilePath = path.resolve(__dirname, '../../uploads', path.basename(convByeLawMedia.url));
            if (fs.existsSync(convFilePath)) {
              const baseUrl = String(process.env.API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
              const convQrDownloadUrl = `${baseUrl}/api/v1/public/media/${convByeLawMediaId}/download`;

              const convOriginalBytes = fs.readFileSync(convFilePath);
              const convStamped = await stampByeLawPdfWithQr(
                {
                  originalname: `bye_law_conversion_${conversion.id}.pdf`,
                  mimetype: 'application/pdf',
                  size: convOriginalBytes.length,
                  buffer: convOriginalBytes,
                  userId
                },
                {
                  societyRegistrationId: id,
                  mediaId: convByeLawMediaId,
                  uploadedByUserId: userId,
                  signedByName: registrarSignedByName,
                  signedByDesignationLines: registrarDesignationLines,
                  signatureMediaUrl: (user_signature as any)?.media?.url ?? null,
                  qrDownloadUrl: convQrDownloadUrl,
                  issuedAt,
                }
              );

              await overwriteMediaFileBuffer(convByeLawMediaId, convStamped.buffer, userId);
              logger.info('Conversion bye-law stamped during registration certificate issuance', {
                societyId: societyRegistration.society_id,
                conversionId: conversion.id,
                convByeLawMediaId
              });
            } else {
              logger.warn('Conversion bye-law media file missing on server; skipping stamping', {
                convByeLawMediaId,
                conversionId: conversion.id
              });
            }
          } else {
            logger.warn('Conversion bye-law media row not found; skipping stamping', {
              convByeLawMediaId,
              conversionId: conversion.id
            });
          }
        }
      }
    } catch (conversionByeLawErr: any) {
      logger.warn('Conversion bye-law stamping failed during certificate issuance', {
        societyRegistrationId: id,
        societyId: societyRegistration.society_id,
        error: conversionByeLawErr?.message || String(conversionByeLawErr)
      });
    }

    const status = await findStatusByKey('certificate_issued')

    const updateData = {
      status: status?.id,
      certificate_issued: true,
      certificate_media_id: uploadedMedia.id,
      notification_media_id: uploadedNotificationMedia.id,
      catificate_issued_by: userId,
      status_changed_by: userId,
      status_changed_at: new Date()
    };

    const updatedSociety = await SocietyRegistration.update(updateData, { where: { id } });
    if (!updatedSociety) {
      throw new AppError('Failed to update society registration with certificate status', 500);
    }


    // Post-issuance side effects must not fail certificate issuance (SMTP/notify often break on nectar/dev).
    try {
      if (societyRegistration.district_id) {
        const district = societyRegistration.district_id;
        const notifictionData = {
          title: NOTIFICATIONS.notifications.society.registration.certificate_issued.title,
          description: 'Certificate issued successfully',
          data: {
            societyRegistration: societyRegistration
          },
          redirect_path: NOTIFICATIONS.notifications.society.registration.certificate_issued.path.replace('{id}', societyRegistration.id),
          created_by: userId
        };
        await notifyRegistrarsInDistrict(district, notifictionData, ['rcs_district']);

        if (userId) {
          const applicant = await findUserById(userId);
          const message = `Your society registration certificate has been issued: ${societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name}`;
          const actionUrl = NOTIFICATIONS.notifications.society.registration.certificate_issued.path.replace('{id}', societyRegistration.id);

          if (applicant?.id) {
            try {
              await sendNotification(applicant.id, {
                title: NOTIFICATIONS.notifications.society.registration.certificate_issued.title,
                description: message,
                redirect_path: actionUrl,
                created_by: userId
              });
            } catch (notifyErr: any) {
              logger.warn('Applicant in-app notification failed after certificate issue', {
                societyRegistrationId: id,
                error: notifyErr?.message || String(notifyErr)
              });
            }
          }

          if (applicant?.email) {
            try {
              await sendNotificationEmail(
                applicant.email,
                NOTIFICATIONS.notifications.society.registration.certificate_issued.title as any,
                message,
                actionUrl
              );
            } catch (emailErr: any) {
              logger.warn('Applicant email failed after certificate issue', {
                societyRegistrationId: id,
                email: applicant.email,
                error: emailErr?.message || String(emailErr)
              });
            }
          }
        }
      }
    } catch (sideEffectErr: any) {
      logger.warn('Post-certificate notification side effects failed', {
        societyRegistrationId: id,
        error: sideEffectErr?.message || String(sideEffectErr)
      });
    }

    try {
      await logOperation(
        'society_registration',
        'certificate_issued',
        societyRegistration.society_id,
        userId,
        `Certificate issued by registrar: ${userId}, Media ID: ${uploadedMedia.id}`
      );
    } catch (historyErr: any) {
      logger.warn('History log failed after certificate issue', {
        societyRegistrationId: id,
        error: historyErr?.message || String(historyErr)
      });
    }

    // Trigger NCD upload (fire-and-forget; certificate issuance does not depend on NCD success)
    uploadSocietyToNcd(id).then((result) => {
      if (result.success) {
        logger.info('NCD upload completed after certificate issue', { societyRegistrationId: id });
      } else {
        logger.warn('NCD upload failed after certificate issue', { societyRegistrationId: id, error: result.error });
      }
    }).catch((err) => {
      logger.warn('NCD upload error after certificate issue', { societyRegistrationId: id, error: err?.message });
    });

    returnResponse(res).ok('Certificate issued successfully', {
      status: 'certificate_issued',
      issuedBy: userId,
      issuedAt,
      certificateMediaId: uploadedMedia.id,
      certificateUrl: uploadedMedia.url,
      notificationMediaId: uploadedNotificationMedia.id,
      notificationUrl: uploadedNotificationMedia.url,
      ...(village_code ? { village_code } : {}),
      ...(village_name ? { village_name } : {}),
      areaOfOperationConfinedTo
    });

  } catch (error) {
    logger.error('Failed to issue certificate:', error);
    if (error instanceof AppError) {
      throw error;
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new AppError(`Failed to issue certificate: ${detail}`, 500);
  }
};

/** Get NCD API payload for a society (preview / format for NCD upload). */
export const getNcdPayloadController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      throw new AppError('Society registration ID is required', 400);
    }
    const payload = await getNcdPayloadForSociety(id);
    returnResponse(res).ok('NCD payload generated', payload);
  } catch (error) {
    logger.error('Failed to get NCD payload:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

/** Upload society data to NCD API. */
export const uploadToNcdController = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      throw new AppError('Society registration ID is required', 400);
    }
    const result = await uploadSocietyToNcd(id);
    if (!result.success) {
      return returnResponse(res).error(result.error || 'NCD upload failed', result.data);
    }
    returnResponse(res).ok('Society data uploaded to NCD successfully', result.data);
  } catch (error) {
    logger.error('Failed to upload to NCD:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Internal server error', 500);
  }
};

export default {
  getSocietyRegistrations,
  getSocietyRegistrationByIdController,
  getSocietyByUserIdController,
  createSocietyRegistrationController,
  updateSocietyRegistrationController,
  updateSocietyAdditionalDataController,
  deleteSocietyRegistrationController,
  uploadChallanController,
  issueCertificateController,
  getNcdPayloadController,
  uploadToNcdController
}; 