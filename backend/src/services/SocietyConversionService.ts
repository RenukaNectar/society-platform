import { Op, Transaction } from 'sequelize';
import SocietyConversion from '../models/SocietyConversion';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { findUserById } from './UserService';
import { getAllStatuses, findStatusByKey, findStatusById } from './StatusService';
import SocietyRegistration from '../models/SocietyRegistration';
import Status from '../models/Status';
import User from '../models/user';
import SectorOfOperation from '../models/SectorOfOperation';
import Media from '../models/Media';
import sequelize from '../config/sequelize';
import ModuleWorkflow from '../models/ModuleWorkflow';
import { IAuthRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  formatWorkflowStatusForApi,
  getWorkflowStatus,
  getWorkflowIdByModuleAndSequence
} from './WorkflowUtilService';
import { getLatestCommentDocuments, attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import { notifyInspectorsInDistrict } from './NotificationService';
import { createHistory } from './HistoryService';
import { getSocietyAddress } from '../utils/societyAddress';
import { assertConversionMeetingEligibility } from './ConversionAccessService';

/** Map Sequelize and other errors to AppError so clients get a clear message (not a generic 500). */
function mapSocietyConversionError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const err = error as {
    name?: string;
    message?: string;
    errors?: Array<{ message?: string; path?: string }>;
    parent?: { sqlMessage?: string; message?: string; code?: string };
  };

  if (err?.name === 'SequelizeUniqueConstraintError') {
    const first = err.errors?.[0];
    const detail =
      first?.message ||
      (first?.path ? `Duplicate value for ${first.path}` : 'This society conversion record already exists');
    return new AppError(detail, 409);
  }

  if (err?.name === 'SequelizeValidationError') {
    const msgs = err.errors?.map((e) => e.message).filter(Boolean) ?? [];
    return new AppError(msgs.length ? msgs.join('; ') : 'Validation failed', 400);
  }

  if (err?.name === 'SequelizeForeignKeyConstraintError') {
    const sql = err.parent?.sqlMessage || err.parent?.message || err.message;
    return new AppError(
      sql ||
        'Invalid reference: check that status, workflow step, society, sector, or uploaded file IDs exist and are correct.',
      400
    );
  }

  if (err?.name === 'SequelizeDatabaseError' || err?.name === 'SequelizeTimeoutError') {
    const msg = err.parent?.sqlMessage || err.parent?.message || err.message || 'Database error';
    return new AppError(msg, 500);
  }

  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, 500);
  }

  return new AppError(String(error) || fallbackMessage, 500);
}

const SOCIETY_NAME_KEY = 'cooperative_society_name';
const SOCIETY_ADDRESS_KEY = 'full_address';
const CONVERTED_SOCIETY_NAME_KEY = 'converted_society_name';
const CONVERTED_SOCIETY_ADDRESS_KEY = 'converted_society_address';
const ORIGINAL_SOCIETY_NAME_KEY = 'original_society_name';
const ORIGINAL_SOCIETY_ADDRESS_KEY = 'original_full_address';
const CONVERTED_NAME_KEYS = [CONVERTED_SOCIETY_NAME_KEY, SOCIETY_NAME_KEY];
const CONVERTED_ADDRESS_KEYS = [CONVERTED_SOCIETY_ADDRESS_KEY, SOCIETY_ADDRESS_KEY];

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readNonEmptyString = (
  sources: Array<Record<string, unknown> | null>,
  key: string
): string | null => {
  for (const source of sources) {
    if (!source) continue;
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const parseConversionData = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value)) || {};
    } catch {
      return {};
    }
  }
  return asRecord(value) || {};
};

const readFirstNonEmpty = (
  sources: Array<Record<string, unknown> | null>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const value = readNonEmptyString(sources, key);
    if (value) return value;
  }
  return null;
};

export type StoredConversionIdentity = {
  convertedName: string | null;
  convertedAddress: string | null;
  originalName: string | null;
  originalAddress: string | null;
};

/** Name/address submitted on the conversion form, plus the society values from before conversion. */
export const readStoredConversionIdentity = (data: unknown): StoredConversionIdentity => {
  const source = parseConversionData(data);
  return {
    convertedName: readFirstNonEmpty([source], CONVERTED_NAME_KEYS),
    convertedAddress: readFirstNonEmpty([source], CONVERTED_ADDRESS_KEYS),
    originalName: readNonEmptyString([source], ORIGINAL_SOCIETY_NAME_KEY),
    originalAddress: readNonEmptyString([source], ORIGINAL_SOCIETY_ADDRESS_KEY),
  };
};

