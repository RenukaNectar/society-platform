import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import Member from '../models/Member';
import BodMember from '../models/BodMember';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';
import MemberOtpVerification from '../models/MemberOtpVerification';
import { getPromotersWithApprovedBodMembersBySocietyIdService } from './BodMemberService';

const bodMembersDesignations = ['Secretary', 'Chief Promoter', 'Treasurer'];

const isEligibleBodMemberForSociety = async (
  memberId: string,
  societyId: string
): Promise<boolean> => {
  const bodRow = await BodMember.findOne({
    where: { id: memberId, society_id: societyId, is_active: true },
  });
  if (bodRow) {
    return true;
  }

  const electedMembers = await getPromotersWithApprovedBodMembersBySocietyIdService(societyId);
  const matched = electedMembers.some(
    (m) =>
      String(m?.id || '') === memberId ||
      String(m?.bod_member?.id || '') === memberId
  );
  if (matched) {
    return true;
  }

  const legacyMember = await Member.findOne({
    where: {
      id: memberId,
      society_id: societyId,
      is_active: true,
      designation: { [Op.in]: bodMembersDesignations },
    },
  });
  return !!legacyMember;
};

const assertEligibleBodMemberForSociety = async (
  memberId: string,
  societyId: string
): Promise<void> => {
  if (!(await isEligibleBodMemberForSociety(memberId, societyId))) {
    throw new AppError('No BOD member found', 404);
  }
};

export const getAllMembers = async (page: number = 1, limit: number = 10, search?: string, societyId?: string) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { gender: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { shareholder_category: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } }
      ];
    }

    if (societyId) {
      whereClause.society_id = societyId;
    }

    const { count, rows } = await Member.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      members: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getAllMembers:', error);
    throw new AppError('Failed to fetch members', 500);
  }
};

export const getMemberById = async (id: number) => {
  try {
    const member = await Member.findByPk(id);

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    return member;
  } catch (error) {
    logger.error('Error in getMemberById:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch member', 500);
  }
};

export const getMembersBySocietyId = async (societyId: string) => {
  try {
    const members = await Member.findAll({
      where: { society_id: societyId },
      order: [['created_at', 'DESC']]
    });

    return members;
  } catch (error) {
    logger.error('Error in getMembersBySocietyId:', error);
    throw new AppError('Failed to fetch members for society', 500);
  }
};

export const createMember = async (data: {
  name?: string;
  gender?: string;
  category?: string;
  shareholder_category?: string | null;
  mobile?: string;
  society_id: string;
  designation?: string;
  is_co_opted?: boolean;
}, req?: IAuthRequest) => {
  try {
    const createData = {
      ...data,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    };

    const member = await Member.create(createData);
    return member;
  } catch (error) {
    logger.error('Error in createMember:', error);
    throw new AppError('Failed to create member', 500);
  }
};

export const createMultipleMembers = async (membersData: Array<{
  name?: string;
  gender?: string;
  category?: string;
  shareholder_category?: string | null;
  mobile?: string;
  society_id: string;
  designation?: string;
  is_co_opted?: boolean;
}>, req?: IAuthRequest) => {
  try {
    const createData = membersData.map(member => ({
      ...member,
      created_by: req?.user?.userId || null,
      updated_by: req?.user?.userId || null
    }));

    const members = await Member.bulkCreate(createData);
    return members;
  } catch (error) {
    logger.error('Error in createMultipleMembers:', error);
    throw new AppError('Failed to create members', 500);
  }
};

export const updateMember = async (id: number, data: {
  name?: string;
  gender?: string;
  category?: string;
  shareholder_category?: string | null;
  mobile?: string;
  designation?: string;
  is_co_opted?: boolean;
  }, req?: IAuthRequest) => {
  try {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const updateData = {
      ...data,
      updated_by: req?.user?.userId || null
    };

    await member.update(updateData);
    return member;
  } catch (error) {
    logger.error('Error in updateMember:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update member', 500);
  }
};

