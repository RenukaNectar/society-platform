import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  createUser,
  findUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  toggleUserStatus,
  toggleUserLock,
  resetFailedLoginAttempts,
  getUserStats,
  getSocietyByUserId,
  getUsersByRoleService,
  uploadSignatureService,
  setUserAvailability,
  getAvailableUsersByRoleAndDistrict,
  getUserAvailabilitySummary,
  bulkCreateApplicantsFromExcel
} from "../services/UserService";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import { IAuthRequest } from "../types";
import {
  resolveUserIsHq,
  shouldIgnoreDistrictForRoleQuery,
  shouldIgnoreIsHqForRoleQuery
} from "../utils/userHq";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role_id = req.query.role_id as string;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const isLocked = req.query.isLocked !== undefined ? req.query.isLocked === 'true' : undefined;

    const result = await getAllUsers(page, limit, search, role_id, isActive, isLocked);

    returnResponse(res).ok('Users retrieved successfully', {
      users: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error) {
    logger.error('Failed to get users:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await findUserById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    returnResponse(res).ok('User retrieved successfully', user);
  } catch (error) {
    logger.error('Failed to get user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const createUserController = async (req: IAuthRequest, res: Response) => {
  try {
    const userData = req.body;
    console.log('Received user data:', userData);
    console.log('Field names in request body:', Object.keys(userData));
    console.log('first_name value:', userData.first_name);
    console.log('last_name value:', userData.last_name);
    console.log('phone value:', userData.phone);

    const newUser = await createUser(userData, req.user?.userId);
    if (!newUser) {
      returnResponse(res).error('Failed to create User', null)
    }

    returnResponse(res).ok('User created successfully', newUser);
  } catch (error) {
    logger.error('Failed to create user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const bulkUploadApplicantsController = async (req: IAuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return returnResponse(res).error('File is required (field name: file)', null);
    }

    const extension = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension)) {
      return returnResponse(res).error('Only .xlsx, .xls or .csv files are allowed', null);
    }

    const result = await bulkCreateApplicantsFromExcel(file.buffer, req.user?.userId, extension);

    return returnResponse(res).ok('Bulk applicant upload completed', result);
  } catch (error) {
    logger.error('Failed to bulk upload applicants:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message, null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

export const updateUserController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const updatedUser = await updateUser(id, updateData, req.user?.userId);

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    returnResponse(res).ok('User updated successfully', updatedUser);
  } catch (error) {
    logger.error('Failed to update user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const deleteUserController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const isActive = await deleteUser(id, req.user?.userId);

    returnResponse(res).ok(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { isActive });
  } catch (error) {
    logger.error('Failed to delete user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const toggleUserStatusController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updatedUser = await toggleUserStatus(id, true, req.user?.userId);

    returnResponse(res).ok(`User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`, updatedUser);
  } catch (error) {
    logger.error('Failed to toggle user status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const toggleUserLockController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await toggleUserLock(id, true, req.user?.userId);

    returnResponse(res).ok(`User locked successfully`, null);
  } catch (error) {
    logger.error('Failed to toggle user lock:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const resetUserLoginAttemptsController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await resetFailedLoginAttempts(id);

    returnResponse(res).ok('User login attempts reset successfully', null);
  } catch (error) {
    logger.error('Failed to reset user login attempts:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getUserStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getUserStats();

    returnResponse(res).ok('User statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getProfileController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId as string;
    if (!userId) {
      returnResponse(res).error('User not found', null);
    }

    const { user, society, members, conversions } = await getSocietyByUserId(userId);
    returnResponse(res).ok('User retrieved successfully', { user, society, members, conversions });
  } catch (error) {
    logger.error('Failed to get profile:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
}


export const getUsersByRole = async (req: IAuthRequest, res: Response) => {

  try {

    const { district_id, role, userId }: any = req.user;

    // const { roleName } = req.params;
    const { is_hq, name, roleNames: queryRoleNames }: any = req.query;
    if (!queryRoleNames) {
      return res.status(400).json({
        message: "roleNames query param is required",
      });
    }

    let roleNames = queryRoleNames;

    if (typeof roleNames === "string") {
      roleNames = roleNames.split(",").map((r: string) => r.trim());
    }

    if (!Array.isArray(roleNames)) {
      return res.status(400).json({
        message: "roleNames must be array or comma-separated string",
      });
    }

    roleNames = roleNames.map((r: string) => String(r).trim()).filter(Boolean);
    if (!roleNames.length) {
      return res.status(400).json({
        message: "roleNames must contain at least one role",
      });
    }

    const skipIsHqCheck = shouldIgnoreIsHqForRoleQuery(roleNames);
    const skipDistrictCheck = shouldIgnoreDistrictForRoleQuery(roleNames);

    if (!district_id && !skipDistrictCheck) {
      return res.status(400).json({
        message: "District Not Found"
      })
    }

    if (
      !skipIsHqCheck &&
      is_hq !== undefined &&
      is_hq !== null &&
      is_hq !== '' &&
      parseInt(String(is_hq), 10) !== 0 &&
      parseInt(String(is_hq), 10) !== 1
    ) {
      return res.status(400).json({
        message: "Invalid value!"
      })
    }

    const users = await getUsersByRoleService(
      district_id,
      roleNames,
      skipIsHqCheck ? undefined : (is_hq as number),
      name,
      role as string,
      userId as string,
      resolveUserIsHq(req.user)
    );

    if (!users.length) {
      return res.status(404).json({
        message: `No users found with role ${roleNames}`,
      });
    }

    // return res.status(200).json(users);
    returnResponse(res).ok('User retrieved successfully', users);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


// upload rcs signature

export const uploadSignatureController = async (req: any, res: Response) => {
  try {
    const user = req.user;



  const SIGNATURE_UPLOAD_ROLES = ['rcs_district', 'drcs_arcs_district'];
  if (!SIGNATURE_UPLOAD_ROLES.includes(user.role)) {
    throw new Error("Only RCS District and DRCS/ARCS District users can upload signature");
  }
  
    if (!req.body.signature_media_id) { //req.file
      return res.status(400).json({
        success: false,
        message: "Signature file is required",
      });
    }

    const result = await uploadSignatureService(
      req.user,
      req.body.signature_media_id
    );

    return res.status(201).json({
      success: true,
      message: "Signature uploaded successfully",
      data: result,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Set / clear user availability.
 * Permission: caller can update own availability, OR be admin/super_admin.
 *
 * Body:
 *   isAvailable      boolean (required)
 *   unavailableUntil YYYY-MM-DD or ISO date (optional; auto-restore after this calendar day)
 */
export const setUserAvailabilityController = async (req: IAuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id as string;
    const callerId = req.user?.userId as string;
    const callerRole = (req.user as any)?.role as string | undefined;

    if (!callerId) return returnResponse(res).error('Authenticated user not found', null);

    const isSelf = callerId === targetUserId;
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    if (!isSelf && !isAdmin) {
      return returnResponse(res).error(
        'Only the user themselves or an admin can change availability',
        null
      );
    }

    const { isAvailable, reason, unavailableUntil } = req.body as {
      isAvailable: boolean;
      reason?: string;
      unavailableUntil?: string | null;
    };

    if (typeof isAvailable !== 'boolean') {
      return returnResponse(res).error('isAvailable must be a boolean', null);
    }

    const updated = await setUserAvailability(targetUserId, {
      isAvailable,
      reason,
      unavailableUntil: unavailableUntil ?? null,
      actorUserId: callerId
    });

    return returnResponse(res).ok(
      isAvailable ? 'User marked available' : 'User marked unavailable',
      updated
    );
  } catch (error: any) {
    logger.error('Failed to set user availability:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to set availability', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

/**
 * List users who can take a workflow assignment (role + optional district filter).
 * Returns only active + available users. Used by the reassign dropdown on the frontend.
 *
 * Query:
 *   roleId       UUID
 *   roleName     string (alternative to roleId)
 *   districtId   UUID  (optional)
 *   stateId      UUID  (optional)
 *   excludeUserId string|string[] (optional — typically pass currentAssignee id)
 */
/** GET /users/:id/availability — assignee availability for workflow screens */
export const getUserAvailabilitySummaryController = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const summary = await getUserAvailabilitySummary(id);
    return returnResponse(res).ok('User availability retrieved', summary);
  } catch (error: any) {
    logger.error('Failed to get user availability summary:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to get availability', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};

export const getAvailableUsersController = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return returnResponse(res).error('Authenticated user not found', null);

    const roleId = (req.query.roleId as string) || undefined;
    const roleName = (req.query.roleName as string) || undefined;
    const districtId = (req.query.districtId as string) || undefined;
    const stateId = (req.query.stateId as string) || undefined;

    if (!roleId && !roleName) {
      return returnResponse(res).error('Either roleId or roleName is required', null);
    }

    const rawExclude = req.query.excludeUserId;
    const excludeUserIds = !rawExclude
      ? undefined
      : Array.isArray(rawExclude)
        ? (rawExclude as string[])
        : [rawExclude as string];

    const users = await getAvailableUsersByRoleAndDistrict({
      roleId,
      roleName,
      districtId,
      stateId,
      excludeUserIds
    });

    return returnResponse(res).ok('Available users fetched successfully', users);
  } catch (error: any) {
    logger.error('Failed to fetch available users:', error);
    if (error instanceof AppError) {
      return returnResponse(res).error(error.message || 'Failed to fetch available users', null);
    }
    return returnResponse(res).error('Internal server error', null);
  }
};