/** Keep a submitted name/address inside conversion `data` for later approval. */
const mergeSocietyIdentityIntoConversionData = (payload: any): void => {
  const body = asRecord(payload);
  if (!body) return;
  const nested = parseConversionData(body.data);
  const cooperativeSocietyName = readFirstNonEmpty([body, nested], CONVERTED_NAME_KEYS);
  const fullAddress = readFirstNonEmpty([body, nested], CONVERTED_ADDRESS_KEYS);
  if (!cooperativeSocietyName && !fullAddress) return;

  body.data = {
    ...nested,
    ...(cooperativeSocietyName
      ? {
          [CONVERTED_SOCIETY_NAME_KEY]: cooperativeSocietyName,
          [SOCIETY_NAME_KEY]: cooperativeSocietyName,
        }
      : {}),
    ...(fullAddress
      ? {
          [CONVERTED_SOCIETY_ADDRESS_KEY]: fullAddress,
          [SOCIETY_ADDRESS_KEY]: fullAddress,
        }
      : {}),
  };
};

/**
 * Remember the society name and address from before conversion.
 * Must run before those columns are overwritten, and must not replace an existing snapshot.
 */
export const snapshotOriginalSocietyIdentity = async (
  societyId: string,
  payload: unknown,
  transaction?: Transaction
): Promise<void> => {
  const body = asRecord(payload);
  if (!body) return;
  const nested = parseConversionData(body.data);
  if (nested[ORIGINAL_SOCIETY_NAME_KEY] && nested[ORIGINAL_SOCIETY_ADDRESS_KEY]) {
    body.data = nested;
    return;
  }

  const society = await SocietyRegistration.findByPk(societyId, {
    attributes: ['cooperative_society_name', 'full_address'],
    transaction,
  });
  if (!society) {
    body.data = nested;
    return;
  }

  const originalName = String(society.cooperative_society_name || '').trim();
  const originalAddress = String(society.full_address || '').trim();
  body.data = {
    ...nested,
    ...(!nested[ORIGINAL_SOCIETY_NAME_KEY] && originalName
      ? { [ORIGINAL_SOCIETY_NAME_KEY]: originalName }
      : {}),
    ...(!nested[ORIGINAL_SOCIETY_ADDRESS_KEY] && originalAddress
      ? { [ORIGINAL_SOCIETY_ADDRESS_KEY]: originalAddress }
      : {}),
  };
};

/**
 * Copy the converted society name and address onto the society registration
 * (My Society and the NCD payload both read these columns).
 * Values may be top-level on the conversion payload or inside `data`.
 */
export const syncSocietyNameAndAddressFromConversion = async (
  societyId: string,
  payload: unknown,
  transaction?: Transaction
): Promise<void> => {
  const body = asRecord(payload);
  const nested = parseConversionData(body?.data);
  const cooperativeSocietyName = readFirstNonEmpty([body, nested], CONVERTED_NAME_KEYS);
  const fullAddress = readFirstNonEmpty([body, nested], CONVERTED_ADDRESS_KEYS);

  const updates: Record<string, string> = {};
  if (cooperativeSocietyName) updates.cooperative_society_name = cooperativeSocietyName;
  if (fullAddress) updates.full_address = fullAddress;
  if (!Object.keys(updates).length) return;

  await SocietyRegistration.update(updates, {
    where: { id: societyId },
    transaction,
  });

  logger.info('Society name and address updated from conversion', {
    societyId,
    updatedFields: Object.keys(updates),
  });
};

async function rollbackIfOpen(transaction: { finished?: string; rollback: () => Promise<void> }): Promise<void> {
  if (!transaction.finished) {
    await transaction.rollback();
  }
}

/** Society row + certificate / notification / bye-laws media for conversion detail APIs */
const societyIncludeForConversionDetail = {
  model: SocietyRegistration,
  as: 'society',
  attributes: [
    'id',
    'society_id',
    'cooperative_society_name',
    'local_langauge_society_name',
    'registration_number',
    'reference_year',
    'district_id',
    'status',
    'sector_of_operation',
    'state_id',
    'bye_laws',
    'certificate_media_id',
    'notification_media_id',
    'certificate_issue_date',
    'catificate_issued_by',
    'updated_at',
    'full_address',
  ],
  required: false,
  include: [
    {
      model: User,
      as: 'catificateIssuedByUser',
      attributes: ['id', 'first_name', 'last_name'],
      required: false,
    },
    {
      model: Media,
      as: 'certificateMedia',
      attributes: ['id', 'url', 'active', 'created_at'],
      required: false,
    },
    {
      model: Media,
      as: 'notificationMedia',
      attributes: ['id', 'url', 'active'],
      required: false,
    },
    {
      model: Media,
      as: 'byeLawsMedia',
      attributes: ['id', 'url', 'active'],
      required: false,
    },
  ],
};

