import { Op, UUIDV1, where } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import User from '../models/user';
import Role from '../models/Role';
import { IUser, IUserCreate, IUserUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { findStatusById } from './StatusService';
import { getRegistrationAuthorityById } from './RegistrationAuthorityService';
import { getCooperativeSocietyTypeById } from './CooperativeSocietyTypeService';
import { getAreaOfOperationLevelById } from './AreaOfOperationLevelService';
import { getWaterBodyTypeById } from './WaterBodyTypeService';
import { getSectorOfOperationById } from './SectorOfOperationService';
import { getFunctionalStatusById } from './FunctionalStatusService';
import { getStateById } from './StateService';
import { getDistrictById } from './DistrictService';
import { getBlockById } from './BlockService';
import { getDistrictsBlocksGpVillageById } from './DistrictsBlocksGpVillageService';
import { getBankById } from './BankService';
import { getUrbanLocalBodyById } from './UrbanLocalBodyService';
import { getUrbanLocalBodyCodeById } from './UrbanLocalBodiesWardService';
import { getSectorOperationTypeById } from './SectorOfOperationsTypeService';
import { getLocationTypeById } from './LocationTypeService';
import SocietyRegistration from '../models/SocietyRegistration';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import SocietyConversion from '../models/SocietyConversion';
import SectorOfOperation from '../models/SectorOfOperation';
import Status from '../models/Status';
import Member from '../models/Member';
import Media from '../models/Media';
import State from '../models/State';
import District from '../models/District';
import { createActivity } from './ActiviesService';
import { attachCompleteProcessingHistoryToDetail } from './WorkflowCommentService';
import SocietyRenewal from '../models/SocietyRenewal';
import { resolveLatestRenewalChallanReceipt } from './SocietyRenewalService';
import {
  resolveUserIsHq,
  shouldIgnoreDistrictForRoleQuery,
  shouldIgnoreIsHqForRoleQuery
} from '../utils/userHq';
import {
  excludeApprovedDeletedShareholders,
  getApprovedAgmNonSelectedShareholdersForSociety,
  mergeMembersWithApprovedAgmNonSelectedShareholders,
} from './meetingBodMemberService';
import { findRoleByIdOrName } from './RoleService';
import * as XLSX from 'xlsx';

// Utility function to sanitize user data (remove sensitive fields)
export const sanitizeUserData = (user: any): Omit<IUser, 'password' | 'reset_token' | 'otp' | 'otp_expiry'> => {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.reset_token;
  delete sanitized.otp;
  delete sanitized.otp_expiry;
  delete sanitized.failed_otp_attempts;
  delete sanitized.otp_locked_until;
  return sanitized;
};

// OTP lockout configuration: after MAX_OTP_ATTEMPTS wrong OTPs, lock for OTP_LOCK_DURATION_MS
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/** Map Sequelize / bcrypt errors to a clear AppError (avoids generic "Failed to create user"). */
function toCreateUserAppError(error: unknown): AppError {
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
      (first?.path ? `A user with this ${first.path} already exists` : 'This record already exists');
    return new AppError(detail, 409);
  }

  if (err?.name === 'SequelizeValidationError') {
    const msgs = err.errors?.map((e) => e.message).filter(Boolean) ?? [];
    return new AppError(msgs.length ? msgs.join('; ') : 'Validation failed', 400);
  }

  if (err?.name === 'SequelizeForeignKeyConstraintError') {
    const msg =
      err.parent?.sqlMessage ||
      err.parent?.message ||
      'Invalid related data (for example role or district reference)';
    return new AppError(msg, 400);
  }

  if (err?.name === 'SequelizeDatabaseError' || err?.name === 'SequelizeTimeoutError') {
    const msg = err.parent?.sqlMessage || err.parent?.message || err.message || 'Database error';
    return new AppError(msg, 500);
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500);
  }

  return new AppError(String(error), 500);
}

// Create user
export const createUser = async (userData: IUserCreate, createdByUserId?: string): Promise<IUser> => {
  try {
    userData.password = await bcrypt.hash(userData?.password, 12);
    const user = await User.create(userData);
    logger.info('User created successfully', { userId: user.id });
    // Log activity
    await createActivity({
      title: 'User Created',
      description: `New user "${userData.email}" created successfully`,
      data: {
        user_id: user.id,
        user_name: userData.email,
        user_email: userData.email,
        user_phone: userData.phone,
        role_id: userData.role_id,
        district_id: userData.district_id,
        created_by: createdByUserId || null
      },
      reference_id: user.id,
      created_by: createdByUserId || null
    });

    return user.toJSON();
  } catch (error) {
    logger.error('Failed to create user:', error);
    throw toCreateUserAppError(error);
  }
};

export const findUserByIdWithPassword = async (id: string) => {
  return await User.findByPk(id)
}

// Find user by ID
export const findUserById = async (id: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  try {
    if (!id) {
      logger.warn('findUserById called with empty or invalid ID');
      return null;
    }

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          required: false
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: State,
          as: 'state',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url'],
          required: false
        }
      ]
    });

    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return null;
    }

    return sanitizeUserData(user.toJSON());
  } catch (error: any) {
    logger.error('Failed to find user by ID:', {
      error: error?.message || String(error),
      stack: error?.stack,
      userId: id,
      errorName: error?.name
    });

    // If it's a database connection error or similar, throw with more context
    if (error?.name === 'SequelizeConnectionError' || error?.name === 'SequelizeDatabaseError') {
      throw new AppError(`Database error while finding user: ${error?.message || 'Unknown database error'}`, 500);
    }

    // For other errors, throw with original message if available
    throw new AppError(`Failed to find user: ${error?.message || 'Unknown error'}`, 500);
  }
};

export const findUserByEmailForLogin = async (email: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ email }, { phone: email }] }
    });

    if (!user) return null;

    const userData = user.get({ plain: true });

    const userRole = await Role.findByPk(userData.role_id);
    if (userRole) {
      userData.role = userRole.toJSON();
      userData.permissions = [];
    }

    if (userData.district_id) {
      userData.district = await District.findByPk(userData.district_id);
    }

    if (userData.state_id) {
      userData.state = await State.findByPk(userData.state_id);
    }

    return userData as IUser;
  } catch (error: any) {
    console.error('Failed to find user by email for login:', error.message || error);
    throw new AppError('Failed to find user', 500);
  }
};


// Find user by email (sanitized)
export const findUserByEmail = async (email: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  try {
    const user = await User.findOne({
      where: { email, is_active: true }
    });
    return user ? sanitizeUserData(user.toJSON()) : null;
  } catch (error) {
    logger.error('Failed to find user by email:', error);
    throw new AppError('Failed to find user', 500);
  }
};

