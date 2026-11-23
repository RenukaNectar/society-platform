import { Op, Transaction } from 'sequelize';
import SocietyRegistration from '../models/SocietyRegistration';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import sequelize from '../config/sequelize';
import Member from '../models/Member';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { IAuthRequest } from '../types';
import { findStatusByKey, findStatusById, getAllStatuses } from './StatusService';
import { getAllFunctionalStatuses } from './FunctionalStatusService';
import { findUserById, getSocietyByUserId as societyDetails } from '../services/UserService'
import {
  notifyInspectorsInDistrict,
  notifyRegistrarsInDistrict,
  sendNotification,
  getUsers
} from './NotificationService';
import User from '../models/user';
import Role from '../models/Role';
import State from '../models/State';
import District from '../models/District';
import Block from '../models/Block';
import { normalizeOptionalSocietyRegistrationFields } from '../utils/societyRegistrationOptionalFields';
import { assertRequiredSocietyRegistrationDocuments } from '../utils/societyRegistrationRequiredDocuments';
import {
  assertSocietyNameFormat,
  normalizeSocietyName,
  resolveSocietyNameFromBody,
} from '../utils/societyNameRules';
import RegistrationAuthority from '../models/RegistrationAuthority';
import CooperativeSocietyType from '../models/CooperativeSocietyType';
import SectorOfOperation from '../models/SectorOfOperation';
import Status from '../models/Status';
import Media from '../models/Media';
import { logOperation } from './HistoryService';
import { NOTIFICATIONS } from '../config';
import { createActivity } from './ActiviesService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import FunctionalStatus from '../models/FunctionalStatus';
import AreaOfOperation from '../models/AreaOfOperationLevel';
import WaterBodyType from '../models/WaterBodyType';
import SocietyConversion from '../models/SocietyConversion';
import SocietyType from '../models/SocietyType';
import { resolveLatestRenewalChallanReceipt } from './SocietyRenewalService';
import { generateNcdId } from '../utils/NcdNumberGenerate';
import { getStateById } from './StateService';
import { getSectorOfOperationById } from './SectorOfOperationService';
import { syncPrimaryBusinessActivityFromRegistration } from './BusinessActivityService';
import { sendNotificationEmail, sendNotificationEmailToMultipleUsers } from '../utils/email';
import {
  formatWorkflowStatusForApi,
  getWorkflowStatus,
  getWorkflowIdByModuleAndSequence
} from './WorkflowUtilService';

const PROMOTER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Keep each promoter's own name and mobile. Client row ids that are not UUIDs are ignored. */
const preparePromoterRows = (members: any[]) => {
  const seenMobiles = new Set<string>();
  return members.map((member, index) => {
    const name = String(member?.name ?? '').trim();
    const mobile = String(member?.mobile ?? '').replace(/\D/g, '');
    if (mobile) {
      if (seenMobiles.has(mobile)) {
        throw new AppError(
          `Promoter ${index + 1} uses mobile number ${mobile}, which is already recorded for another promoter. Enter each promoter's own mobile number.`,
          400
        );
      }
      seenMobiles.add(mobile);
    }
    const rawId = String(member?.id ?? '');
    return {
      id: PROMOTER_UUID.test(rawId) ? rawId : undefined,
      name,
      mobile,
      gender: member?.gender || null,
      category: member?.category || null,
      designation: member?.designation || null,
      is_co_opted: !!member?.is_co_opted,
      shareholder_category: member?.shareholder_category || null,
    };
  });
};

// Helper function to get inspectors from the same district as the authenticated user
const getInspectorsFromUserDistrict = async (userId: string): Promise<string[]> => {
  try {
    const user = await findUserById(userId);
    if (!user?.district_id) {
      logger.warn('User has no district assigned', { userId });
      return [];
    }

    const inspectorIds = await getUsers({
      districtId: user.district_id,
      roleNames: ['field_inspector', 'senior_inspector']
    });

    logger.info('Found inspectors in user district', {
      userId,
      userDistrictId: user.district_id,
      inspectorCount: inspectorIds.length
    });

    return inspectorIds;
  } catch (error) {
    logger.error('Failed to get inspectors from user district', { userId, error });
    return [];
  }
};

/**
 * Full society name must be unique among non-rejected registrations (case-insensitive).
 * Different types may share a locality (e.g. Naharlagun) because their full names differ
 * ("… Multipurpose …" vs "… Consumer …" vs "… Large Sized Multipurpose …").
 * Rejected applications do not hold the name.
 */
const assertSocietyNameAndTypeAvailable = async (options: {
  name: string;
  excludeSocietyId?: string;
  transaction?: Transaction;
}): Promise<void> => {
  const normalizedName = normalizeSocietyName(options.name);
  if (!normalizedName) return;

  const rejectedStatuses = await Status.findAll({
    where: {
      [Op.or]: [
        { key: 'rejected' },
        { key: { [Op.like]: '%rejected%' } },
      ],
    },
    attributes: ['id'],
  });
  const rejectedStatusIds = rejectedStatuses.map((s) => s.id);

  const andClause: any[] = [
    sequelize.where(
      sequelize.fn('LOWER', sequelize.col('cooperative_society_name')),
      normalizedName.toLowerCase()
    ),
  ];

  if (rejectedStatusIds.length) {
    andClause.push({ status: { [Op.notIn]: rejectedStatusIds } });
  }
  if (options.excludeSocietyId) {
    andClause.push({ id: { [Op.ne]: options.excludeSocietyId } });
  }

  const existingByName = await SocietyRegistration.findOne({
    where: { [Op.and]: andClause } as any,
    attributes: ['id', 'cooperative_society_name', 'sector_of_operation', 'status'],
    transaction: options.transaction,
  });

  if (existingByName) {
    throw new AppError(
      'A Cooperative Society with this name already exists. The same name and type cannot be repeated.',
      400
    );
  }
};