export const getAllSocietyConversions = async (
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

    // Permission check is enforced at the route layer
    // (requireAnyPermission: society.view OR conversion.view). Keeping it here
    // hard-coded to `society.view` blocks roles (e.g. applicant) that were
    // granted only `conversion.view`, so it's intentionally not duplicated.

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Status filter - can be status ID (UUID) or status key (for backward compatibility)
    if (filters?.status) {
      // Check if it's a UUID (status ID) or a string key
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.status);
      if (isUUID) {
        // It's a UUID, use directly as status ID
        whereClause.status = filters.status;
      } else {
        // It's a status key, find the status ID first
        const status = await findStatusByKey(filters.status);
        if (status) {
          whereClause.status = status.id;
        } else {
          // Status key not found, return empty result
          return {
            societyConversions: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          };
        }
      }
    }

    // Society ID filter
    if (filters?.society_id) {
      whereClause.society_id = filters.society_id;
    }

    // Conversion from filter (UUID from sector_of_operations)
    if (filters?.conversion_from) {
      whereClause.conversion_from = filters.conversion_from;
    }

    // Conversion to filter (UUID from sector_of_operations)
    if (filters?.conversion_to) {
      whereClause.conversion_to = filters.conversion_to;
    }

    // Active filter
    if (filters?.is_active !== undefined) {
      whereClause.is_active = filters.is_active === 'true' || filters.is_active === true;
    }

    // Created date range filter
    if (filters?.from || filters?.to) {
      whereClause.created_at = {};
      if (filters?.from) {
        const fromDate = new Date(filters.from);
        if (!isNaN(fromDate.getTime())) {
          whereClause.created_at[Op.gte] = fromDate;
        }
      }
      if (filters?.to) {
        const toDate = new Date(filters.to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          whereClause.created_at[Op.lte] = toDate;
        }
      }
    }

    // Registration Number filter
    if (filters?.registration_number) {
      whereClause['$society.registration_number$'] = { [Op.like]: `%${filters.registration_number}%` };
    }

    // Society Name filter
    if (filters?.society_name) {
      whereClause['$society.cooperative_society_name$'] = { [Op.like]: `%${filters.society_name}%` };
    }

    // Reference Year filter
    if (filters?.reference_year) {
      whereClause['$society.reference_year$'] = filters.reference_year;
    }

    // Search filter (only apply if specific filters are not provided)
    if (search && !filters?.registration_number && !filters?.society_name) {
      whereClause[Op.or] = [
        { conversion_reason: { [Op.like]: `%${search}%` } },
        { '$society.cooperative_society_name$': { [Op.like]: `%${search}%` } },
        { '$society.registration_number$': { [Op.like]: `%${search}%` } },
      ];
    } else if (search) {
      // If search is provided along with specific filters, add search conditions to Op.or
      const searchConditions: any[] = [
        { conversion_reason: { [Op.like]: `%${search}%` } },
      ];

      // Only add society name/registration number to search if not already filtered
      if (!filters?.society_name) {
        searchConditions.push({ '$society.cooperative_society_name$': { [Op.like]: `%${search}%` } });
      }
      if (!filters?.registration_number) {
        searchConditions.push({ '$society.registration_number$': { [Op.like]: `%${search}%` } });
      }

      if (searchConditions.length > 0) {
        whereClause[Op.or] = searchConditions;
      }
    }

    // Restrict by user role (apply AFTER other filters).
    //  - applicant         → only conversions of societies they own (created_by = self)
    //  - admin/super_admin → see everything (no scope)
    //  - HQ users          → see everything across districts
    //  - rcs/jt_rcs district → cross-district view, no district scope
    //  - everyone else     → scoped to their own district_id
    const user = await findUserById(userId);
    const roleName = user?.role?.name;
    const isApplicant = roleName === 'applicant';
    const isAdmin = roleName === 'admin' || roleName === 'super_admin';
    const isHq = Boolean(user?.is_hq);
    const isCrossDistrictRole = roleName === 'rcs_district' || roleName === 'jt_rcs_district';
    const skipDistrictScope = isAdmin || isHq || isCrossDistrictRole;

    let applyDistrictFilter = false;
    if (isApplicant) {
      whereClause['$society.created_by$'] = userId;
    } else if (user && !skipDistrictScope && user.district_id) {
      whereClause['$society.district_id$'] = user.district_id;
      applyDistrictFilter = true;
    }

    // Force the society join to be required whenever we're filtering on a society
    // column, otherwise Sequelize silently drops the join-table predicate.
    const requireSociety = isApplicant ||
      applyDistrictFilter ||
      Boolean(filters?.registration_number) ||
      Boolean(filters?.society_name) ||
      Boolean(filters?.reference_year);

    const { count, rows } = await SocietyConversion.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: SocietyRegistration,
          as: 'society',
          attributes: [
            'id',
            'society_id',
            'cooperative_society_name',
            'local_langauge_society_name',
            'registration_number',
            'reference_year',
            'district_id',
            'status',
            'sector_of_operation',
            'state_id',
            'created_by'
          ],
          required: !!requireSociety
        },
        {
          model: SectorOfOperation,
          as: 'conversionFrom',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: SectorOfOperation,
          as: 'conversionTo',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    // Attach workflow status (same pattern as renewal) - statusDetails is now loaded via association
    const newRows = await Promise.all(
      rows.map(async (conversion: any) => {
        const json = conversion.toJSON ? conversion.toJSON() : conversion;

        // Attach workflow status (same pattern as renewal)
        try {
          const workflow = await getWorkflowStatus(conversion.id, 'SOCIETY_CONVERSION', false);
          json.workflowStatus = formatWorkflowStatusForApi(workflow);
        } catch (err) {
          logger.warn('Failed to get workflow status for conversion', {
            conversionId: conversion.id,
            error: (err as Error)?.message
          });
          json.workflowStatus = null;
        }

        return json;
      })
    );

    return {
      societyConversions: newRows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error: unknown) {
    logger.error('Error in getAllSocietyConversions:', error);
    throw mapSocietyConversionError(error, 'Failed to fetch society conversions');
  }
};