// Find user by Aadhar number
export const findUserByAadhar = async (aadharNumber: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  try {
    const user = await User.findOne({
      where: { aadhar_number: aadharNumber },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    return user ? sanitizeUserData(user.toJSON()) : null;
  } catch (error) {
    logger.error('Failed to find user by Aadhar number:', error);
    throw new AppError('Failed to find user', 500);
  }
};

// Find user by PAN number
export const findUserByPan = async (panNumber: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  try {
    const user = await User.findOne({
      where: { pan_number: panNumber },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    return user ? sanitizeUserData(user.toJSON()) : null;
  } catch (error) {
    logger.error('Failed to find user by PAN number:', error);
    throw new AppError('Failed to find user', 500);
  }
};

// Update user
export const updateUser = async (id: string, updateData: Partial<IUserUpdate>, updatedByUserId?: string): Promise<Omit<IUser, 'password' | 'reset_token'>> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    logger.info('User updated successfully', { userId: id });

    // Log activity
    try {
      await createActivity({
        title: 'User Updated',
        description: `User "${user.email}" profile updated successfully`,
        data: {
          user_id: user.id,
          user_name: user.email,
          updated_fields: Object.keys(updateData),
          updated_by: updatedByUserId || 'system'
        },
        reference_id: user.id,
        created_by: updatedByUserId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log user update activity:', activityError);
    }

    return sanitizeUserData(updatedUser!.toJSON());
  } catch (error) {
    logger.error('Failed to update user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update user', 500);
  }
};

// Delete user
export const deleteUser = async (id: string, deletedByUserId?: string): Promise<boolean> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    //  check if user is active true then insert false and this user is false then insert true
    const isactive = user.is_active === true ? false : true;
    await user.update({ is_active: isactive });

    logger.info('User deleted successfully', { userId: id, isActive: isactive });

    // Log activity
    try {
      await createActivity({
        title: 'User Status Changed',
        description: `User "${user.email}" ${isactive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user_id: user.id,
          user_name: user.email,
          action: isactive ? 'activated' : 'deactivated',
          previous_status: user.is_active,
          new_status: isactive,
          updated_by: deletedByUserId || 'system'
        },
        reference_id: user.id,
        created_by: deletedByUserId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log user status change activity:', activityError);
    }

    return isactive;
  } catch (error) {
    logger.error('Failed to delete user:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete user', 500);
  }
};

// Get all users with pagination
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role_id?: string,
  isActive?: boolean,
  isLocked?: boolean
): Promise<{
  users: Omit<IUser, 'password' | 'reset_token'>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { aadhar_number: { [Op.like]: `%${search}%` } },
        { pan_number: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role_id) {
      whereConditions.role_id = role_id;
    }

    if (isLocked !== undefined) {
      whereConditions.is_locked = isLocked;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: State,
          as: 'state',
        },
        {
          model: District,
          as: 'district',
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ],
      limit,
      offset: (page - 1) * limit
    });

    let adminId = (await Role.findOne({ where: { name: 'admin' } }))?.id;

    return {
      users: await Promise.all(rows.filter((user) => user.role_id !== adminId?.toString()).map(async (user) => {
        const role = await Role.findByPk(user.role_id);
        return {
          ...sanitizeUserData(user.toJSON()),
          role: role?.toJSON()
        };
      })),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    logger.error('Failed to get users:', error);
    throw new AppError('Failed to get users', 500);
  }
};

// Activate/Deactivate user
export const toggleUserStatus = async (id: string, isActive: boolean, updatedByUserId?: string): Promise<Omit<IUser, 'password' | 'reset_token'>> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ is_active: isActive });

    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    logger.info(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { userId: id });

    // Log activity
    try {
      await createActivity({
        title: 'User Status Toggled',
        description: `User "${user.email}" ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user_id: user.id,
          user_name: user.email,
          action: isActive ? 'activated' : 'deactivated',
          previous_status: user.is_active,
          new_status: isActive,
          updated_by: updatedByUserId || 'system'
        },
        reference_id: user.id,
        created_by: updatedByUserId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log user status toggle activity:', activityError);
    }

    return sanitizeUserData(updatedUser!.toJSON());
  } catch (error) {
    logger.error('Failed to toggle user status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to toggle user status', 500);
  }
};

// Lock/Unlock user
export const toggleUserLock = async (id: string, isLocked: boolean, updatedByUserId?: string): Promise<Omit<IUser, 'password' | 'reset_token'>> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ is_locked: isLocked });

    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    logger.info(`User ${isLocked ? 'locked' : 'unlocked'} successfully`, { userId: id });

    // Log activity
    try {
      await createActivity({
        title: 'User Lock Status Changed',
        description: `User "${user.email}" ${isLocked ? 'locked' : 'unlocked'} successfully`,
        data: {
          user_id: user.id,
          user_name: user.email,
          action: isLocked ? 'locked' : 'unlocked',
          previous_lock_status: user.is_locked,
          new_lock_status: isLocked,
          updated_by: updatedByUserId || 'system'
        },
        reference_id: user.id,
        created_by: updatedByUserId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log user lock status change activity:', activityError);
    }

    return sanitizeUserData(updatedUser!.toJSON());
  } catch (error) {
    logger.error('Failed to toggle user lock:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to toggle user lock', 500);
  }
};

// Update user password
export const updateUserPassword = async (id: string, newPassword: string, updatedByUserId?: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      password: await bcrypt.hash(newPassword, 12),
      token_version: (user.token_version || 0) + 1
    });
    await clearOTP(id);
    logger.info('User password updated successfully', { userId: id });

    // Log activity
    try {
      await createActivity({
        title: 'User Password Updated',
        description: `Password updated for user "${user.email}"`,
        data: {
          user_id: user.id,
          user_name: user.email,
          action: 'password_updated',
          updated_by: updatedByUserId || 'system'
        },
        reference_id: user.id,
        created_by: updatedByUserId || 'system'
      });
    } catch (activityError) {
      logger.error('Failed to log user password update activity:', activityError);
    }
  } catch (error) {
    logger.error('Failed to update user password:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update password', 500);
  }
};

// Update failed login attempts
export const updateFailedLoginAttempts = async (id: string, attempts: number): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updateData: any = {
      failed_login_attempts: attempts
    };

    // Lock user after 5 failed attempts and set locked_at timestamp
    if (attempts >= 5) {
      updateData.is_locked = true;
      updateData.locked_at = new Date();
    }

    await user.update(updateData);

    logger.info('Failed login attempts updated', { userId: id, attempts, isLocked: attempts >= 5 });
  } catch (error) {
    logger.error('Failed to update login attempts:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update login attempts', 500);
  }
};

