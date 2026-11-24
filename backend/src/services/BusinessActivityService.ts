import { Op } from 'sequelize';
import BusinessActivity from '../models/BusinessActivity';
import SocietyRegistration from '../models/SocietyRegistration';
import SectorOfOperation from '../models/SectorOfOperation';
import District from '../models/District';
import State from '../models/State';
import Status from '../models/Status';
import {
  formatWorkflowStatusForApi,
  getWorkflowIdByModuleAndSequence,
  getWorkflowStatus,
} from './WorkflowUtilService';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { findUserById } from './UserService';
import { getSectorOfOperationById } from './SectorOfOperationService';
import { getStateById } from './StateService';
import { generateNcdId } from '../utils/NcdNumberGenerate';
import { IAuthRequest } from '../types';

const sectorInclude = {
  model: SectorOfOperation,
  as: 'sectorOfOperation',
  attributes: ['id', 'name', 'code', 'respective_table'],
  required: false,
};

const statusInclude = {
  model: Status,
  as: 'statusDetails',
  attributes: ['id', 'key', 'title'],
  required: false,
};

const societySummaryInclude = {
  model: SocietyRegistration,
  as: 'society',
  attributes: [
    'id',
    'society_id',
    'cooperative_society_name',
    'registration_number',
    'district_id',
    'state_id',
  ],
  required: false,
  include: [
    { model: District, as: 'district', attributes: ['id', 'name'], required: false },
    { model: State, as: 'state', attributes: ['id', 'name'], required: false },
  ],
};

export const parseBusinessActivityAdditionalData = (
  raw: unknown
): Record<string, unknown> | null => {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.keys(raw as object).length > 0 ? (raw as Record<string, unknown>) : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.keys(parsed as object).length > 0
          ? (parsed as Record<string, unknown>)
          : null;
      }
    } catch {
      return null;
    }
  }
  return null;
};

const normalizeAdditionalDataInput = (value: unknown): Record<string, unknown> | null => {
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed !== null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
      throw new AppError('additional_data must be a JSON object', 400);
    }
    return parsed as Record<string, unknown> | null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new AppError('additional_data must be a JSON object', 400);
};

const assertCanAccessSocietyRegistration = async (
  societyRegistration: SocietyRegistration,
  userId: string
): Promise<void> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User Not Found', 401);
  }

  const roleName = user?.role?.name;
  if (roleName === 'applicant') {
    if (String(societyRegistration.created_by || '') !== String(userId)) {
      throw new AppError('You are not authorized to access this society', 403);
    }
    return;
  }

  const isHq = Boolean(user.is_hq);
  const isCrossDistrictRole =
    roleName === 'rcs_district' ||
    roleName === 'jt_rcs_district' ||
    roleName === 'jics_sics_hq';

  const skipDistrictScope =
    roleName === 'admin' ||
    roleName === 'super_admin' ||
    isHq ||
    isCrossDistrictRole;

  if (
    !skipDistrictScope &&
    user.district_id &&
    String(societyRegistration.district_id || '') !== String(user.district_id)
  ) {
    throw new AppError('You are not authorized to access this society', 403);
  }
};

const buildSocietyScopeForList = async (userId: string): Promise<Record<string, unknown>> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User Not Found', 401);
  }

  const where: Record<string, unknown> = {};
  const roleName = user?.role?.name;

  if (roleName === 'applicant') {
    where.created_by = userId;
    return where;
  }

  const isHq = Boolean(user.is_hq);
  const isCrossDistrictRole =
    roleName === 'rcs_district' ||
    roleName === 'jt_rcs_district' ||
    roleName === 'jics_sics_hq';

  const skipDistrictScope =
    roleName === 'admin' ||
    roleName === 'super_admin' ||
    isHq ||
    isCrossDistrictRole;

  if (!skipDistrictScope && user.district_id) {
    where.district_id = user.district_id;
  }

  return where;
};