const attachWorkflowStatusToConversion = async (conversion: SocietyConversion): Promise<any> => {
  const json = typeof (conversion as any).toJSON === 'function' ? (conversion as any).toJSON() : conversion;

  // Resolve the formatted society address (urban/rural aware) from the linked
  // SocietyRegistration. Falls back gracefully if the lookup fails.
  const societyAddress = await getSocietyAddress(
    (json as any).society_id || (conversion as any).society_id
  ).catch(() => null);

  // Check if workflow_status is null, return empty workflowStatus
  if (!json.workflow_status || json.workflow_status === null) {
    return attachCompleteProcessingHistoryToDetail(
      {
        ...json,
        societyAddress,
        workflowStatus: {}
      },
      (conversion as any).id,
      'SOCIETY_CONVERSION',
      { historyResources: ['SOCIETY_CONVERSION', 'society_conversion'] }
    );
  }

  try {
    const workflow = await getWorkflowStatus((conversion as any).id, 'SOCIETY_CONVERSION', false);
    const enriched = {
      ...json,
      societyAddress,
      workflowStatus: formatWorkflowStatusForApi(workflow),
      previousCommentDocuments: await getLatestCommentDocuments((conversion as any).id, 'SOCIETY_CONVERSION')
    };
    return attachCompleteProcessingHistoryToDetail(
      enriched,
      (conversion as any).id,
      'SOCIETY_CONVERSION',
      { historyResources: ['SOCIETY_CONVERSION', 'society_conversion'] }
    );
  } catch (err) {
    logger.warn('Failed to get workflow status for society conversion', {
      conversionId: (conversion as any).id,
      error: (err as Error)?.message
    });
    return attachCompleteProcessingHistoryToDetail(
      { ...json, societyAddress, workflowStatus: {} },
      (conversion as any).id,
      'SOCIETY_CONVERSION',
      { historyResources: ['SOCIETY_CONVERSION', 'society_conversion'] }
    );
  }
};