// Reset failed login attempts
export const resetFailedLoginAttempts = async (id: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      failed_login_attempts: 0,
      is_locked: false,
      locked_at: undefined
    });

    logger.info('Failed login attempts reset', { userId: id });
  } catch (error) {
    logger.error('Failed to reset login attempts:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to reset login attempts', 500);
  }
};

// Check if account should be unlocked after 3 hours
export const checkAndUnlockAccount = async (user: any): Promise<boolean> => {
  try {
    if (!user.is_locked || !user.locked_at) {
      return false;
    }

    const lockTime = new Date(user.locked_at);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - lockTime.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60); // Convert to hours

    // If 3 hours have passed, unlock the account
    if (hoursDifference >= 3) {
      await user.update({
        is_locked: false,
        locked_at: undefined,
        failed_login_attempts: 0
      });

      logger.info('Account automatically unlocked after 3 hours', {
        userId: user.id,
        lockedAt: user.locked_at,
        hoursDifference: hoursDifference.toFixed(2)
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Failed to check and unlock account:', error);
    return false;
  }
};

// Update last login
export const updateLastLogin = async (id: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ last_login: new Date() });
    logger.info('Last login updated', { userId: id });
  } catch (error) {
    logger.error('Failed to update last login:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update last login', 500);
  }
};

// Set reset token
export const setResetToken = async (id: string, token: string, expiry: Date): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      reset_token: token,
      reset_token_expiry: expiry
    });

    logger.info('Reset token set', { userId: id });
  } catch (error) {
    logger.error('Failed to set reset token:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to set reset token', 500);
  }
};

// Clear reset token
export const clearResetToken = async (id: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      reset_token: '',
      reset_token_expiry: new Date()
    });

    logger.info('Reset token cleared', { userId: id });
  } catch (error) {
    logger.error('Failed to clear reset token:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to clear reset token', 500);
  }
};

// Find user by reset token
export const findUserByResetToken = async (token: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  try {
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    return user ? sanitizeUserData(user.toJSON()) : null;
  } catch (error) {
    logger.error('Failed to find user by reset token:', error);
    throw new AppError('Failed to find user', 500);
  }
};

// Get user statistics
export const getUserStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  locked: number;
  unlocked: number;
}> => {
  try {
    const total = await User.count();
    const active = await User.count({ where: { is_active: true } });
    const inactive = await User.count({ where: { is_active: false } });
    const locked = await User.count({ where: { is_locked: true } });
    const unlocked = await User.count({ where: { is_locked: false } });

    return {
      total,
      active,
      inactive,
      locked,
      unlocked
    };
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    throw new AppError('Failed to get user statistics', 500);
  }
};

// Find user by phone number
export const findUserByPhoneNumber = async (phone: string): Promise<Omit<IUser, 'password' | 'reset_token'> | null> => {
  if (!phone) {
    return null;
  }

  try {
    const user = await User.findOne({ where: { phone, is_active: true } });
    return user ? sanitizeUserData(user.toJSON()) : null;
  } catch (error) {
    logger.error('Failed to find user by phone number:', error);
    throw new AppError('Failed to find user', 500);
  }
};

// Generate OTP
export const generateOTP = (): string => {
  // Bypass: always use static OTP for testing/dev
  return '1234';
};

// Set OTP for user
export const setOTP = async (id: string, otp: string, expiry: Date): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      otp,
      otp_expiry: expiry
    });

    logger.info('OTP set for user', { userId: id });
  } catch (error) {
    logger.error('Failed to set OTP:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to set OTP', 500);
  }
};

// Clear OTP for user
export const clearOTP = async (id: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      otp: '',
      otp_expiry: new Date()
    });

    logger.info('OTP cleared for user', { userId: id });
  } catch (error) {
    logger.error('Failed to clear OTP:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to clear OTP', 500);
  }
};

// Mark user email as verified
export const markUserEmailVerified = async (id: string): Promise<void> => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ is_email_verified: true });
    logger.info('User email marked as verified', { userId: id });
  } catch (error) {
    logger.error('Failed to mark user email as verified:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update email verification status', 500);
  }
};

// Verify OTP for user
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    const user = await User.findOne({
      where: {
        email,
        otp_expiry: { [Op.gt]: new Date() }
      }
    });

    if (!user || !user.otp) {
      return false;
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return false;
    }

    await clearOTP(user.id);

    return true;
  } catch (error) {
    logger.error('Failed to verify OTP:', error);
    throw new AppError('Failed to verify OTP', 500);
  }
};

// Returns true if account is currently OTP-locked. If the lock has expired,
// it clears the lock + attempts counter and returns false.
export const isUserOtpLocked = async (userId: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { locked: false };
  }

  if (!user.otp_locked_until) {
    return { locked: false };
  }

  const now = new Date();
  const lockedUntil = new Date(user.otp_locked_until);

  if (lockedUntil.getTime() > now.getTime()) {
    return { locked: true, lockedUntil };
  }

  // Lock has expired - clear it.
  await user.update({
    otp_locked_until: undefined,
    failed_otp_attempts: 0
  });
  return { locked: false };
};

// Increment failed OTP attempts. If threshold is hit, lock the account for OTP_LOCK_DURATION_MS.
// Returns the updated state so the caller can craft a user-friendly message.
export const registerFailedOtpAttempt = async (
  userId: string
): Promise<{ attempts: number; locked: boolean; lockedUntil?: Date; remaining: number }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const attempts = (user.failed_otp_attempts || 0) + 1;

  if (attempts >= MAX_OTP_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + OTP_LOCK_DURATION_MS);
    await user.update({
      failed_otp_attempts: attempts,
      otp_locked_until: lockedUntil,
      otp: '',
      otp_expiry: new Date()
    });
    logger.warn('User locked due to too many failed OTP attempts', {
      userId,
      attempts,
      lockedUntil
    });
    return { attempts, locked: true, lockedUntil, remaining: 0 };
  }

  await user.update({ failed_otp_attempts: attempts });
  return {
    attempts,
    locked: false,
    remaining: Math.max(0, MAX_OTP_ATTEMPTS - attempts)
  };
};

// Reset OTP attempt counter (call on successful verification).
export const resetFailedOtpAttempts = async (userId: string): Promise<void> => {
  const user = await User.findByPk(userId);
  if (!user) return;
  await user.update({
    failed_otp_attempts: 0,
    otp_locked_until: undefined
  });
};