const isLockWaitTimeoutError = (error: unknown): boolean => {
  const err = error as { message?: string; parent?: { message?: string }; original?: { message?: string } };
  const parts = [err?.message, err?.parent?.message, err?.original?.message].filter(Boolean) as string[];
  return parts.some((m) => /Lock wait timeout exceeded/i.test(m));
};

/** Status used when a draft application is submitted for review. */
const resolveInitialSubmitStatus = async () =>
  (await findStatusByKey('submitted')) ??
  (await findStatusByKey('Submitted')) ??
  (await findStatusByKey('application_submitted'));

export const findSocietyRegistrationById = async (id: string) => {
  const societyRegistration = await SocietyRegistration.findOne({
    where: { id }
  });
  return societyRegistration;
}

export const getAllSocietyRegistrations = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  userId?: string,
  filters?: any
) => {
  try {
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }
    // Permission check temporarily commented out
    // const hasPermission = await checkPermission('societies', 'view', userId)
    // if (!hasPermission) {
    //   throw new AppError('You are not authorized to view societies', 403);
    // }

    const offset = (page - 1) * limit;

    // whereClause
    const whereClause: any = {};

    // Status filter
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Reference year filter
    if (filters?.reference_year) {
      whereClause.reference_year = filters.reference_year;
    }

    // State filter
    if (filters?.state_id) {
      whereClause.state_id = filters.state_id;
    }

    // Cooperative society type filter
    if (filters?.cooperative_society_type_id) {
      whereClause.cooperative_society_type_id = filters.cooperative_society_type_id;
    }

    // Functional status filter
    if (filters?.functional_status) {
      whereClause.functional_status = filters.functional_status;
    }

    // Applicant availability: has_applicant=false → created_by IS NULL
    if (filters?.has_applicant !== undefined && filters?.has_applicant !== null && filters?.has_applicant !== '') {
      const raw = String(filters.has_applicant).trim().toLowerCase();
      const wantsApplicant = raw === 'true' || raw === '1';
      const wantsNoApplicant = raw === 'false' || raw === '0';
      if (wantsApplicant) {
        whereClause.created_by = { [Op.ne]: null };
      } else if (wantsNoApplicant) {
        whereClause.created_by = { [Op.is]: null };
      }
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { cooperative_society_name: { [Op.like]: `%${search}%` } },
        { local_langauge_society_name: { [Op.like]: `%${search}%` } },
        { registration_number: { [Op.like]: `%${search}%` } },
        { society_id: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Created date range filter
    if (filters?.from || filters?.to) {
      whereClause.created_at = {};
      if (filters?.from) {
        const fromDate = new Date(filters.from);
        if (!isNaN(fromDate.getTime())) {
          whereClause.created_at[Op.gte] = fromDate;
          logger.info('From date filter applied:', { from: filters.from, parsedDate: fromDate });
        } else {
          logger.warn('Invalid from date format:', filters.from);
        }
      }
      if (filters?.to) {
        const toDate = new Date(filters.to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          whereClause.created_at[Op.lte] = toDate;
          logger.info('To date filter applied:', { to: filters.to, parsedDate: toDate });
        } else {
          logger.warn('Invalid to date format:', filters.to);
        }
      }
    }

    // Optional district filter from query (explicit filter in UI)
    if (filters?.district_id) {
      whereClause.district_id = filters.district_id;
    }

    // Restrict by user role (apply AFTER other filters)
    let userDistrict = null;
    try {
      userDistrict = await findUserById(userId);
    } catch (userError: any) {
      logger.warn('Failed to fetch user district in getAllSocietyRegistrations:', {
        userId,
        error: userError?.message || 'Unknown error'
      });
      // Continue without district restriction if user fetch fails
    }

    if (userDistrict) {
      const roleName = userDistrict?.role?.name;
      const isHq = Boolean(userDistrict.is_hq);
      const isCrossDistrictRole =
        roleName === 'rcs_district' || roleName === 'jt_rcs_district' || roleName === 'jics_sics_hq';

      // JICS/SICS HQ initiates liquidation for societies across all districts.
      // Ignore the district sent by the client (usually the user's assigned
      // district), otherwise the liquidation society dropdown is incomplete.
      if (roleName === 'jics_sics_hq') {
        delete whereClause.district_id;
      }

      // Align with SocietyRenewalService / AGM listing: admin, applicant, HQ users, and
      // RCS/JT RCS district roles are not forced to the user's district_id.
      const skipDistrictScope =
        roleName === 'admin' ||
        roleName === 'super_admin' ||
        roleName === 'applicant' ||
        isHq ||
        isCrossDistrictRole;

      if (!skipDistrictScope && userDistrict?.district_id) {
        whereClause.district_id = userDistrict.district_id;
      }
    }

    // Fetch statuses and functional statuses with error handling
    let statuses: any[] = [];
    let functionalStatuses: any[] = [];

    try {
      const statusResult = await getAllStatuses();
      statuses = statusResult.statuses || [];
    } catch (statusError: any) {
      logger.warn('Failed to fetch statuses in getAllSocietyRegistrations:', {
        error: statusError?.message || 'Unknown error',
        userId
      });
      // Continue with empty array if status fetch fails
    }

    try {
      const functionalStatusResult = await getAllFunctionalStatuses();
      functionalStatuses = functionalStatusResult.functionalStatuses || [];
    } catch (functionalStatusError: any) {
      logger.warn('Failed to fetch functional statuses in getAllSocietyRegistrations:', {
        error: functionalStatusError?.message || 'Unknown error',
        userId
      });
      // Continue with empty array if functional status fetch fails
    }

    const { count, rows } = await SocietyRegistration.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name']
        },
        {
          model: State,
          as: 'state',
          attributes: ['id', 'name']
        },
        {
          model: SectorOfOperation,
          as: 'sectorOfOperation',
          attributes: ['id', 'name']
        },
        {
          model: RegistrationAuthority,
          as: 'registrationAuthority',
          attributes: ['id', 'name']
        },
        {
          model: FunctionalStatus,
          as: 'functionalStatus',
          attributes: ['id', 'name']
        },
        {
          model: SocietyType,
          as: 'societyType',
          attributes: ['id', 'title']
        },
        {
          model: AreaOfOperation,
          as: 'areaOfOperationLevel',
          attributes: ['id', 'name']
        },
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      logging: console.log
    });

    const totalPages = Math.ceil(count / limit);
    const newRows = rows?.map((item: any) => {
      const row = item.toJSON ? item.toJSON() : item;
      let s = statuses.filter((statusItem) => statusItem?.id == item?.status)
      row.status = s.length ? s[0]?.title : null

      let fs = functionalStatuses.filter((statusItem) => statusItem?.id == item?.functional_status)
      row.functional_status = fs.length ? fs[0]?.name : null
      return row
    })

    return {
      societyRegistrations: newRows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    logger.error('Error in getAllSocietyRegistrations:', {
      error: error?.message || 'Unknown error',
      errorName: error?.name,
      stack: error?.stack,
      userId,
      page,
      limit
    });

    // Preserve AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Handle Sequelize errors
    if (error?.name === 'SequelizeDatabaseError' || error?.name === 'SequelizeValidationError') {
      logger.error('Sequelize error in getAllSocietyRegistrations:', {
        error: error.message,
        sql: error.sql,
        sqlMessage: error?.parent?.sqlMessage || error?.original?.sqlMessage,
        parentMessage: error?.parent?.message || error?.original?.message,
        userId
      });
      throw new AppError('Database error while fetching society registrations', 500);
    }

    // Generic error fallback
    throw new AppError(error?.message || 'Failed to fetch society registrations', 500);
  }
};