const clearOtherPrimaryFlags = async (
  societyId: string,
  exceptId?: string
): Promise<void> => {
  const where: Record<string, unknown> = {
    society_id: societyId,
    is_primary: true,
    is_active: true,
  };
  if (exceptId) {
    where.id = { [Op.ne]: exceptId };
  }
  await BusinessActivity.update({ is_primary: false }, { where: where as any });
};

const loadSocietyOrThrow = async (societyId: string): Promise<SocietyRegistration> => {
  const society = await SocietyRegistration.findByPk(societyId, {
    attributes: ['id', 'created_by', 'district_id', 'state_id'],
  });
  if (!society) {
    throw new AppError('Society registration not found', 404);
  }
  return society;
};

export const getAllBusinessActivities = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  userId?: string,
  filters?: {
    district_id?: string;
    state_id?: string;
    sector_of_operation?: string;
    society_id?: string;
  }
) => {
  if (!userId) {
    throw new AppError('User Not Found', 401);
  }

  const offset = (page - 1) * limit;
  const societyWhere: any = await buildSocietyScopeForList(userId);

  if (filters?.district_id) societyWhere.district_id = filters.district_id;
  if (filters?.state_id) societyWhere.state_id = filters.state_id;

  const activityWhere: Record<string, unknown> = { is_active: true };
  if (filters?.sector_of_operation) {
    activityWhere.sector_of_operation = filters.sector_of_operation;
  }
  if (filters?.society_id) {
    activityWhere.society_id = filters.society_id;
  }

  if (search) {
    societyWhere[Op.or] = [
      { cooperative_society_name: { [Op.like]: `%${search}%` } },
      { registration_number: { [Op.like]: `%${search}%` } },
      { society_id: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await BusinessActivity.findAndCountAll({
    where: activityWhere as any,
    include: [
      sectorInclude,
      statusInclude,
      {
        ...societySummaryInclude,
        where: Object.keys(societyWhere).length ? societyWhere : undefined,
        required: Object.keys(societyWhere).length > 0,
      },
    ],
    limit,
    offset,
    order: [['updated_at', 'DESC']],
    distinct: true,
    col: 'id',
  } as any);

  const businessActivities = rows.map((row) => {
    const json = row.toJSON() as unknown as Record<string, unknown>;
    return {
      ...json,
      additional_data: parseBusinessActivityAdditionalData(json.additional_data),
    };
  });

  const totalPages = Math.ceil(count / limit) || 1;
  return {
    businessActivities,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const getBusinessActivitiesBySocietyId = async (
  societyId: string,
  userId?: string,
  options?: { includeInactive?: boolean }
) => {
  const society = await loadSocietyOrThrow(societyId);
  if (userId) {
    await assertCanAccessSocietyRegistration(society, userId);
  }

  const where: Record<string, unknown> = { society_id: societyId };
  if (!options?.includeInactive) {
    where.is_active = true;
  }

  const rows = await BusinessActivity.findAll({
    where: where as any,
    include: [sectorInclude, statusInclude, societySummaryInclude],
    order: [
      ['is_primary', 'DESC'],
      ['updated_at', 'DESC'],
    ],
  });

  return rows.map((row) => {
    const json = row.toJSON() as unknown as Record<string, unknown>;
    return {
      ...json,
      additional_data: parseBusinessActivityAdditionalData(json.additional_data),
    };
  });
};

const ensureSubmittedWorkflow = async (activity: BusinessActivity): Promise<void> => {
  if (activity.workflow_status) return;
  const submittedStatus = await Status.findOne({ where: { key: 'submitted' } });
  const workflowStatusId = await getWorkflowIdByModuleAndSequence('BUSINESS_ACTIVITY', 1);
  if (!workflowStatusId) return;
  await activity.update({
    workflow_status: workflowStatusId,
    status_id: activity.status_id || submittedStatus?.id || null,
  });
};

export const getBusinessActivityById = async (id: string, userId?: string) => {
  const activity = await BusinessActivity.findByPk(id, {
    include: [sectorInclude, statusInclude, societySummaryInclude],
  });

  if (!activity) {
    throw new AppError('Business activity not found', 404);
  }

  const society = await loadSocietyOrThrow(activity.society_id);
  if (userId) {
    await assertCanAccessSocietyRegistration(society, userId);
  }

  await ensureSubmittedWorkflow(activity);
  await activity.reload({ include: [sectorInclude, statusInclude, societySummaryInclude] });

  const json = activity.toJSON() as unknown as Record<string, unknown>;
  const result: Record<string, unknown> = {
    ...json,
    additional_data: parseBusinessActivityAdditionalData(json.additional_data),
  };

  try {
    if (activity.workflow_status) {
      const workflowStatus = await getWorkflowStatus(activity.id, 'BUSINESS_ACTIVITY', false);
      result.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
    } else {
      result.workflowStatus = {};
    }
  } catch (workflowError: any) {
    logger.warn('Failed to load business activity workflow status', {
      id: activity.id,
      error: workflowError?.message,
    });
    result.workflowStatus = {};
  }

  return result;
};

export const createBusinessActivity = async (
  societyId: string,
  data: {
    additional_data?: unknown;
    sector_of_operation?: string | null;
    title?: string | null;
    is_primary?: boolean;
  },
  req?: IAuthRequest
) => {
  const userId = req?.user?.userId as string | undefined;
  const society = await loadSocietyOrThrow(societyId);
  if (userId) {
    await assertCanAccessSocietyRegistration(society, userId);
  }

  const additionalData = normalizeAdditionalDataInput(data.additional_data ?? null);
  let sectorId: string | null = null;

  if (
    data.sector_of_operation != null &&
    String(data.sector_of_operation).trim() !== ''
  ) {
    const sector = await getSectorOfOperationById(String(data.sector_of_operation).trim());
    if (!sector?.id) {
      throw new AppError('Invalid sector_of_operation', 400);
    }
    sectorId = sector.id;
  }

  const existingActivities = await BusinessActivity.findAll({
    where: { society_id: societyId, is_active: true },
    include: [statusInclude],
  });
  const hasUnapproved = existingActivities.some((row) => {
    const key = String((row as any).statusDetails?.key || '').toLowerCase().trim();
    return key !== 'approved' && key !== 'registrar_approved';
  });
  if (hasUnapproved) {
    throw new AppError(
      'A sector of operation request is still pending approval. You can add another only after it is approved.',
      400
    );
  }

  const existingCount = existingActivities.length;
  const isPrimary = data.is_primary === true || existingCount === 0;
  if (isPrimary) {
    await clearOtherPrimaryFlags(societyId);
  }

  const submittedStatus = await Status.findOne({ where: { key: 'submitted' } });
  const workflowStatusId = await getWorkflowIdByModuleAndSequence('BUSINESS_ACTIVITY', 1);

  const created = await BusinessActivity.create({
    society_id: societyId,
    sector_of_operation: sectorId,
    title: data.title?.trim() || null,
    additional_data: additionalData,
    is_primary: isPrimary,
    is_active: true,
    status_id: submittedStatus?.id ?? null,
    workflow_status: workflowStatusId,
    created_by: userId ?? null,
    updated_by: userId ?? null,
  });

  await syncSocietyRegistrationFromLatestBusinessActivity(societyId, userId ?? null);

  const reloaded = await getBusinessActivityById(created.id, userId);
  logger.info('Business activity created', { id: created.id, societyId });
  return reloaded;
};

export const updateBusinessActivity = async (
  id: string,
  data: {
    additional_data?: unknown;
    sector_of_operation?: string | null;
    title?: string | null;
    is_primary?: boolean;
    is_active?: boolean;
  },
  req?: IAuthRequest
) => {
  const userId = req?.user?.userId as string | undefined;
  const activity = await BusinessActivity.findByPk(id);
  if (!activity) {
    throw new AppError('Business activity not found', 404);
  }

  const society = await loadSocietyOrThrow(activity.society_id);
  if (userId) {
    await assertCanAccessSocietyRegistration(society, userId);
  }

  const updates: Record<string, unknown> = { updated_by: userId ?? null };

  if (data.additional_data !== undefined) {
    updates.additional_data = normalizeAdditionalDataInput(data.additional_data);
  }

  if (data.title !== undefined) {
    updates.title = data.title?.trim() || null;
  }

  if (data.is_active !== undefined) {
    updates.is_active = Boolean(data.is_active);
  }

  if (
    data.sector_of_operation !== undefined &&
    data.sector_of_operation != null &&
    String(data.sector_of_operation).trim() !== ''
  ) {
    const sector = await getSectorOfOperationById(String(data.sector_of_operation).trim());
    if (!sector?.id) {
      throw new AppError('Invalid sector_of_operation', 400);
    }
    updates.sector_of_operation = sector.id;
  } else if (data.sector_of_operation === null) {
    updates.sector_of_operation = null;
  }

  if (data.is_primary === true) {
    await clearOtherPrimaryFlags(activity.society_id, id);
    updates.is_primary = true;
  } else if (data.is_primary === false) {
    updates.is_primary = false;
  }

  await activity.update(updates);
  await syncSocietyRegistrationFromLatestBusinessActivity(
    activity.society_id,
    userId ?? null
  );
  return getBusinessActivityById(id, userId);
};

/**
 * Copy the most recently updated active business activity onto society_registrations
 * (additional_data and sector_of_operation for NCD/legacy consumers).
 */
export const syncSocietyRegistrationFromLatestBusinessActivity = async (
  societyRegistrationId: string,
  userId?: string | null
): Promise<void> => {
  const latest = await BusinessActivity.findOne({
    where: { society_id: societyRegistrationId, is_active: true },
    order: [
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  const societyRegistration = await SocietyRegistration.findByPk(societyRegistrationId);
  if (!societyRegistration) {
    throw new AppError('Society registration not found', 404);
  }

  if (!latest) {
    return;
  }

  const additionalData = parseBusinessActivityAdditionalData(latest.additional_data);
  const updates: Record<string, unknown> = {
    additional_data: additionalData,
    updated_by: userId ?? latest.updated_by ?? null,
  };

  const sectorId = latest.sector_of_operation;
  if (sectorId) {
    const sectorOfOperation = await getSectorOfOperationById(String(sectorId)).catch(() => null);
    if (sectorOfOperation?.id) {
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
  }

  await societyRegistration.update(updates);
  logger.info('Society registration synced from latest business activity', {
    societyRegistrationId,
    businessActivityId: latest.id,
  });
};

/** Keeps legacy society_registrations.additional_data in sync with the primary activity row. */
export const syncPrimaryBusinessActivityFromRegistration = async (options: {
  societyRegistrationId: string;
  sectorOfOperationId?: string | null;
  additionalData: Record<string, unknown> | null;
  userId?: string | null;
}): Promise<void> => {
  const { societyRegistrationId, additionalData, userId } = options;
  let sectorId = options.sectorOfOperationId ?? null;

  const primary = await BusinessActivity.findOne({
    where: {
      society_id: societyRegistrationId,
      is_primary: true,
      is_active: true,
    },
    order: [['updated_at', 'DESC']],
  });

  if (primary) {
    await primary.update({
      additional_data: additionalData,
      sector_of_operation: sectorId ?? primary.sector_of_operation,
      updated_by: userId ?? null,
    });
    return;
  }

  const anyExisting = await BusinessActivity.count({
    where: { society_id: societyRegistrationId, is_active: true },
  });

  await BusinessActivity.create({
    society_id: societyRegistrationId,
    sector_of_operation: sectorId,
    additional_data: additionalData,
    is_primary: anyExisting === 0,
    is_active: true,
    created_by: userId ?? null,
    updated_by: userId ?? null,
  });
};