// Find user by email with OTP (for verification)
export const findUserByEmailWithOTP = async (email: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({
      where: { email, is_active: true }
    });
    logger.info('user', user);
    return user ? user.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find user by email with OTP:', error);
    throw new AppError('Failed to find user', 500);
  }
};

export type GetSocietyByUserIdOptions = {
  /** When set (e.g. admin registration details), load this registration row instead of findOne({ created_by }). */
  overrideRegistrationId?: string;
};

export const getSocietyByUserId = async (
  userId: string,
  opts?: GetSocietyByUserIdOptions
): Promise<{ user: any; society: any; members: any[]; conversions: any[] }> => {
  const userToProfileJson = (u: InstanceType<typeof User>) => {
    const j = u.toJSON() as Record<string, unknown>;
    if (j.media) {
      j.signatureMedia = j.media;
      delete j.media;
    }
    return j;
  };

  try {
    // Association on User is `as: 'media'` (see models/user.ts), not signatureMedia
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Media,
          as: 'media',
          attributes: ['id', 'url', 'active'],
          required: false
        }
      ]
    });
    if (!user) {
      return { user: null, society: null, members: [], conversions: [] };
    }

    let response: any = {}

    const society: any = opts?.overrideRegistrationId
      ? await SocietyRegistration.findOne({
          where: { id: opts.overrideRegistrationId }
        })
      : await SocietyRegistration.findOne({
          where: {
            created_by: userId
          }
        });

    if (!society) {
      return { user: userToProfileJson(user), society: null, members: [], conversions: [] };
    }

    response = { ...society.get({ plain: true }) }
    // ... (rest of the enrichments)

    // Enrich society with related info
    response.status = society.status
      ? await findStatusById(society.status).catch(() => null)
      : null;

    response.registration_authority = society.registration_authoritie_id
      ? await getRegistrationAuthorityById(society.registration_authoritie_id).catch(() => null)
      : null;

    response.cooperative_society_type = society.cooperative_society_type_id
      ? await getCooperativeSocietyTypeById(society.cooperative_society_type_id).catch(() => null)
      : null;

    response.area_of_operation = society.area_of_operation_id
      ? await getAreaOfOperationLevelById(society.area_of_operation_id).catch(() => null)
      : null;

    response.water_body_type = society.water_body_type_id
      ? await getWaterBodyTypeById(society.water_body_type_id).catch(() => null)
      : null;

    response.sector_of_operation_type = society.sector_of_operation_type
      ? await getSectorOperationTypeById(society.sector_of_operation_type).catch(() => null)
      : null;

    response.sector_of_operation = society.sector_of_operation
      ? await getSectorOfOperationById(society.sector_of_operation).catch(() => null)
      : null;

    response.functional_status = society.functional_status
      ? await getFunctionalStatusById(society.functional_status).catch(() => null)
      : null;

    response.cooperative_society_bank = (society.cooperative_society_bank_id || society.other_bank)
      ? await getBankById(society.cooperative_society_bank_id || society.other_bank).catch(() => null)
      : null;

    response.location_of_head_quarter = society.location_of_head_quarter
      ? await getLocationTypeById(society.location_of_head_quarter).catch(() => null)
      : null;

    // Location-related fields with error handling
    response.state = society.state_id
      ? await getStateById(society.state_id).catch(() => null)
      : null;

    response.district = society.district_id
      ? await getDistrictById(society.district_id).catch(() => null)
      : null;

    response.block = society.block_id
      ? await getBlockById(society.block_id).catch(() => null)
      : null;

    // Village master row (society_registrations.village_code → districts_blocks_gp_villages.village_code)
    try {
      const raw = society.village_code;
      if (raw === null || raw === undefined || String(raw).trim() === '') {
        response.village = null;
      } else {
        const vc = Number(String(raw).trim());
        if (Number.isNaN(vc)) {
          response.village = null;
        } else {
          const villageRow = await DistrictsBlocksGpVillage.findOne({
            where: { village_code: vc },
            attributes: [
              'id',
              'state_code',
              'state_name',
              'district_code',
              'district_name',
              'block_code',
              'block_name',
              'gram_panchayat_code',
              'gram_panchayat_name',
              'village_code',
              'village_name'
            ]
          });
          response.village = villageRow ? villageRow.toJSON() : null;
        }
      }
    } catch (err: any) {
      logger.warn('Failed to resolve village for society details', {
        societyId: society.id,
        village_code: society.village_code,
        error: err?.message
      });
      response.village = null;
    }

    response.gram_panchayat = society.gram_panchayat_id
      ? await getDistrictsBlocksGpVillageById(society.gram_panchayat_id).catch(() => null)
      : null;

    response.urban_local_body_type = society.urban_local_body_type
      ? await getUrbanLocalBodyById(society.urban_local_body_type).catch(() => null)
      : null;

    response.urban_local_body_code = society.urban_local_body_code
      ? await getUrbanLocalBodyCodeById(society.urban_local_body_code).catch(() => null)
      : null;

    response.locality_ward_code = society.locality_ward_code
      ? await getUrbanLocalBodyCodeById(society.locality_ward_code).catch(() => null)
      : null;

    response.non_family_coop_certificate = society.non_family_coop_certificate
      ? await Media.findOne({ where: { id: society.non_family_coop_certificate } }).catch(() => null)
      : null;

    response.site_inspection_report = society.site_inspection_report
      ? await Media.findOne({ where: { id: society.site_inspection_report } }).catch(() => null)
      : null;

    response.circular_minutes_of_meeting = society.circular_minutes_of_meeting
      ? await Media.findOne({ where: { id: society.circular_minutes_of_meeting } }).catch(() => null)
      : null;

    response.land_document = society.land_document
      ? await Media.findOne({ where: { id: society.land_document } }).catch(() => null)
      : null;

    response.challan_receipt = society.challan_receipt
      ? await Media.findOne({ where: { id: society.challan_receipt } }).catch(() => null)
      : null;

    try {
      response.renewal_challan_receipt = await resolveLatestRenewalChallanReceipt(society.id);
      response.renewal_challan_receipt_at =
        response.renewal_challan_receipt?.created_at || null;
    } catch (renewalChallanErr: any) {
      logger.warn('Failed to resolve renewal challan in getSocietyByUserId', {
        societyId: society.id,
        error: renewalChallanErr?.message,
      });
      response.renewal_challan_receipt = null;
      response.renewal_challan_receipt_at = null;
    }

    response.catificateIssuedByUser = society.catificate_issued_by
      ? await User.findOne({
        where: { id: society.catificate_issued_by },
        attributes: ['id', 'first_name', 'last_name']
      }).catch(() => null)
      : null;

    // Certificate media (normalize id + log lookup failures instead of silently swallowing)
    const certificateMediaId =
      typeof society.certificate_media_id === 'string'
        ? society.certificate_media_id.trim()
        : society.certificate_media_id;


    response.certificateMedia = certificateMediaId
      ? await Media.findByPk(certificateMediaId).catch((err: any) => {
        logger.warn('Failed to fetch certificate media in getSocietyByUserId', {
          societyId: society.id,
          certificateMediaId,
          error: err?.message
        });
        return null;
      })
      : null;

    // notification media
    response.notificationMedia = society.notification_media_id ? await Media.findOne({ where: { id: society.notification_media_id } }).catch(() => null) : null;


    // Signature media data
    response.signatureMedia = user.signature_media_id ? await Media.findOne({ where: { id: user.signature_media_id } }).catch(() => null) : null;

    // Bye laws
    response.bye_laws = society.bye_laws ? await Media.findOne({ where: { id: society.bye_laws } }).catch(() => null) : null;
    response.bank_certificate = society.bank_certificate ? await Media.findOne({ where: { id: society.bank_certificate } }).catch(() => null) : null;
    response.economic_scheme = society.economic_scheme ? await Media.findOne({ where: { id: society.economic_scheme } }).catch(() => null) : null;
    response.contributor_list = society.contributor_list ? await Media.findOne({ where: { id: society.contributor_list } }).catch(() => null) : null;
    response.custom_documents = society.custom_documents ? await Media.findOne({ where: { id: society.custom_documents } }).catch(() => null) : null;
    response.circular_for_promoters_meeting = society.circular_for_promoters_meeting ? await Media.findOne({ where: { id: society.circular_for_promoters_meeting } }).catch(() => null) : null;
    response.minutes_of_meeting_of_promoters_meeting = society.minutes_of_meeting_of_promoters_meeting ? await Media.findOne({ where: { id: society.minutes_of_meeting_of_promoters_meeting } }).catch(() => null) : null;
    response.full_particulars_of_the_promoter = society.full_particulars_of_the_promoter ? await Media.findOne({ where: { id: society.full_particulars_of_the_promoter } }).catch(() => null) : null;

    // Add workflow status (current, next, previous)
    if (!society.workflow_status) {

      // 👇 if column is NULL
      response.workflowStatus = {};   // or null if you prefer
    } else {
      try {
        const { formatWorkflowStatusForApi, getWorkflowStatus } = await import(
          './WorkflowUtilService'
        );
        const workflowStatus = await getWorkflowStatus(
          society.id,
          'SOCIETY_REGISTRATION',
          false
        );

        response.workflowStatus = formatWorkflowStatusForApi(workflowStatus);
      } catch (workflowError: any) {
        logger.warn('Error fetching workflow status in getSocietyByUserId:', {
          societyId: society.society_id,
          error: workflowError?.message
        });

        response.workflowStatus = {}; // safe fallback
      }
    }

    // Prefer the latest issued renewal certificate for /me; otherwise latest renewal row.
    const renewalStatusInclude = [
      {
        model: Status,
        as: 'statusDetails',
        attributes: ['id', 'key', 'title'],
      },
    ];
    response.renewals = await SocietyRenewal.findOne({
      where: {
        society_id: society.id,
        renewal_certificate_url: { [Op.ne]: null },
      },
      include: renewalStatusInclude,
      order: [
        ['certificate_issue_date', 'DESC'],
        ['updated_at', 'DESC'],
        ['created_at', 'DESC'],
      ],
    })
      .then(async (withCert) => {
        if (withCert) return withCert;
        return SocietyRenewal.findOne({
          where: { society_id: society.id },
          include: renewalStatusInclude,
          order: [['created_at', 'DESC']],
        });
      })
      .catch((err) => {
        logger.error('Error fetching renewals in getSocietyByUserId:', err);
        return null;
      });

    // Keep certificate path in sync if media was renamed on disk after QR stamp (.png → .pdf).
    if (response.renewals?.renewal_certificate_url) {
      try {
        const currentUrl = String(response.renewals.renewal_certificate_url);
        const stem = path.basename(currentUrl).replace(/\.[^.]+$/, '');
        const mediaMatch = await Media.findOne({
          where: {
            active: true,
            [Op.or]: [
              { url: currentUrl },
              { url: { [Op.like]: `%/${stem}.pdf` } },
              { url: { [Op.like]: `%/${stem}.PDF` } },
            ],
          },
          order: [['updated_at', 'DESC']],
          attributes: ['id', 'url'],
        });
        if (mediaMatch?.url && mediaMatch.url !== currentUrl) {
          await response.renewals.update({ renewal_certificate_url: mediaMatch.url });
          response.renewals.renewal_certificate_url = mediaMatch.url;
        }
      } catch (syncErr: any) {
        logger.warn('Failed to sync renewal_certificate_url with media row in /me', {
          error: syncErr?.message,
        });
      }
    }
    // Get members (registration UUID + legacy SOC id so AGM/SGBM/BOD rows all appear)
    const societyMemberIds = [society.id, society.society_id]
      .map((value) => String(value || '').trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
    const members = await excludeApprovedDeletedShareholders(
      String(society.id),
      await Member.findAll({
        where: {
          society_id: { [Op.in]: societyMemberIds },
          is_active: true,
        },
      }).catch(() => [])
    );

    const agmNonSelectedShareholders = await getApprovedAgmNonSelectedShareholdersForSociety(
      String(society.id)
    ).catch(() => []);
    const mergedMembers = mergeMembersWithApprovedAgmNonSelectedShareholders(
      members,
      agmNonSelectedShareholders
    );

    // Get conversions
    const conversions = await SocietyConversion.findAll({
      where: { society_id: society.id, is_active: true },
      include: [
        {
          model: SectorOfOperation,
          as: 'conversionFrom',
          attributes: ['id', 'name', 'code']
        },
        {
          model: SectorOfOperation,
          as: 'conversionTo',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Status,
          as: 'statusDetails',
          attributes: ['id', 'key', 'title']
        },
        {
          model: Media,
          as: 'noticeSgbmMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'minutesMeetingMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'attendanceSheetMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'formGMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'byeLawsMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'auditReportMedia',
          attributes: ['id', 'url', 'active']
        },
        {
          model: Media,
          as: 'certificateMedia',
          attributes: ['id', 'url', 'active'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    }).catch((err) => {
      logger.error('Error fetching conversions in getSocietyByUserId:', err);
      return [];
    });

    await attachCompleteProcessingHistoryToDetail(response, society.id, 'SOCIETY_REGISTRATION');

    return {
      user: userToProfileJson(user),
      society: response,
      members: mergedMembers,
      conversions: conversions.map((c: any) => c.get({ plain: true })),
    };

  } catch (error) {
    logger.error('Failed to get society by user id:', error);
    throw new AppError('Failed to get society by user id', 500);
  }
};



export const getUsersByRoleService = async (
  district: any,
  roleNames: string[],
  is_hq: any,
  name: string,
  role: string,
  authUserId?: string,
  authIsHq?: boolean
) => {

  const privilegedRoles = ['rcs_district', 'jt_rcs_district'];
  const hqRoles = ['drcs_arcs_hq', 'jics_sics_hq', 'jt_rcs_hq', 'rcs_hq'];
  const normalizedRoleNames = roleNames.map((name) => String(name).trim()).filter(Boolean);
  const skipIsHqCheck = shouldIgnoreIsHqForRoleQuery(normalizedRoleNames);
  const skipDistrictCheck = shouldIgnoreDistrictForRoleQuery(normalizedRoleNames);

  const parsedIsHq =
    skipIsHqCheck || is_hq === undefined || is_hq === null || is_hq === ''
      ? null
      : parseInt(String(is_hq), 10);

  const whereClause: any = {
    is_active: true,
  };

  if (!skipIsHqCheck && parsedIsHq !== null) {
    if (![0, 1].includes(parsedIsHq)) {
      throw new Error('is_hq must be either 0 or 1');
    }
    whereClause.is_hq = parsedIsHq === 1;
  }

  const shouldApplyDistrictFilter = !(
    skipDistrictCheck ||
    skipIsHqCheck ||
    parsedIsHq === 1 ||
    !!authIsHq ||
    privilegedRoles.includes(role) ||
    hqRoles.includes(role)
  );

  if (shouldApplyDistrictFilter) {
    whereClause.district_id = district;
  }

  if (name) {
    whereClause[Op.or] = [
      { first_name: { [Op.like]: `%${name}%` } },
      { last_name: { [Op.like]: `%${name}%` } }
    ];
  }

  const users = await User.findAll({
    attributes: ["id", "email", "first_name", "last_name", "phone", "is_active", "is_available", "unavailable_until"],
    where: whereClause,
    include: [
      {
        model: Role,
        as: "role",
        where: {
          name: {
            [Op.in]: normalizedRoleNames
          }
        },
      },
    ],
  });

  const shouldExcludeAuthUser = normalizedRoleNames.includes(role) && !!authUserId;
  const now = Date.now();

  const visibleUsers = [];
  for (const user of users) {
    if (shouldExcludeAuthUser && user.id === authUserId) continue;

    if (
      user.is_available === false &&
      user.unavailable_until &&
      new Date(user.unavailable_until).getTime() <= now
    ) {
      const restored = await ensureUserAvailability(user);
      visibleUsers.push(restored.user.toJSON());
      continue;
    }

    visibleUsers.push(user.toJSON());
  }

  return visibleUsers;
};


export const uploadSignatureService = async (user: any, signature_media_id: string) => {

  const existingUser = await User.findByPk(user.userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  existingUser.signature_media_id = signature_media_id;
  // user.signature_media_id = file;
  await existingUser.save();

  return existingUser;
};

/**
 * Returns true if the user is effectively available right now (not on leave).
 * Auto-clears expired `unavailable_until` and flips `is_available` back to true.
 * Pass a loaded user model OR a userId to fetch.
 */
export const ensureUserAvailability = async (
  userOrId: User | string
): Promise<{ user: User; isAvailable: boolean }> => {
  let user: User | null;
  if (typeof userOrId === 'string') {
    user = await User.findByPk(userOrId);
  } else {
    user = userOrId;
  }

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Auto-expire: if user was marked unavailable with an end date and that date has passed,
  // restore availability transparently (no separate cron required).
  const now = new Date();
  if (
    user.is_available === false &&
    user.unavailable_until &&
    new Date(user.unavailable_until).getTime() <= now.getTime()
  ) {
    logger.info('Auto-restoring user availability (unavailable_until elapsed)', {
      userId: user.id,
      unavailable_until: user.unavailable_until
    });

    await user.update({
      is_available: true,
      unavailable_since: null,
      unavailable_until: null,
      unavailable_reason: null
    });

    try {
      const { restoreApplicationsToAvailableOfficer } = await import('./WorkflowUtilService');
      await restoreApplicationsToAvailableOfficer(user.id);
    } catch (restoreErr) {
      logger.error('Failed to restore applications after auto-available:', restoreErr);
    }
  }

  return {
    user,
    isAvailable: user.is_active !== false && user.is_available !== false
  };
};

/** Parse YYYY-MM-DD or ISO string to end-of-calendar-day (server local). */
const parseUnavailableUntilDate = (value: Date | string): Date | null => {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (y == null || m == null || d == null || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
      return null;
    }
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/** True when the calendar day of `until` is today or later (server local). */
const isUnavailableUntilDayValid = (until: Date): boolean => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const untilStart = new Date(until.getFullYear(), until.getMonth(), until.getDate());
  return untilStart >= todayStart;
};

/**
 * Set or clear user availability.
 * - When setting unavailable: optional `unavailable_until` (auto-restore after that day).
 * - When setting available: clears unavailable_since / until / reason.
 *
 * Permission: caller must be the same user (mark myself unavailable) OR admin/super_admin.
 * This check is enforced at controller level; service only performs the persistence.
 */
export const setUserAvailability = async (
  userId: string,
  options: {
    isAvailable: boolean;
    reason?: string;
    unavailableUntil?: Date | string | null;
    actorUserId?: string;
  }
): Promise<Omit<IUser, 'password' | 'reset_token'>> => {
  const { isAvailable, reason, unavailableUntil, actorUserId } = options;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let parsedUntil: Date | null = null;
  if (!isAvailable && unavailableUntil != null && unavailableUntil !== '') {
    parsedUntil = parseUnavailableUntilDate(unavailableUntil);
    if (!parsedUntil) {
      throw new AppError('unavailableUntil is not a valid date', 400);
    }
    if (!isUnavailableUntilDayValid(parsedUntil)) {
      throw new AppError('unavailableUntil cannot be in the past', 400);
    }
  }

  const updatePayload: Partial<IUserUpdate> & {
    is_available?: boolean;
    unavailable_since?: Date | null;
    unavailable_until?: Date | null;
    unavailable_reason?: string | null;
  } = isAvailable
      ? {
        is_available: true,
        unavailable_since: null,
        unavailable_until: null,
        unavailable_reason: null
      }
      : {
        is_available: false,
        unavailable_since: new Date(),
        unavailable_until: parsedUntil,
        unavailable_reason: reason && reason.trim() ? reason.trim() : null
      };

  await user.update(updatePayload as any);

  if (!isAvailable) {
    try {
      const { returnAssignedApplicationsToAssigner } = await import('./WorkflowUtilService');
      await returnAssignedApplicationsToAssigner(userId);
    } catch (returnErr) {
      logger.error('Failed to return assigned applications to assigner:', returnErr);
    }
  } else {
    try {
      const { restoreApplicationsToAvailableOfficer } = await import('./WorkflowUtilService');
      await restoreApplicationsToAvailableOfficer(userId);
    } catch (restoreErr) {
      logger.error('Failed to restore assigned applications after available:', restoreErr);
    }
  }

  try {
    await createActivity({
      title: isAvailable ? 'User Marked Available' : 'User Marked Unavailable',
      description: isAvailable
        ? `User "${user.email}" marked available again`
        : `User "${user.email}" marked unavailable${parsedUntil ? ` until ${parsedUntil.toISOString().slice(0, 10)}` : ''}`,
      data: {
        user_id: user.id,
        user_email: user.email,
        is_available: isAvailable,
        unavailable_until: parsedUntil,
        reason: reason ?? null,
        actor_user_id: actorUserId ?? null
      },
      reference_id: user.id,
      created_by: actorUserId || 'system'
    });
  } catch (activityError) {
    logger.error('Failed to log user availability change activity:', activityError);
  }

  const refreshed = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }]
  });
  return sanitizeUserData(refreshed!.toJSON());
};