export const deleteMember = async (id: number) => {
  try {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    await member.destroy();
    return { message: 'Member deleted successfully' };
  } catch (error) {
    logger.error('Error in deleteMember:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete member', 500);
  }
};

export const deleteMembersBySocietyId = async (societyId: string) => {
  try {
    const deletedCount = await Member.destroy({
      where: { society_id: societyId }
    });

    return {
      message: `${deletedCount} members deleted successfully`,
      deletedCount
    };
  } catch (error) {
    logger.error('Error in deleteMembersBySocietyId:', error);
    throw new AppError('Failed to delete members for society', 500);
  }
}; 

export const getBodMembersService = async (societyId: string, moduleName: string = '') => {
  try {
    if (!moduleName) {
      throw new AppError('Module name is required', 400);
    }

    const members = await getPromotersWithApprovedBodMembersBySocietyIdService(societyId);

    const isOtpVerified = await MemberOtpVerification.findOne({
      where: { society_id: societyId, is_verified: true, active: true, module_name: moduleName },
    });

    return {
      members: members || [],
      is_verified: isOtpVerified ? 1 : 0,
      pagination: {
        total: members.length,
        page: 1,
        limit: members.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    logger.error('Error in getBodMembersService:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get BOD members', 500);
  }
};

export const sendBodOtpService = async (memberId: string, societyId: string, moduleName: string = '', userId: string = '') => {
  try {
    if(!userId){
      throw new AppError('User ID is required', 400);
    }
    if(!moduleName){
      throw new AppError('Module name is required', 400);
    }
    await assertEligibleBodMemberForSociety(memberId, societyId);

    const ifExists = await MemberOtpVerification.findOne({
      where: { society_id: societyId, module_name: moduleName, active: true }
    });
    
    // const otp = generateOTP();
    const otp = '1234';
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const hashedOTP = await bcrypt.hash(otp, 12);

    if(ifExists){
      await ifExists.update({
        otp: hashedOTP,
        otp_expiry: otpExpiry,
        is_verified: false,
        active: true,
        updated_by: userId
      });
      return null;
    }

    await MemberOtpVerification.create({
      member_id: memberId,
      society_id: societyId,
      otp: hashedOTP,
      otp_expiry: otpExpiry,
      is_verified: false,
      active: true,
      module_name: moduleName,
      created_by: userId,
      updated_by: userId
    });

    return null;
  } catch (error) {
    logger.error('Error in sendBodOtpService:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to send BOD OTP', 500);
  }
};

export const verifyBodOtpService = async (membersId: string, societyId: string, otp: string, moduleName: string = '', userId: string = '') => {
  if(!userId){
    throw new AppError('User ID is required', 400);
  }
  if(!moduleName){
    throw new AppError('Module name is required', 400);
  }
  try {
    const memberOtpVerification = await MemberOtpVerification.findOne({
      where: { member_id: membersId, society_id: societyId, active: true , otp_expiry: { [Op.gt]: new Date() }, is_verified: false, module_name: moduleName }
    });
    
    if(memberOtpVerification?.otp_expiry && memberOtpVerification.otp_expiry < new Date()){
      throw new AppError('OTP expired', 400);
    }
    if (!memberOtpVerification) {
      throw new AppError('Invalid OTP', 400);
    }

    const isOtpValid = await bcrypt.compare(otp, memberOtpVerification.otp);
    if (!isOtpValid) {
      throw new AppError('Invalid OTP', 400);
    }

    await MemberOtpVerification.update({
      is_verified: true,
      otp_expiry: new Date(),
      otp: '',
      updated_by: userId
    }, {
      where: { id: memberOtpVerification.id }
    });

    return null;
  } catch (error) {
    logger.error('Error in verifyBodOtpService:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to verify BOD OTP', 500);
  }
};