export const getSocietyConversionById = async (id: string) => {
  try {
    const societyConversion = await SocietyConversion.findByPk(id, {
      include: [
        societyIncludeForConversionDetail,
        {
          model: SectorOfOperation,
          as: 'conversionFrom',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: SectorOfOperation,
          as: 'conversionTo',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name'],
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
        },
        {
          model: Media,
          as: 'certificateMedia',
          attributes: ['id', 'url', 'active'],
          required: false
        }
      ]
    });

    if (!societyConversion) {
      throw new AppError('Society conversion not found', 404);
    }

    return attachWorkflowStatusToConversion(societyConversion);
  } catch (error: unknown) {
    logger.error('Error in getSocietyConversionById:', error);
    throw mapSocietyConversionError(error, 'Failed to retrieve society conversion');
  }
};

const buildConversionSocietyLabel = (
  societyName: string,
  sectorName?: string
): string => {
  const base = String(societyName || '').trim();
  const sector = String(sectorName || '').trim();
  if (!base) return sector.toUpperCase() || 'N/A';
  if (!sector) return base.toUpperCase();
  if (base.toUpperCase().includes(sector.toUpperCase())) return base.toUpperCase();
  return `${base} ${sector}`.trim().toUpperCase();
};

/** Sector names + society display labels from latest society_conversion row. */
export const getConversionSectorNamesForCertificate = async (
  societyRegistrationId: string
): Promise<{
  conversionFrom: string;
  conversionTo: string;
  fromSocietyLabel: string;
  toSocietyLabel: string;
  originalRegistrationNumber?: string | null;
  conversionDate?: string | null;
  originalAddress?: string | null;
  convertedAddress?: string | null;
}> => {
  const latestConversion = await getLatestSocietyConversionBySocietyId(societyRegistrationId);
  const row = latestConversion as any;
  const conversionFrom = row?.conversionFrom?.name?.trim();
  const conversionTo = row?.conversionTo?.name?.trim();

  if (!conversionFrom || !conversionTo) {
    throw new AppError(
      'Conversion from/to sector not found on society conversion record',
      404
    );
  }

  const societyRow = row?.society?.cooperative_society_name
    ? row.society
    : await SocietyRegistration.findByPk(societyRegistrationId, {
        attributes: ['cooperative_society_name', 'full_address']
      });
  const currentName = String(societyRow?.cooperative_society_name || '').trim();
  const currentAddress = String(societyRow?.full_address || '').trim();
  const stored = readStoredConversionIdentity(row?.data);
  const originalName =
    stored.originalName ||
    (stored.convertedName && currentName.toUpperCase() !== stored.convertedName.toUpperCase()
      ? currentName
      : currentName);
  const convertedName = stored.convertedName || '';

  return {
    conversionFrom,
    conversionTo,
    fromSocietyLabel: buildConversionSocietyLabel(originalName || currentName, conversionFrom),
    toSocietyLabel: convertedName
      ? convertedName.toUpperCase()
      : buildConversionSocietyLabel(currentName, conversionTo),
    originalRegistrationNumber: row?.registration_number ?? null,
    conversionDate: row?.approval_date ? String(row.approval_date) : null,
    originalAddress: stored.originalAddress || currentAddress || null,
    convertedAddress: stored.convertedAddress || null
  };
};