/** Minimal availability for workflow assigner UI (no full user-view permission required). */
export const getUserAvailabilitySummary = async (userId: string) => {
  const { user, isAvailable } = await ensureUserAvailability(userId);
  const withRole = await User.findByPk(user.id, {
    attributes: ['id', 'first_name', 'last_name', 'email', 'role_id'],
    include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }]
  });
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    is_available: isAvailable,
    unavailable_until: user.unavailable_until ?? null,
    role_id: withRole?.role_id ?? user.role_id,
    role: withRole?.role
      ? {
          id: withRole.role.id,
          name: withRole.role.name,
          description: withRole.role.description
        }
      : null
  };
};

/**
 * List users who can take a workflow assignment.
 * Filters by role + (optional) district + is_active=true + is_available=true.
 * Used by the frontend reassign dropdown.
 */
export const getAvailableUsersByRoleAndDistrict = async (params: {
  roleId?: string;
  roleName?: string;
  districtId?: string;
  stateId?: string;
  excludeUserIds?: string[];
}): Promise<Array<Pick<IUser, 'id' | 'email' | 'first_name' | 'last_name' | 'phone' | 'district_id' | 'state_id' | 'is_available' | 'is_active'> & { role?: any }>> => {
  const { roleId, roleName, districtId, stateId, excludeUserIds } = params;

  const whereClause: any = {
    is_active: true,
    is_available: true
  };

  if (districtId) whereClause.district_id = districtId;
  if (stateId) whereClause.state_id = stateId;
  if (roleId) whereClause.role_id = roleId;
  if (excludeUserIds && excludeUserIds.length > 0) {
    whereClause.id = { [Op.notIn]: excludeUserIds };
  }

  const include: any[] = [
    {
      model: Role,
      as: 'role',
      attributes: ['id', 'name', 'description'],
      where: roleName ? { name: roleName, is_active: true } : { is_active: true },
      required: true
    }
  ];

  const users = await User.findAll({
    where: whereClause,
    include,
    order: [['first_name', 'ASC']],
    attributes: [
      'id',
      'email',
      'first_name',
      'last_name',
      'phone',
      'district_id',
      'state_id',
      'is_available',
      'is_active',
      'role_id'
    ]
  });

  return users.map((u) => u.toJSON() as any);
};