export const getSocietyRegistrationById = async (id: string) => {
  try {
    const societyRegistration: any = await SocietyRegistration.findByPk(id, {
      include: [
        {
          model: AreaOfOperation,
          as: 'areaOfOperationLevel',
          attributes: ['id', 'name', 'description', 'level_type'],
          required: false
        },
        {
          model: SectorOfOperation,
          as: 'sectorOfOperation',
          attributes: ['id', 'name']
        },
        {
          model: SocietyConversion,
          as: 'societyConversions',
          attributes: ['id', 'society_id', 'conversion_from', 'conversion_to'],
        }
      ]
    });

    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    // Get latest active conversion for this society (single object, not array)
    let conversion: any = null;
    try {
      const latestConversion = await SocietyConversion.findOne({
        where: { society_id: id, is_active: true },
        include: [
          {
            model: SectorOfOperation,
            as: 'conversionFrom',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: SectorOfOperation,
            as: 'conversionTo',
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Status,
            as: 'statusDetails',
            attributes: ['id', 'key', 'title'],
            required: false
          },
          {
            model: Media,
            as: 'noticeSgbmMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          },
          {
            model: Media,
            as: 'minutesMeetingMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          },
          {
            model: Media,
            as: 'attendanceSheetMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          },
          {
            model: Media,
            as: 'formGMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          },
          {
            model: Media,
            as: 'byeLawsMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          },
          {
            model: Media,
            as: 'auditReportMedia',
            attributes: ['id', 'url', 'active'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Check if conversion exists
      if (latestConversion) {
        conversion = latestConversion.toJSON ? latestConversion.toJSON() : latestConversion.get({ plain: true });
        logger.info(`Found latest active conversion for society ${id}`);
      } else {
        logger.info(`No active conversion found for society ${id}`);
      }
    } catch (err: any) {
      logger.error('Error fetching conversion in getSocietyRegistrationById:', {
        error: err.message,
        societyId: id
      });
      // Continue without conversion if there's an error
      conversion = null;
    }

    // Add conversion to the response (single object, not array)
    const response = societyRegistration.toJSON ? societyRegistration.toJSON() : societyRegistration;
    response.conversion = conversion;

    // Add workflow status (current, next, previous)
    try {
      const workflowStatus = await getWorkflowStatus(
        societyRegistration.id,
        'SOCIETY_REGISTRATION',
        false // isHq - can be enhanced to detect from society data if needed
      );

      response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
    } catch (workflowError: any) {
      logger.warn('Error fetching workflow status for society:', {
        societyId: societyRegistration.society_id,
        error: workflowError?.message
      });
      // Don't fail the entire request if workflow status fails
      response.workflowStatus = null;
    }

    try {
      response.previousCommentDocuments = await getLatestCommentDocuments(societyRegistration.id, 'SOCIETY_REGISTRATION');
    } catch (documentsError: any) {
      logger.warn('Error fetching previous comment documents for society:', {
        societyId: societyRegistration.society_id,
        error: documentsError?.message
      });
      response.previousCommentDocuments = [];
    }

    await attachCompleteProcessingHistoryToDetail(
      response,
      societyRegistration.id,
      'SOCIETY_REGISTRATION'
    );

    return response;
  } catch (error) {
    logger.error('Error in getSocietyRegistrationById:', error);
    throw error;
  }
};

export const findSocietyCreatedByUser = async (userId: string) => {
  try {
    if (!userId) {
      logger.warn('findSocietyCreatedByUser called with invalid userId', { userId });
      return null;
    }

    const societyRegistration: any = await SocietyRegistration.findOne({
      where: { created_by: userId },
      // This query is only used as an existence check.
      // Selecting all model attributes can fail if DB schema is temporarily out of sync
      // (e.g., missing columns), so keep it minimal.
      attributes: ['id']
    });
    return societyRegistration;
  } catch (error: any) {
    // Log specific database errors
    if (error.name === 'SequelizeValidationError') {
      logger.error('SocietyRegistration validation error in findSocietyCreatedByUser:', {
        error: error.message,
        original: error.original,
        parent: error.parent,
        validationErrors: error.errors?.map((e: any) => ({ field: e.path, message: e.message, value: e.value })),
        userId
      });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      logger.error('SocietyRegistration foreign key constraint error in findSocietyCreatedByUser:', {
        error: error.message,
        original: error.original,
        parent: error.parent,
        table: error.table,
        fields: error.fields,
        userId
      });
    } else if (error.name === 'SequelizeDatabaseError') {
      logger.error('SocietyRegistration database error in findSocietyCreatedByUser:', {
        error: error.message,
        original: error.original,
        parent: error.parent,
        sql: error.sql,
        userId
      });
    } else {
      logger.error('Error in findSocietyCreatedByUser:', {
        error: error.message || 'Unknown error',
        errorName: error.name,
        original: error.original,
        parent: error.parent,
        sql: error.sql,
        stack: error.stack,
        userId
      });
    }
    throw error;
  }
}

export const getSocietyByUserId = async (userId: string) => {
  try {
    const societyRegistration: any = await SocietyRegistration.findOne({
      where: { created_by: userId }
    });

    if (!societyRegistration) {
      return null;
    }

    const societyMemberIds = [societyRegistration.id, societyRegistration.society_id]
      .map((value: string) => String(value || '').trim())
      .filter((value: string, index: number, array: string[]) => value.length > 0 && array.indexOf(value) === index);
    const members = await Member.findAll({
      where: {
        society_id: { [Op.in]: societyMemberIds },
        is_active: true,
      },
    });

    societyRegistration.members = members?.map((member: any) => member.dataValues) || [];
    const societyJson = societyRegistration.toJSON
      ? societyRegistration.toJSON()
      : { ...societyRegistration, members: societyRegistration.members };

    await attachCompleteProcessingHistoryToDetail(
      societyJson,
      societyRegistration.id,
      'SOCIETY_REGISTRATION'
    );

    return societyJson;
  } catch (error) {
    logger.error('Error in getSocietyByUserId:', error);
    throw error;
  }
};

export const getSocietyDetailsById = async (societyId: string) => {
  try {
    const societyRegistration: any = await SocietyRegistration.findOne({
      where: { id: societyId }
    });

    if (!societyRegistration) {
      return null;
    } else {
      const details = await societyDetails(societyRegistration?.created_by, {
        overrideRegistrationId: societyRegistration.id
      });
      console.log(details);

      // Add workflow status (current, next, previous) to society details
      // if (details?.society) {
      //   try {
      //     const workflowStatus = await getWorkflowStatus(
      //       societyRegistration.society_id,
      //       'SOCIETY_REGISTRATION',
      //       false // isHq - can be enhanced to detect from society data if needed
      //     );

      //     details.society.workflowStatus = {
      //       current: workflowStatus.currentWorkflow,
      //       next: workflowStatus.nextWorkflow,
      //       previous: workflowStatus.previousWorkflow,
      //       currentStatus: workflowStatus.currentStatus,
      //       assignedToRole: workflowStatus.assignedToRole,
      //       assignedToUserIds: workflowStatus.assignedToUserIds,
      //       assignedToUserId: workflowStatus.assignedToUserId ?? null,
      //       assignedUser: workflowStatus.assignedUser ?? null
      //     };
      //   } catch (workflowError: any) {
      //     logger.warn('Error fetching workflow status for society details:', {
      //       societyId: societyRegistration.society_id,
      //       error: workflowError?.message
      //     });
      //     // Don't fail the entire request if workflow status fails
      //     details.society.workflowStatus = null;
      //   }
      // }
      // Registration challan stays on challan_receipt; renewal challan mirrors renewals module.
      if (details?.society) {
        try {
          details.society.renewal_challan_receipt = await resolveLatestRenewalChallanReceipt(
            societyRegistration.id
          );
          details.society.renewal_challan_receipt_at =
            details.society.renewal_challan_receipt?.created_at || null;
        } catch (challanErr: any) {
          logger.warn('Failed to resolve renewal challan for society details', {
            societyId: societyRegistration.id,
            error: challanErr?.message
          });
          details.society.renewal_challan_receipt = null;
          details.society.renewal_challan_receipt_at = null;
        }
      }

      // Add workflow status (current, next, previous) to society details
      if (details?.society) {

        // ✅ If DB column workflow_status is NULL → skip workflow
        if (!societyRegistration.workflow_status) {
          details.society.workflowStatus = {};   // or null
        } else {
          try {
            const workflowStatus = await getWorkflowStatus(
              societyRegistration.id,
              'SOCIETY_REGISTRATION',
              false
            );

            details.society.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
            details.society.previousCommentDocuments = await getLatestCommentDocuments(societyRegistration.id, 'SOCIETY_REGISTRATION');
          } catch (workflowError: any) {
            logger.warn('Error fetching workflow status for society details:', {
              societyId: societyRegistration.society_id,
              error: workflowError?.message
            });

            // safe fallback
            details.society.workflowStatus = {};
            details.society.previousCommentDocuments = [];
          }
        }

        await attachCompleteProcessingHistoryToDetail(
          details.society,
          societyRegistration.id,
          'SOCIETY_REGISTRATION'
        );
      }

      return details;
    }
  } catch (error) {
    logger.error('Error in societyDetails:', error);
    throw error;
  }
};

export const createSocietyRegistration = async (data: any, req?: IAuthRequest) => {
  const transaction = await sequelize.transaction();

  try {
    let userId = req?.user?.userId as string
    data = normalizeOptionalSocietyRegistrationFields(
      (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
    ) as typeof data;

    // Draft save: body includes status id (e.g. draft). Final submit: no status — use workflow "submitted".
    // DB may use `submitted` (workflow seeder) or `application_submitted` (default statuses seeder).
    // Clients may send `status` as a UUID string OR as the enriched status object
    // (e.g. when re-submitting a previously loaded society). Normalize to id.
    const incomingStatusId =
      data?.status && typeof data.status === 'object'
        ? (data.status as any).id
        : data?.status;

    let finalStatus = null as Awaited<ReturnType<typeof findStatusById>>;
    if (incomingStatusId) {
      finalStatus = await findStatusById(incomingStatusId);
      if (!finalStatus) {
        throw new AppError('Invalid status for society registration.', 400);
      }
    } else {
      finalStatus = await resolveInitialSubmitStatus();
      if (!finalStatus) {
        throw new AppError(
          'Initial registration status not found. Seed statuses (submitted or application_submitted).',
          500
        );
      }
    }
    logger.info('Auto-setting status to "submitted" for workflow start', {
      status_id: finalStatus.id,
      status_key: finalStatus.key
    });

    // Set workflow_status to first workflow step (sequence 1) for SOCIETY_REGISTRATION
    let workflowStatusId = null;
    // const workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_REGISTRATION', 1);
    if (finalStatus.key !== 'draft') {
      workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_REGISTRATION', 1);
    }

    // if (!workflowStatusId) {
    //   throw new AppError('First workflow step (sequence 1) not found for SOCIETY_REGISTRATION module. Please ensure workflow steps are seeded.', 500);
    // }
    logger.info('Auto-setting workflow_status to first workflow step', {
      workflow_step_id: workflowStatusId,
      sequence: 1,
      module_key: 'SOCIETY_REGISTRATION'
    });

    // Generate registration number
    const count = await SocietyRegistration.count()
    const registrationNumber = (count + 1) < 10 ? `000${count + 1}` : (count + 1) < 100 ? `00${count + 1}` : (count + 1) < 1000 ? `0${count + 1}` : count + 1

    const state = await getStateById(data?.state_id);
    const sectorOfOperation = await getSectorOfOperationById(data?.sector_of_operation);
    const { ncdId, newNumber } = await generateNcdId(state?.state_code, sectorOfOperation?.code);

    logger.info('ncdId', ncdId)
    logger.info('newNumber', newNumber)

    // Strip workflow_status and status from body; we set both from resolved finalStatus / workflow.
    const { workflow_status, status: _statusFromBody, ...dataWithoutWorkflowFields } = data;

    if (finalStatus.key !== 'draft') {
      assertRequiredSocietyRegistrationDocuments(
        dataWithoutWorkflowFields as Record<string, unknown>
      );
    }

    // Naming rules: full name (no abbreviations) + unique full name among active registrations
    const resolvedName = resolveSocietyNameFromBody(
      dataWithoutWorkflowFields as Record<string, unknown>
    );
    let normalizedSocietyName: string | null = null;
    if (resolvedName) {
      normalizedSocietyName = assertSocietyNameFormat(resolvedName);
    } else if (finalStatus.key !== 'draft') {
      throw new AppError('Society name is required', 400);
    }

    if (normalizedSocietyName) {
      await assertSocietyNameAndTypeAvailable({
        name: normalizedSocietyName,
        transaction,
      });
    }

    let registrationData = {
      ...dataWithoutWorkflowFields,
      ...(normalizedSocietyName ? { cooperative_society_name: normalizedSocietyName } : {}),
      id: uuidv4(),
      date_registration: moment().format('YYYY-MM-DD'),
      status: finalStatus.id, // Always set to "submitted"
      workflow_status: workflowStatusId, // Always set to first workflow step
      society_id: `SOC${Math.floor(100000 + Math.random() * 900000)}`,
      registration_number: `NO.COOP(ORG)${registrationNumber}/${moment().year()}`,
      created_by: userId || null,
      ncd_id: ncdId || null,
      ncd_running_number: newNumber || null,
      status_changed_by: userId || null,
      status_changed_at: new Date()
    }
    logger.info('registrationData', registrationData)
    const societyRegistration = await SocietyRegistration.create(registrationData, { transaction });
    logger.info('societyRegistration created', societyRegistration)
    logger.error('societyRegistration created error', (societyRegistration as any).message);
    let members: any[] = [];
    if (data?.members && data?.members.length > 0) {
      const membersData = preparePromoterRows(data.members).map((member) => ({
        name: member.name,
        mobile: member.mobile,
        gender: member.gender,
        category: member.category,
        designation: member.designation,
        is_co_opted: member.is_co_opted,
        shareholder_category: member.shareholder_category,
        society_id: registrationData.id,
        created_by: userId || null
      }));

      members = await Member.bulkCreate(membersData, { transaction });
      logger.info('Members created successfully', {
        members: membersData
      });
    }

    // update applicant district id (keep inside transaction — short DB write only)
    const applicant = await findUserById(userId);
    if (applicant && data?.district_id) {
      await User.update(
        { district_id: data?.district_id || null },
        { where: { id: applicant?.id }, transaction }
      );
      logger.info('Applicant district updated successfully', {
        applicant_id: applicant?.id,
        district_id: data?.district_id || null
      });
    }

    await transaction.commit();

    // Notifications, email, and history run after commit so row locks are not held during slow I/O.
    if (userId && finalStatus?.key !== 'draft') {
      try {
        if (data?.district_id) {
          const inspectorNotificationData = {
            title: NOTIFICATIONS.notifications.society.registration.created.title as any,
            description: `New Cooperative Society Registration Submitted: ${societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name}`,
            data: JSON.stringify({ societyRegistration, members, totalMembers: members.length }),
            redirect_path: (NOTIFICATIONS.notifications as any)?.society.registration.created?.path?.replace?.('{id}', societyRegistration.id) || `/registrations/${societyRegistration.id}`,
            created_by: userId
          };

          await notifyInspectorsInDistrict(data.district_id, inspectorNotificationData, ['drcs_arcs_district']);

          logger.info('drcs_arcs_district notifications sent successfully', {
            society_id: societyRegistration.id,
            district_id: data.district_id
          });
        } else {
          logger.warn('District not found, skipping inspector notifications', {
            society_id: societyRegistration.id
          });
        }

        if (applicant?.email) {
          const message = `New Cooperative Society Registration Submitted: ${societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name}`;
          const actionUrl = NOTIFICATIONS.notifications.society.registration.created.path.replace('{id}', societyRegistration.id);
          await sendNotificationEmail(
            applicant.email,
            NOTIFICATIONS.notifications.society.registration.created.title as any,
            message,
            actionUrl
          );
        }
      } catch (notificationError) {
        logger.warn('Notification sending failed, but society registration was created', {
          society_id: societyRegistration.id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError)
        });
      }

      try {
        const user = await User.findByPk(userId);
        await logOperation(
          'society_registrations',
          'create',
          societyRegistration?.id || '',
          userId,
          `Society registrated by ${user?.first_name} ${user?.last_name}`
        );
      } catch (historyError) {
        logger.warn('History logging failed after society registration create', {
          society_id: societyRegistration.id,
          error: historyError instanceof Error ? historyError.message : String(historyError)
        });
      }
    } else {
      logger.info('Skipping notifications/history for draft status', {
        society_id: societyRegistration.id,
        status: finalStatus?.key
      });
    }

    // Log activity
    try {
      await createActivity({
        title: 'Society Registration Created',
        description: `New society "${data?.cooperative_society_name || 'Unknown'}" registered successfully`,
        data: {
          society_id: societyRegistration.id,
          society_name: data?.cooperative_society_name,
          registration_number: societyRegistration.registration_number,
          registration_type: data?.registration_type,
          district_id: data?.district_id,
          total_members: members.length,
          created_by: userId
        },
        reference_id: societyRegistration.id,
        created_by: userId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log society registration creation activity:', activityError);
    }

    return {
      societyRegistration,
      members,
      totalMembers: members.length
    };
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    logger.error('Error in createSocietyRegistration:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create society registration');
  }
};

export const updateSocietyRegistration = async (
  id: string,
  data: any,
  req?: IAuthRequest,
  retryCount = 0
): Promise<SocietyRegistration> => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const userId = req?.user?.userId as string;

    let societyRegistration = await SocietyRegistration.findByPk(id, {
      transaction,
      lock: Transaction.LOCK.UPDATE
    });

    if (!societyRegistration) {
      throw new AppError('Society not found', 404);
    }

    const societyCurrentStatus = await findStatusById(societyRegistration?.status || '');

    data = normalizeOptionalSocietyRegistrationFields(
      (data && typeof data === 'object' ? data : {}) as Record<string, unknown>,
      societyRegistration.toJSON() as Record<string, unknown>
    ) as typeof data;

    const {
      members: membersFromData,
      workflow_status: _discardWorkflowStatus,
      status: statusFromBody,
      id: _bodySocietyRowId,
      ...societyDataRest
    } = data;

    const modelFieldNames = new Set(Object.keys(SocietyRegistration.rawAttributes));
    const societyData = Object.fromEntries(
      Object.entries(societyDataRest).filter(([key]) => modelFieldNames.has(key))
    ) as Record<string, unknown>;

    // Normalize: clients may send the enriched status object (id, key, title...) instead of a UUID.
    const requestedStatusId =
      statusFromBody && typeof statusFromBody === 'object'
        ? (statusFromBody as any).id
        : statusFromBody;

    const requestedStatus =
      requestedStatusId != null && requestedStatusId !== ''
        ? await findStatusById(requestedStatusId)
        : null;

    /** Applicant "Save draft" while already in draft: persist fields, do not submit workflow. */
    const isDraftSaveInPlace =
      societyCurrentStatus?.key === 'draft' && requestedStatus?.key === 'draft';

    // Naming rules: format + uniqueness (required on submit; optional empty on draft save)
    const nameFromPayload = resolveSocietyNameFromBody({
      ...societyData,
      society_name: (data as any)?.society_name,
    });
    const effectiveName =
      nameFromPayload || normalizeSocietyName(societyRegistration.cooperative_society_name);

    if (!isDraftSaveInPlace && !effectiveName) {
      throw new AppError('Society name is required', 400);
    }

    if (effectiveName) {
      const normalizedSocietyName = assertSocietyNameFormat(effectiveName);
      societyData.cooperative_society_name = normalizedSocietyName;
      await assertSocietyNameAndTypeAvailable({
        name: normalizedSocietyName,
        excludeSocietyId: id,
        transaction,
      });
    }

    const seq9WorkflowId = await getWorkflowIdByModuleAndSequence('SOCIETY_REGISTRATION', 9);
    const isChallanReuploadOnly =
      societyCurrentStatus?.key === 'challan_pending' ||
      (societyCurrentStatus?.key === 'rejected' &&
        societyRegistration.challan_receipt &&
        societyRegistration.workflow_status &&
        seq9WorkflowId &&
        String(societyRegistration.workflow_status) === String(seq9WorkflowId));

    if (!isDraftSaveInPlace && isChallanReuploadOnly) {
      throw new AppError(
        'Challan correction is required. Re-upload the challan from My Society instead of resubmitting the full application.',
        400
      );
    }

    let workflowStatusId: string | null = null;

    if (!isDraftSaveInPlace) {
      assertRequiredSocietyRegistrationDocuments({
        ...(societyRegistration.toJSON() as Record<string, unknown>),
        ...societyData,
      });

      let getStatus: Awaited<ReturnType<typeof findStatusByKey>> | null;
      if (societyCurrentStatus?.key === 'draft') {
        getStatus = await resolveInitialSubmitStatus();
      } else {
        // status key is "resubmitted" (not "resubmit") as per seeded statuses
        getStatus = await findStatusByKey('resubmitted');
      }
      if (!getStatus?.id) {
        throw new AppError('Resubmission status not found. Please ensure statuses are seeded correctly.', 500);
      }

      // Resubmit: set workflow_status to first workflow step (sequence 1)
      workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_REGISTRATION', 1);
      if (!workflowStatusId) {
        throw new AppError('First workflow step (sequence 1) not found for SOCIETY_REGISTRATION module. Please ensure workflow steps are seeded.', 500);
      }
      logger.info('Auto-setting workflow_status to first workflow step on resubmit', {
        workflow_step_id: workflowStatusId,
        sequence: 1,
        module_key: 'SOCIETY_REGISTRATION'
      });

      await societyRegistration.update(
        {
          ...societyData,
          status: getStatus?.id,
          workflow_status: workflowStatusId,
          status_changed_by: userId,
          status_changed_at: new Date(),
          updated_by: userId
        },
        { transaction }
      );
    } else {
      await societyRegistration.update(
        {
          ...societyData,
          status: requestedStatus!.id,
          updated_by: userId,
          status_changed_at: new Date()
        },
        { transaction }
      );
    }

    // Reload within the same transaction so member reads see the updates above.
    const updatedSocietyRegistration = await SocietyRegistration.findByPk(id, { transaction });
    if (!updatedSocietyRegistration) {
      throw new AppError('Failed to update society registration', 500);
    }
    societyRegistration = updatedSocietyRegistration;

    let members: any[] = [];
    if (membersFromData && membersFromData?.length > 0) {
      // First, deactivate all existing members for this society
      await Member.update(
        { is_active: false, updated_by: userId },
        {
          where: { society_id: societyRegistration.id },
          transaction
        }
      );

      // Process each member with that promoter's own name and mobile
      for (const memberData of preparePromoterRows(membersFromData)) {
        let member;

        // Check if member exists (by id if provided, otherwise by name and society_id)
        if (memberData.id) {
          // Update existing member by ID
          member = await Member.findOne({
            where: {
              id: memberData.id,
              society_id: societyRegistration.id,
              is_active: false
            },
            transaction
          });

          if (member) {
            const { id: _promoterId, ...promoterFields } = memberData;
            await member.update({
              ...promoterFields,
              is_active: true,
              updated_by: userId
            }, { transaction });
          }
        }

        // If member doesn't exist or wasn't found, create new one
        if (!member) {
          member = await Member.create({
            name: memberData.name || undefined,
            gender: memberData.gender || undefined,
            category: memberData.category || undefined,
            mobile: memberData.mobile || undefined,
            society_id: societyRegistration.id,
            is_active: true,
            created_by: userId,
            updated_by: userId,
            designation: memberData?.designation || undefined,
            is_co_opted: !!memberData?.is_co_opted
          }, { transaction });
        }

        members.push(member);
      }
    }

    const applicant = await findUserById(societyRegistration?.updated_by || userId || '');
    if (applicant && societyRegistration?.district_id) {
      await User.update(
        { district_id: societyRegistration.district_id },
        { where: { id: applicant.id }, transaction }
      );
    }

    await transaction.commit();
    committed = true;

    // Side effects after commit — avoids holding row locks during email/notification/history I/O.
    if (!isDraftSaveInPlace) {
       // ----------------- Notifications -----------------
      try {
        const authenticatedUser = await findUserById(userId);
        const userDistrictId = authenticatedUser?.district_id || '';
        const societyDistrictId = societyRegistration.district_id || '';
        const targetDistrictId = userDistrictId || societyDistrictId;

        if (targetDistrictId) {
          const resubmitNotificationPayload = {
            title: 'Society Registration Resubmitted',
            description: `Society registration resubmitted for review: ${societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name}`,
            data: JSON.stringify({
              societyRegistration,
              members,
              totalMembers: members.length,
              action: 'resubmitted'
            }),
            redirect_path: `/registrations/${societyRegistration.id}`,
            created_by: userId
          };

          await notifyInspectorsInDistrict(targetDistrictId, resubmitNotificationPayload, ['drcs_arcs_district']);
// send notifiation email to drcs_arcs_district
          const inspectors = await getUsers({ districtId: targetDistrictId, roleNames: ['drcs_arcs_district'] });
          const inspectorEmails = inspectors.map((i: any) => i.email).filter(Boolean);
          if (inspectorEmails.length > 0) {
            await sendNotificationEmailToMultipleUsers(
              inspectorEmails,
              NOTIFICATIONS.notifications.society.registration.updated.title as any,
              `Society registration resubmitted: ${societyRegistration.cooperative_society_name || societyRegistration.local_langauge_society_name}`,
              resubmitNotificationPayload.redirect_path as any
            );
          }
        } else {
          logger.warn('No district found for user or society, skipping inspector notifications for resubmission', {
            society_id: id,
            userId,
            user_district_id: userDistrictId,
            society_district_id: societyDistrictId
          });
        }
      } catch (notificationError) {
        logger.warn('Notification sending failed for resubmission', {
          society_id: societyRegistration.id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError)
        });
      }

     
      // Remove duplicate notification logic since it's now handled above

    // Log the resubmission operation to history (outside notification block)
      try {
        await logOperation(
          'society_registrations',
          societyCurrentStatus?.key === 'draft' ? 'submit' : 'resubmit',
          id,
          userId,
          `Society Application is ${societyCurrentStatus?.key === 'draft' ? 'submitted' : 'resubmitted'} for review`
        );
      } catch (historyError) {
        logger.warn('History logging failed, but society registration was updated', {
          society_id: id,
          error: historyError instanceof Error ? historyError.message : String(historyError)
        });
      }
    }

    const activityPayload = {
      title: 'Society Registration Updated',
      description: `Society registration updated for "${societyRegistration.cooperative_society_name || 'Unknown'}"`,
      data: {
        society_id: societyRegistration.id,
        society_name: societyRegistration.cooperative_society_name,
        registration_number: societyRegistration.registration_number,
        updated_fields: Object.keys(societyData),
        total_members: members.length,
        updated_by: userId
      },
      reference_id: societyRegistration.id,
      created_by: userId || 'system'
    };

    // Draft saves: do not block the HTTP response on activity insert (helps avoid proxy 504 under load).
    if (isDraftSaveInPlace) {
      void createActivity(activityPayload);
    } else {
      try {
        await createActivity(activityPayload);
      } catch (activityError) {
        logger.error('Failed to log society registration update activity:', activityError);
      }
    }

    return societyRegistration;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    if (isLockWaitTimeoutError(error) && retryCount < 2) {
      logger.warn('Lock wait timeout during society registration update, retrying', {
        society_id: id,
        retryCount: retryCount + 1
      });
      return updateSocietyRegistration(id, data, req, retryCount + 1);
    }
    logger.error('Error in updateSocietyRegistration:', error);
    throw error;
  }
};

export const deleteSocietyRegistration = async (id: string, req?: IAuthRequest) => {
  try {
    const societyRegistration = await SocietyRegistration.findByPk(id);
    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    const userId = req?.user?.userId;
    if (!userId) {
      throw new AppError('User ID is required for deletion', 400);
    }

    await societyRegistration.destroy();
    await logOperation(
      'society_registrations',
      'delete',
      id,
      userId,
      `Society registration deleted by ${req?.user?.email}`
    );
    return { message: 'Society registration deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteSocietyRegistration:', error);
    throw error;
  }
};

export const getSocietyRegistrationsByStatus = async (
  status: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await SocietyRegistration.findAndCountAll({
      where: { status },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: State,
          as: 'state',
          attributes: ['id', 'name', 'hindi_name']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name']
        },
        {
          model: Block,
          as: 'block',
          attributes: ['id', 'name']
        },
        {
          model: WaterBodyType,
          as: 'waterBodyType',
          attributes: ['id', 'name']
        },
        {
          model: RegistrationAuthority,
          as: 'registrationAuthority',
          attributes: ['id', 'name']
        },
        {
          model: CooperativeSocietyType,
          as: 'cooperativeSocietyType',
          attributes: ['id', 'name']
        },
        {
          model: SectorOfOperation,
          as: 'sectorOfOperation',
          attributes: ['id', 'name']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    return {
      societyRegistrations: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error in getSocietyRegistrationsByStatus:', error);
    throw new AppError('Failed to fetch society registrations by status', 500);
  }
};

// Get society registration status statistics
export const getSocietyRegistrationStatusStats = async () => {
  try {
    const stats = await SocietyRegistration.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return stats;
  } catch (error) {
    logger.error('Error in getSocietyRegistrationStatusStats:', error);
    throw new AppError('Failed to fetch society registration status statistics', 500);
  }
};

/**
 * Persist cooperative sector form (`additional_data`) and optional `sector_of_operation`.
 * Does not read or change status / workflow.
 */
export const updateSocietyAdditionalData = async (
  id: string,
  data: { additional_data?: unknown; sector_of_operation?: string | null },
  req?: IAuthRequest
): Promise<SocietyRegistration> => {
  try {
    const userId = req?.user?.userId as string | undefined;

    const societyRegistration = await SocietyRegistration.findByPk(id);
    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    let additionalData: Record<string, unknown> | null = null;
    if (data.additional_data === null) {
      additionalData = null;
    } else if (typeof data.additional_data === 'string') {
      const trimmed = data.additional_data.trim();
      if (!trimmed) {
        additionalData = null;
      } else {
        const parsed = JSON.parse(trimmed) as unknown;
        if (parsed !== null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
          throw new AppError('additional_data must be a JSON object', 400);
        }
        additionalData = parsed as Record<string, unknown> | null;
      }
    } else if (
      typeof data.additional_data === 'object' &&
      !Array.isArray(data.additional_data)
    ) {
      additionalData = data.additional_data as Record<string, unknown>;
    } else {
      throw new AppError('additional_data must be a JSON object', 400);
    }

    const updates: Record<string, unknown> = {
      additional_data: additionalData,
      updated_by: userId,
    };

    const sectorId =
      data.sector_of_operation != null && String(data.sector_of_operation).trim() !== ''
        ? String(data.sector_of_operation).trim()
        : null;

    if (sectorId) {
      const sectorOfOperation = await getSectorOfOperationById(sectorId);
      if (!sectorOfOperation?.id) {
        throw new AppError('Invalid sector_of_operation', 400);
      }

      const sectorChanged =
        String(societyRegistration.sector_of_operation || '') !== String(sectorOfOperation.id);
      updates.sector_of_operation = sectorOfOperation.id;

      if (sectorChanged) {
        const stateId = String(societyRegistration.state_id || '').trim();
        if (stateId && sectorOfOperation.code != null) {
          const state = await getStateById(stateId).catch(() => null);
          if (state?.state_code != null) {
            const { ncdId, newNumber } = await generateNcdId(
              state.state_code,
              sectorOfOperation.code
            );
            updates.ncd_id = ncdId;
            updates.ncd_running_number = newNumber;
          }
        }
      }
    }

    await societyRegistration.update(updates);

    await syncPrimaryBusinessActivityFromRegistration({
      societyRegistrationId: id,
      sectorOfOperationId: sectorId ?? societyRegistration.sector_of_operation,
      additionalData,
      userId: userId ?? null,
    });

    const updated = await SocietyRegistration.findByPk(id);
    if (!updated) {
      throw new AppError('Failed to update additional data', 500);
    }

    logger.info('Society registration additional_data updated', {
      societyId: id,
      sectorUpdated: Boolean(sectorId),
    });

    return updated;
  } catch (error) {
    logger.error('Error in updateSocietyAdditionalData:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new AppError('additional_data must be valid JSON', 400);
    }
    throw new AppError('Failed to update society additional data', 500);
  }
};

export const submitDraftSocietyService = async (id: string, req?: IAuthRequest): Promise<any> => {
  try {
    const draftStatus = await findStatusByKey('draft');
    if (!draftStatus) {
      throw new AppError('Draft status not found', 404);
    }

    const societyRegistration = await SocietyRegistration.findByPk(id);
    if (!societyRegistration) {
      throw new AppError('Society registration not found', 404);
    }

    const currentStatus = await findStatusById(societyRegistration.status || '');
    if (currentStatus?.key !== 'draft') {
      throw new AppError('Only draft applications can be submitted through this action', 400);
    }

    // Empty body + draft row triggers draft → submitted transition in updateSocietyRegistration.
    return await updateSocietyRegistration(id, {}, req);
  } catch (error) {
    logger.error('Error in submitDraftSocietyService:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to submit draft society', 500);
  }
};