export const getLatestSocietyConversionBySocietyId = async (societyId: string) => {
  try {
    if (!societyId) {
      throw new AppError('Society ID is required', 400);
    }

    const latestConversion = await SocietyConversion.findOne({
      where: {
        [Op.or]: [
          { id: societyId },
          { society_id: societyId }
        ]
      },
      include: [
        societyIncludeForConversionDetail,
        {
          model: SectorOfOperation,
          as: 'conversionFrom',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: SectorOfOperation,
          as: 'conversionTo',
          attributes: ['id', 'name', 'code', 'description'],
          required: false
        },
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title'],
          required: false
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name'],
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
        },
        {
          model: Media,
          as: 'certificateMedia',
          attributes: ['id', 'url', 'active'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!latestConversion) {
      throw new AppError('Society conversion not found for this society', 404);
    }

    return attachWorkflowStatusToConversion(latestConversion);
  } catch (error: unknown) {
    logger.error('Error in getLatestSocietyConversionBySocietyId:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      societyId
    });

    throw mapSocietyConversionError(error, 'Failed to retrieve latest society conversion');
  }
};

export const createSocietyConversion = async (data: any, req?: IAuthRequest) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req?.user?.userId as string;

    if (!userId) {
      throw new AppError('User Not Found', 500);
    }
    // Validate society exists
    if (!data.society_id) {
      throw new AppError('Society ID is required', 400);
    }

    const society = await SocietyRegistration.findByPk(data.society_id, { transaction });
    if (!society) {
      throw new AppError('Society not found', 404);
    }

    if (req?.user?.role === 'applicant') {
      await assertConversionMeetingEligibility(data.society_id);
    }

    // Validate required fields
    if (!data.conversion_from) {
      throw new AppError('Conversion from (sector of operation) is required', 400);
    }

    if (!data.conversion_to) {
      throw new AppError('Conversion to (sector of operation) is required', 400);
    }

    // Validate that conversion_from exists in sector_of_operations
    const conversionFrom = await SectorOfOperation.findByPk(data.conversion_from, { transaction });
    if (!conversionFrom) {
      throw new AppError('Conversion from sector of operation not found', 404);
    }

    // Validate that conversion_to exists in sector_of_operations
    const conversionTo = await SectorOfOperation.findByPk(data.conversion_to, { transaction });
    if (!conversionTo) {
      throw new AppError('Conversion to sector of operation not found', 404);
    }

    // Validate that conversion_from and conversion_to are different
    if (data.conversion_from === data.conversion_to) {
      throw new AppError('Conversion from and conversion to must be different', 400);
    }

    // Set workflow_status to first workflow step for SOCIETY_CONVERSION (sequence 1)
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_CONVERSION', 1);

    // Determine status ID - if workflow is set, use the workflow step's status ID (submitted)
    let statusId: string | null = null;
    if (workflowStatusId) {
      // When workflow_status is set, get the workflow step and use its approval_status_id
      const workflowStep = await ModuleWorkflow.findByPk(workflowStatusId);
      if (workflowStep && (workflowStep as any).approval_status_id) {
        statusId = (workflowStep as any).approval_status_id;
        logger.info('Auto-setting status ID from workflow step', {
          workflow_step_id: workflowStatusId,
          sequence: 1,
          status_id: statusId
        });
      } else {
        // Fallback: use submitted status
        const submittedStatus = await findStatusByKey('submitted');
        if (submittedStatus) {
          statusId = submittedStatus.id;
        }
      }
    } else if (data.status) {
      // If status provided, check if it's ID or key
      if (typeof data.status === 'string' && data.status.length === 36 && data.status.includes('-')) {
        // Looks like UUID, use as-is
        statusId = data.status;
      } else {
        // Assume it's a key, find by key
        const status = await findStatusByKey(data.status);
        if (status) {
          statusId = status.id;
        }
      }
    } else {
      // Default to draft if no status provided and no workflow
      const draftStatus = await findStatusByKey('draft');
      if (draftStatus) {
        statusId = draftStatus.id;
      }
    }

    if (!statusId) {
      throw new AppError(
        'Could not set initial status for society conversion. Ensure SOCIETY_CONVERSION workflow is seeded and submitted or draft status exists in the system.',
        500
      );
    }

    mergeSocietyIdentityIntoConversionData(data);
    await snapshotOriginalSocietyIdentity(society.id, data, transaction);

    // Create society conversion
    const conversionData = {
      id: uuidv4(),
      society_id: data.society_id,
      conversion_from: data.conversion_from,
      conversion_to: data.conversion_to,
      conversion_reason: data.conversion_reason || null,
      notice_sgbm: data.notice_sgbm || null,
      minutes_meeting: data.minutes_meeting || null,
      attendance_sheet: data.attendance_sheet || null,
      form_g: data.form_g || null,
      bye_laws: data.bye_laws || null,
      audit_report: data.audit_report || null,
      status: statusId,
      approval_date: data.approval_date || null,
      approval_remarks: data.approval_remarks || null,
      certificate_path: data.certificate_path || null,
      data: data.data || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      workflow_status: workflowStatusId,
      assigned_to_user_id: null,
      created_by: userId,
    };

    const societyConversion = await SocietyConversion.create(conversionData, { transaction });

    // Keep society registration bye-laws in sync with conversion (store Media.id).
    // Only update when client explicitly sends bye_laws in payload.
    if (Object.prototype.hasOwnProperty.call(data, 'bye_laws')) {
      await society.update({ bye_laws: data.bye_laws ? String(data.bye_laws) : null }, { transaction });
    }

    await syncSocietyNameAndAddressFromConversion(society.id, data, transaction);

    await transaction.commit();

    logger.info('Society conversion created successfully', {
      conversionId: societyConversion.id,
      societyId: data.society_id,
      userId
    });

    // Fetch the created conversion with associations
    const createdConversion = await getSocietyConversionById(societyConversion.id);
    // Notify the role for the next workflow step (workflow_status is at step 1, so next flow = step 2's role)
    let nextFlowRoleNames: string[] = ['drcs_arcs_district'];
    try {
      const workflowStatus = await getWorkflowStatus(createdConversion.id, 'SOCIETY_CONVERSION', false);
      const nextRoleName = workflowStatus?.nextWorkflow?.allowedRole?.name;
      if (nextRoleName) {
        nextFlowRoleNames = [nextRoleName];
        logger.info('Notifying next workflow role for society conversion created', { nextRoleName });
      }
    } catch (err: any) {
      logger.warn('Could not resolve next workflow role for notification, using fallback', { error: err?.message });
    }
    await notifyInspectorsInDistrict(society.district_id || 'unknown', {
      title: 'Society Conversion Created',
      description: `Society conversion created for society: ${society.cooperative_society_name || society.local_langauge_society_name}`,
      redirect_path: `/conversion-society/${createdConversion.society_id || societyConversion.society_id}`,
      created_by: userId,
      data: JSON.stringify({
        conversion: createdConversion
      })
    }, nextFlowRoleNames);


    // history for society conversion creation
    await createHistory({
      resource: 'society_conversion',
      type: 'create',
      reference_id: createdConversion.id,
      created_by: userId,
      comments: `Society conversion created for society: ${society.cooperative_society_name || society.local_langauge_society_name}`,
      data: JSON.stringify({
        conversion: createdConversion
      })
    });

    return createdConversion;
  } catch (error: unknown) {
    logger.error('Error in createSocietyConversion:', error);
    await rollbackIfOpen(transaction);
    throw mapSocietyConversionError(error, 'Failed to create society conversion');
  }
};