const BULK_APPLICANT_MAX_ROWS = 500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

type BulkApplicantRow = {
  email?: string;
  password?: string;
  confirm_password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  ncd_id?: string;
};

export type BulkApplicantRowResult = {
  row: number;
  email?: string;
  ncd_id?: string;
  status: 'created' | 'linked' | 'failed';
  reason?: string;
  userId?: string;
  societyId?: string;
};

export type BulkApplicantUploadResult = {
  total: number;
  success: number;
  failed: number;
  results: BulkApplicantRowResult[];
};

const normalizeHeaderKey = (key: string): string =>
  String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const HEADER_ALIASES: Record<string, keyof BulkApplicantRow> = {
  email: 'email',
  password: 'password',
  confirm_password: 'confirm_password',
  confirmpassword: 'confirm_password',
  first_name: 'first_name',
  firstname: 'first_name',
  last_name: 'last_name',
  lastname: 'last_name',
  phone: 'phone',
  mobile: 'phone',
  phone_number: 'phone',
  mobile_number: 'phone',
  ncd_id: 'ncd_id',
  ncdid: 'ncd_id',
  cooperative_id: 'ncd_id'
};

const normalizeBulkApplicantRow = (raw: Record<string, unknown>): BulkApplicantRow => {
  const normalized: BulkApplicantRow = {};

  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = HEADER_ALIASES[normalizeHeaderKey(key)];
    if (!mappedKey) continue;

    const stringValue = value === null || value === undefined ? '' : String(value).trim();
    if (!stringValue) continue;
    normalized[mappedKey] = stringValue;
  }

  return normalized;
};

const validateBulkApplicantRow = (
  row: BulkApplicantRow,
  options: { requirePassword: boolean } = { requirePassword: true }
): string | null => {
  if (!row.email) return 'Email is required';
  if (!EMAIL_REGEX.test(row.email)) return 'Invalid email';
  if (options.requirePassword) {
    if (!row.password) return 'Password is required';
    if (row.password.length < 6) return 'Password must be at least 6 characters';
  } else if (row.password && row.password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (row.confirm_password && row.password && row.password !== row.confirm_password) {
    return 'Password and confirm password do not match';
  }
  if (!row.first_name) return 'First name is required';
  if (row.first_name.length < 3) return 'First name must be at least 3 characters';
  if (!row.last_name) return 'Last name is required';
  if (row.last_name.length < 3) return 'Last name must be at least 3 characters';
  if (row.phone && !PHONE_REGEX.test(row.phone)) return 'Invalid phone number format';
  return null;
};

/**
 * When ncd_id is present: find society by that ncd_id and sync applicant <-> society
 * (create applicant if needed, then set society.created_by).
 */
const syncApplicantWithSocietyByNcdId = async (input: {
  row: BulkApplicantRow;
  ncdId: string;
  applicantRoleId: string;
  createdByUserId?: string;
}): Promise<{ userId: string; societyId: string; status: 'created' | 'linked' }> => {
  const society = await SocietyRegistration.findOne({ where: { ncd_id: input.ncdId } });
  if (!society) {
    throw new Error(`Society with ncd_id "${input.ncdId}" not found`);
  }

  const existingUser = await findUserByEmail(input.row.email!);

  if (existingUser) {
    if (existingUser.role_id !== input.applicantRoleId) {
      throw new Error('Email belongs to a non-applicant user');
    }

    const ownedSociety = await SocietyRegistration.findOne({
      where: { created_by: existingUser.id },
      attributes: ['id', 'ncd_id']
    });
    if (ownedSociety && ownedSociety.ncd_id !== input.ncdId) {
      throw new Error('Applicant already owns another society');
    }

    if (society.created_by && society.created_by !== existingUser.id) {
      throw new Error(`Society with ncd_id "${input.ncdId}" is already linked to another applicant`);
    }

    if (!society.created_by) {
      await society.update({ created_by: existingUser.id });
    }

    const geoUpdates: Record<string, string> = {};
    if (!existingUser.state_id && society.state_id) geoUpdates.state_id = society.state_id;
    if (!existingUser.district_id && society.district_id) geoUpdates.district_id = society.district_id;
    if (Object.keys(geoUpdates).length) {
      await User.update(geoUpdates, { where: { id: existingUser.id } });
    }

    return { userId: existingUser.id, societyId: society.id, status: 'linked' };
  }

  if (society.created_by) {
    throw new Error(`Society with ncd_id "${input.ncdId}" is already linked to an applicant`);
  }

  if (input.row.phone) {
    const existingPhone = await findUserByPhoneNumber(input.row.phone);
    if (existingPhone) {
      throw new Error('User with this phone number already exists');
    }
  }

  const created = await createUser(
    {
      email: input.row.email!,
      password: input.row.password!,
      first_name: input.row.first_name!,
      last_name: input.row.last_name!,
      phone: input.row.phone,
      role_id: input.applicantRoleId,
      is_email_verified: true,
      ...(society.state_id ? { state_id: society.state_id } : {}),
      ...(society.district_id ? { district_id: society.district_id } : {})
    },
    input.createdByUserId
  );

  await society.update({ created_by: created.id });

  return { userId: created.id, societyId: society.id, status: 'created' };
};

/**
 * Parse an Excel/CSV (.xlsx/.xls/.csv) buffer and create applicant users row-by-row.
 * If ncd_id is present, finds the society with that ncd_id and syncs applicant <-> society.
 * Partial success is supported — invalid/duplicate rows are reported without aborting the batch.
 */
export const bulkCreateApplicantsFromExcel = async (
  fileBuffer: Buffer,
  createdByUserId?: string,
  extension: string = 'xlsx'
): Promise<BulkApplicantUploadResult> => {
  const workbook =
    extension === 'csv'
      ? XLSX.read(fileBuffer.toString('utf8'), { type: 'string', raw: false })
      : XLSX.read(fileBuffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new AppError('Uploaded file has no sheets', 400);
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new AppError('Uploaded sheet not found', 400);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (!rawRows.length) {
    throw new AppError('Uploaded file has no data rows', 400);
  }

  if (rawRows.length > BULK_APPLICANT_MAX_ROWS) {
    throw new AppError(`Excel file exceeds maximum of ${BULK_APPLICANT_MAX_ROWS} rows`, 400);
  }

  const applicantRole = await findRoleByIdOrName('applicant');
  if (!applicantRole) {
    throw new AppError('Applicant role not found', 404);
  }

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNcdIds = new Set<string>();
  const results: BulkApplicantRowResult[] = [];
  let success = 0;
  let failed = 0;

  for (let index = 0; index < rawRows.length; index++) {
    const excelRowNumber = index + 2; // header is row 1
    const rawRow = rawRows[index] || {};
    const row = normalizeBulkApplicantRow(rawRow);
    const email = row.email?.toLowerCase();
    const ncdId = row.ncd_id?.trim();

    try {
      if (email && seenEmails.has(email)) {
        throw new Error('Duplicate email in Excel file');
      }

      if (row.phone && seenPhones.has(row.phone)) {
        throw new Error('Duplicate phone number in Excel file');
      }

      if (ncdId && seenNcdIds.has(ncdId)) {
        throw new Error('Duplicate ncd_id in Excel file');
      }

      if (ncdId) {
        const existingUser = await findUserByEmail(row.email || '');
        const validationError = validateBulkApplicantRow(row, {
          requirePassword: !existingUser
        });
        if (validationError) {
          throw new Error(validationError);
        }

        const synced = await syncApplicantWithSocietyByNcdId({
          row,
          ncdId,
          applicantRoleId: applicantRole.id,
          createdByUserId
        });

        if (email) seenEmails.add(email);
        if (row.phone) seenPhones.add(row.phone);
        seenNcdIds.add(ncdId);

        success += 1;
        results.push({
          row: excelRowNumber,
          email: row.email,
          ncd_id: ncdId,
          status: synced.status,
          userId: synced.userId,
          societyId: synced.societyId
        });
        continue;
      }

      const validationError = validateBulkApplicantRow(row);
      if (validationError) {
        throw new Error(validationError);
      }

      const existingUser = await findUserByEmail(row.email!);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      if (row.phone) {
        const existingPhone = await findUserByPhoneNumber(row.phone);
        if (existingPhone) {
          throw new Error('User with this phone number already exists');
        }
      }

      const created = await createUser(
        {
          email: row.email!,
          password: row.password!,
          first_name: row.first_name!,
          last_name: row.last_name!,
          phone: row.phone,
          role_id: applicantRole.id,
          is_email_verified: true
        },
        createdByUserId
      );

      if (email) seenEmails.add(email);
      if (row.phone) seenPhones.add(row.phone);

      success += 1;
      results.push({
        row: excelRowNumber,
        email: row.email,
        status: 'created',
        userId: created.id
      });
    } catch (error: any) {
      failed += 1;
      results.push({
        row: excelRowNumber,
        email: row.email,
        ncd_id: ncdId,
        status: 'failed',
        reason: error?.message || 'Failed to create user'
      });
    }
  }

  return {
    total: rawRows.length,
    success,
    failed,
    results
  };
};