export const updateSocietyConversion = async (id: string, data: any, req?: IAuthRequest) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req?.user?.userId as string;
    if (!userId) {
      throw new AppError('User Not Found', 500);
    }
    // Permission check is enforced at the route layer
    // (canManageConversions → requirePermission('conversion','create')).
    // Re-checking `society.create` here diverges from the route and incorrectly
    // blocks roles granted only the `conversion` resource.

    // Find the conversion
    const societyConversion = await SocietyConversion.findByPk(id, { transaction });
    if (!societyConversion) {
      throw new AppError('Society conversion not found', 404);
    }

    // Check current status - only allow pending, draft, submit, or resubmit
    // ✅ FIXED: status is now stored as ID, not key
    const currentStatus = await findStatusById(societyConversion.status);
    const allowedStatusKeys = ['rejected', 'draft', 'submitted', 'resubmitted'];
    if (!currentStatus || !allowedStatusKeys.includes(currentStatus.key)) {
      throw new AppError('Conversion can only be resubmitted when status is draft, submitted, resubmitted, or rejected', 403);
    }

    // Determine status ID based on current status
    let targetStatusId: string;

    if (currentStatus?.key === 'draft') {
      // If current status is draft, set to submitted (first workflow step)
      const submittedStatus = await findStatusByKey('submitted');
      if (!submittedStatus) {
        throw new AppError('Submitted status not found', 404);
      }
      targetStatusId = submittedStatus.id;
    } else {
      // If current status is not draft (e.g., rejected), set to resubmitted
      const resubmittedStatus = await findStatusByKey('resubmitted');
      if (!resubmittedStatus) {
        throw new AppError('Resubmitted status not found', 404);
      }
      targetStatusId = resubmittedStatus.id;
    }

    // Start workflow: set workflow_status to first flow (sequence 1, is_hq false) on every update/resubmit so workflowStatus.next = sequence 2 is not null
    const workflowStatusId = await getWorkflowIdByModuleAndSequence('SOCIETY_CONVERSION', 1, false);
    if (workflowStatusId) {
      logger.info('Auto-setting workflow_status to first workflow step on society conversion update', {
        conversionId: id,
        workflow_step_id: workflowStatusId,
        sequence: 1
      });
    }

    // Validate sector of operations if provided
    if (data.conversion_from) {
      const conversionFrom = await SectorOfOperation.findByPk(data.conversion_from, { transaction });
      if (!conversionFrom) {
        throw new AppError('Conversion from sector of operation not found', 404);
      }
    }

    if (data.conversion_to) {
      const conversionTo = await SectorOfOperation.findByPk(data.conversion_to, { transaction });
      if (!conversionTo) {
        throw new AppError('Conversion to sector of operation not found', 404);
      }
    }

    // Validate that conversion_from and conversion_to are different if both provided
    const finalConversionFrom = data.conversion_from || societyConversion.conversion_from;
    const finalConversionTo = data.conversion_to || societyConversion.conversion_to;
    if (finalConversionFrom === finalConversionTo) {
      throw new AppError('Conversion from and conversion to must be different', 400);
    }

    mergeSocietyIdentityIntoConversionData(data);
    const existingIdentity = parseConversionData(societyConversion.data);
    const incomingIdentity = parseConversionData(data.data);
    data.data = {
      ...incomingIdentity,
      ...(existingIdentity[ORIGINAL_SOCIETY_NAME_KEY] && !incomingIdentity[ORIGINAL_SOCIETY_NAME_KEY]
        ? { [ORIGINAL_SOCIETY_NAME_KEY]: existingIdentity[ORIGINAL_SOCIETY_NAME_KEY] }
        : {}),
      ...(existingIdentity[ORIGINAL_SOCIETY_ADDRESS_KEY] && !incomingIdentity[ORIGINAL_SOCIETY_ADDRESS_KEY]
        ? { [ORIGINAL_SOCIETY_ADDRESS_KEY]: existingIdentity[ORIGINAL_SOCIETY_ADDRESS_KEY] }
        : {}),
    };
    await snapshotOriginalSocietyIdentity(societyConversion.society_id, data, transaction);

    // Prepare update data: strip workflow_status from body, we always set it to 1st flow
    const { workflow_status: _discardWorkflowStatus, ...dataWithoutWorkflowStatus } = data;
    const updateData: any = {
      ...dataWithoutWorkflowStatus,
      status: targetStatusId, // ✅ Store status ID, not key
      workflow_status: workflowStatusId, // ✅ Start workflow: always set to 1st flow on update
    };

    // Update the conversion
    await societyConversion.update(updateData, { transaction });

    // Keep society registration bye-laws in sync with conversion (store Media.id).
    // Only update when client explicitly sends bye_laws in payload.
    if (Object.prototype.hasOwnProperty.call(data, 'bye_laws')) {
      const society = await SocietyRegistration.findByPk(societyConversion.society_id, { transaction });
      if (society) {
        await society.update({ bye_laws: data.bye_laws ? String(data.bye_laws) : null }, { transaction });
      }
    }

    await syncSocietyNameAndAddressFromConversion(societyConversion.society_id, data, transaction);

    await transaction.commit();

    logger.info('Society conversion resubmitted successfully', {
      conversionId: societyConversion.id,
      societyId: societyConversion.society_id,
      userId,
      newStatusId: targetStatusId,
      newStatusKey: currentStatus?.key
    });

    // Fetch the updated conversion with associations
    const updatedConversion = await getSocietyConversionById(societyConversion.id);
    const society = (updatedConversion as any).society;
    const societyName = society?.cooperative_society_name || society?.local_langauge_society_name || 'Society';
    const districtId = society?.district_id || 'unknown';

    // Notify the role for the next workflow step (workflow_status is at step 1, so next flow = step 2's role)
    let nextFlowRoleNames: string[] = ['drcs_arcs_district'];
    try {
      const workflowStatus = await getWorkflowStatus(updatedConversion.id, 'SOCIETY_CONVERSION', false);
      const nextRoleName = workflowStatus?.nextWorkflow?.allowedRole?.name;
      if (nextRoleName) {
        nextFlowRoleNames = [nextRoleName];
        logger.info('Notifying next workflow role for society conversion update', { nextRoleName });
      }
    } catch (err: any) {
      logger.warn('Could not resolve next workflow role for notification, using fallback', { error: err?.message });
    }
    await notifyInspectorsInDistrict(districtId, {
      title: 'Society Conversion Resubmitted',
      description: `Society conversion resubmitted for society: ${societyName}`,
      redirect_path: `/conversion-society/${updatedConversion.society_id || societyConversion.society_id}`,
      created_by: userId,
      data: JSON.stringify({
        conversion: updatedConversion
      })
    }, nextFlowRoleNames);

    // History for society conversion update/resubmit
    await createHistory({
      resource: 'society_conversion',
      type: 'resubmit',
      reference_id: updatedConversion.id,
      created_by: userId,
      comments: `Society conversion resubmitted for society: ${societyName}`,
      data: JSON.stringify({
        conversion: updatedConversion
      })
    });

    return updatedConversion;
  } catch (error: unknown) {
    logger.error('Error in updateSocietyConversion:', error);
    await rollbackIfOpen(transaction);
    throw mapSocietyConversionError(error, 'Failed to resubmit society conversion');
  }
}
