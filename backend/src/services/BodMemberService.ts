import { Op } from 'sequelize';
import BodMember from '../models/BodMember';
import Member from '../models/Member';
import SocietyRegistration from '../models/SocietyRegistration';
import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import SpecialGeneralBoardMeeting from '../models/SpecialGeneralBoardMeeting';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { findStatusByKey } from './StatusService';
import { resolveShareholderCategory } from './meetingBodMemberService';

const AGM_MEETING_TYPE = 'AGM';
const BOD_MEETING_TYPE = 'BOD';

const MOBILE_REGEX = /^\d{10}$/;

const normalizeMobile = (mobile?: string | null): string | null => {
  if (typeof mobile !== 'string') {
    return null;
  }

  const trimmedMobile = mobile.trim();
  return trimmedMobile.length > 0 ? trimmedMobile : null;
};

const getSocietyMemberIds = (society: { id: string; society_id?: string | null }): string[] =>
  [society.id, society.society_id]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .filter((value, index, array) => array.indexOf(value) === index);

/** Match AGM getById: only elected_bod_members marked approved when that flag is present. */
const isApprovedElectedBodMember = (elected: any): boolean => {
  if (elected?.is_approved === false) return false;
  if (typeof elected?.status === 'string' && elected.status.trim().toLowerCase() !== 'approved') {
    return false;
  }
  return true;
};

const isSelectedForBod = (elected: any): boolean => elected?.is_selected_for_bod === true;

const isNonBodShareholder = (elected: any): boolean => {
  const category = String(
    resolveShareholderCategory(elected) || elected?.shareholder_category || ''
  ).toLowerCase();
  return category.includes('class a') || category.includes('class b');
};

const isCoOptedBodMember = (elected: any): boolean => {
  if (elected?.is_co_opted === true) return true;
  const category = String(
    resolveShareholderCategory(elected) || elected?.shareholder_category || ''
  ).toLowerCase();
  return category.includes('co-opted bod');
};

/** BOD board composition: selected for BOD, excluding Class A/B shareholders. */
const filterApprovedElectedBodMembers = (electedMembers: any[]): any[] =>
  Array.isArray(electedMembers)
    ? electedMembers.filter((elected) => {
        if (!isApprovedElectedBodMember(elected) || isNonBodShareholder(elected)) {
          return false;
        }
        if (isSelectedForBod(elected)) return true;
        // Co-opted BOD is board composition unless explicitly unchecked.
        return isCoOptedBodMember(elected) && elected?.is_selected_for_bod !== false;
      })
    : [];

const getMemberMergeKey = (member: {
  id?: string | null;
  mobile?: string | null;
  name?: string | null;
  designation?: string | null;
}): string => normalizeMobile(member.mobile) || String(member.id || '').trim() || `${member.name || ''}-${member.designation || ''}`;

const mergeBoardMembers = (primary: any[], additional: any[]): any[] => {
  const merged = new Map<string, any>();
  for (const member of primary) {
    merged.set(getMemberMergeKey(member), member);
  }
  for (const member of additional) {
    const key = getMemberMergeKey(member);
    if (!merged.has(key)) {
      merged.set(key, member);
    }
  }
  return Array.from(merged.values());
};

const normalizeOptionalText = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createBodMemberService = async (payload: {
  society_id: string;
  agm_id: string;
  name: string;
  designation?: string | null;
  gender?: string | null;
  category?: string | null;
  shareholder_category?: string | null;
  mobile?: string | null;
  is_co_opted?: boolean;
  created_by?: string | null;
}): Promise<any> => {
  try {
    const normalizedMobile = normalizeMobile(payload.mobile);
    if (!normalizedMobile) {
      throw new AppError('Mobile number is required', 400);
    }

    if (!MOBILE_REGEX.test(normalizedMobile)) {
      throw new AppError('Mobile number must be exactly 10 digits', 400);
    }

    const existingMobile = await BodMember.findOne({
      where: {
        mobile: normalizedMobile,
        is_active: true
      }
    });

    if (existingMobile) {
      throw new AppError('Mobile number already exists for another BOD member', 400);
    }

    const created = await BodMember.create({
      society_id: payload.society_id,
      agm_id: payload.agm_id,
      name: payload.name,
      designation: normalizeOptionalText(payload.designation),
      gender: normalizeOptionalText(payload.gender),
      category: normalizeOptionalText(payload.category),
      shareholder_category: normalizeOptionalText(payload.shareholder_category),
      mobile: normalizedMobile,
      is_co_opted: !!payload.is_co_opted,
      is_active: true,
      created_by: payload.created_by || null,
      updated_by: payload.created_by || null
    });
    return created.toJSON();
  } catch (error) {
    logger.error('Failed to create BOD member', error);
    throw new AppError('Failed to create BOD member', 500);
  }
};

export const getBodMembersBySocietyIdService = async (societyId: string): Promise<any[]> => {
  try {
    const rows = await BodMember.findAll({
      where: {
        society_id: societyId,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });
    return rows.map((r) => r.toJSON());
  } catch (error) {
    logger.error('Failed to get BOD members by society id', error);
    throw new AppError('Failed to get BOD members', 500);
  }
};

export const getPromotersWithApprovedBodMembersBySocietyIdService = async (societyId: string): Promise<any[]> => {
  try {
    const society = await SocietyRegistration.findByPk(societyId, {
      attributes: ['id', 'society_id', 'cooperative_society_name', 'local_langauge_society_name']
    });
    if (!society) {
      throw new AppError('Society not found', 404);
    }

    const promoterSocietyIds = getSocietyMemberIds(society as any);
    const approvedStatus = await findStatusByKey('approved');

    let agmBasedMembers: any[] = [];
    let bodMeetingBasedMembers: any[] = [];
    let sgbmBasedMembers: any[] = [];
    let latestApprovedAgmDate: Date | null = null;
    let latestApprovedBodMeetingDate: Date | null = null;
    let latestApprovedSgbmDate: Date | null = null;

    if (approvedStatus) {
      const latestApprovedAgm = await GeneralBodyMeeting.findOne({
        where: {
          society_id: societyId,
          meeting_type: AGM_MEETING_TYPE,
          status: approvedStatus.id
        },
        order: [['meeting_date', 'DESC']],
        attributes: ['id', 'elected_bod_members', 'meeting_date']
      });
      latestApprovedAgmDate = latestApprovedAgm?.get('meeting_date')
        ? new Date(latestApprovedAgm.get('meeting_date') as Date)
        : null;

      const electedMembers: any[] = latestApprovedAgm
        ? filterApprovedElectedBodMembers(
            (latestApprovedAgm.get('elected_bod_members') as any[]) || [],
          )
        : [];

      if (Array.isArray(electedMembers) && electedMembers.length > 0) {
        const memberIds = electedMembers
          .map((m) => m?.member_id)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0 && !id.startsWith('tmp-'));
        const mobiles = electedMembers
          .map((m) => normalizeMobile(m?.mobile))
          .filter((m): m is string => !!m);

        const lookupConditions: any[] = [];
        if (memberIds.length > 0) lookupConditions.push({ id: { [Op.in]: memberIds } });
        if (mobiles.length > 0) lookupConditions.push({ mobile: { [Op.in]: mobiles } });

        const dbMembers =
          lookupConditions.length > 0
            ? await Member.findAll({
                where: {
                  society_id: { [Op.in]: promoterSocietyIds },
                  is_active: true,
                  [Op.or]: lookupConditions
                },
                attributes: ['id', 'name', 'designation', 'gender', 'category', 'shareholder_category', 'mobile', 'is_co_opted', 'created_at']
              })
            : [];

        const memberById = new Map(dbMembers.map((m) => [m.id, m.toJSON()]));
        const memberByMobile = new Map(
          dbMembers
            .map((m) => {
              const json = m.toJSON();
              const mobile = normalizeMobile(json.mobile);
              return mobile ? ([mobile, json] as const) : null;
            })
            .filter((entry): entry is [string, any] => !!entry)
        );

        const agmId = latestApprovedAgm?.id;
        const bodMembers = agmId
          ? await BodMember.findAll({
              where: { society_id: societyId, agm_id: agmId, is_active: true },
              attributes: ['id', 'society_id', 'agm_id', 'name', 'designation', 'gender', 'category', 'shareholder_category', 'mobile', 'is_co_opted', 'created_at']
            })
          : [];

        const bodByMobile = new Map<string, any>();
        for (const bm of bodMembers) {
          const json = bm.toJSON();
          const mobile = normalizeMobile(json.mobile);
          if (mobile) bodByMobile.set(mobile, json);
        }

        agmBasedMembers = electedMembers.map((elected) => {
          const memberId = typeof elected?.member_id === 'string' ? elected.member_id.trim() : '';
          const mobile = normalizeMobile(elected?.mobile);
          const fromDb =
            (memberId && memberById.get(memberId)) || (mobile && memberByMobile.get(mobile)) || null;
          const bod = mobile ? bodByMobile.get(mobile) : null;

          const base = fromDb || {
            id: memberId || null,
            name: elected?.name || '',
            designation: elected?.designation || '',
            gender: elected?.gender || null,
            category: elected?.category || null,
            shareholder_category: resolveShareholderCategory(elected),
            mobile: elected?.mobile || null,
            is_co_opted: !!elected?.is_co_opted,
            created_at: null
          };

          return {
            ...base,
            source: fromDb ? 'promoter' : 'agm_elected',
            is_bod_member: true,
            is_selected_for_bod: true,
            bod_member: bod || null
          };
        });
      }

      // Include only members selected in the latest RCS-approved BOD meeting.
      const latestApprovedBodMeeting = await GeneralBodyMeeting.findOne({
        where: {
          society_id: societyId,
          meeting_type: BOD_MEETING_TYPE,
          status: approvedStatus.id
        },
        order: [['meeting_date', 'DESC'], ['createdAt', 'DESC']],
        attributes: ['id', 'elected_bod_members', 'meeting_date']
      });
      latestApprovedBodMeetingDate = latestApprovedBodMeeting?.get('meeting_date')
        ? new Date(latestApprovedBodMeeting.get('meeting_date') as Date)
        : null;

      const selectedBodMembers = latestApprovedBodMeeting
        ? filterApprovedElectedBodMembers(
            (latestApprovedBodMeeting.get('elected_bod_members') as any[]) || []
          )
        : [];

      if (selectedBodMembers.length > 0) {
        const meetingId = latestApprovedBodMeeting!.id;
        const persistedMembers = await BodMember.findAll({
          where: { society_id: societyId, agm_id: meetingId, is_active: true },
          attributes: ['id', 'society_id', 'agm_id', 'name', 'designation', 'gender', 'category', 'shareholder_category', 'mobile', 'is_co_opted', 'created_at']
        });
        const persistedByMobile = new Map<string, any>();
        for (const member of persistedMembers) {
          const json = member.toJSON();
          const mobile = normalizeMobile(json.mobile);
          if (mobile) persistedByMobile.set(mobile, json);
        }

        bodMeetingBasedMembers = selectedBodMembers.map((selected) => {
          const mobile = normalizeMobile(selected?.mobile);
          return {
            id: selected?.member_id || null,
            name: selected?.name || '',
            designation: selected?.designation || '',
            gender: selected?.gender || null,
            category: selected?.category || null,
            shareholder_category:
              selected?.shareholder_category || resolveShareholderCategory(selected),
            mobile: selected?.mobile || null,
            is_co_opted: !!selected?.is_co_opted,
            created_at: null,
            source: 'bod_meeting',
            is_bod_member: true,
            is_selected_for_bod: true,
            bod_member: mobile ? persistedByMobile.get(mobile) || null : null
          };
        });
      }

      // Include only members selected in the latest RCS-approved SGBM.
      const latestApprovedSgbm = await SpecialGeneralBoardMeeting.findOne({
        where: {
          society_id: societyId,
          status: approvedStatus.id
        },
        order: [['meeting_date', 'DESC'], ['createdAt', 'DESC']],
        attributes: ['id', 'elected_bod_members', 'meeting_date']
      });
      latestApprovedSgbmDate = latestApprovedSgbm?.get('meeting_date')
        ? new Date(latestApprovedSgbm.get('meeting_date') as Date)
        : null;

      const selectedSgbmMembers = latestApprovedSgbm
        ? filterApprovedElectedBodMembers(
            (latestApprovedSgbm.get('elected_bod_members') as any[]) || []
          )
        : [];

      if (selectedSgbmMembers.length > 0) {
        const meetingId = String(latestApprovedSgbm!.id);
        const persistedMembers = await BodMember.findAll({
          where: { society_id: societyId, agm_id: meetingId, is_active: true },
          attributes: ['id', 'society_id', 'agm_id', 'name', 'designation', 'gender', 'category', 'shareholder_category', 'mobile', 'is_co_opted', 'created_at']
        });
        const persistedByMobile = new Map<string, any>();
        for (const member of persistedMembers) {
          const json = member.toJSON();
          const mobile = normalizeMobile(json.mobile);
          if (mobile) persistedByMobile.set(mobile, json);
        }

        sgbmBasedMembers = selectedSgbmMembers.map((selected) => {
          const mobile = normalizeMobile(selected?.mobile);
          return {
            id: selected?.member_id || null,
            name: selected?.name || '',
            designation: selected?.designation || '',
            gender: selected?.gender || null,
            category: selected?.category || null,
            shareholder_category:
              selected?.shareholder_category || resolveShareholderCategory(selected),
            mobile: selected?.mobile || null,
            is_co_opted: !!selected?.is_co_opted,
            created_at: null,
            source: 'sgbm',
            is_bod_member: true,
            is_selected_for_bod: true,
            bod_member: mobile ? persistedByMobile.get(mobile) || null : null
          };
        });
      }
    }

    // Prefer the most recent RCS-approved meeting composition for duplicate members.
    const rankedSources = [
      { date: latestApprovedSgbmDate, members: sgbmBasedMembers },
      { date: latestApprovedBodMeetingDate, members: bodMeetingBasedMembers },
      { date: latestApprovedAgmDate, members: agmBasedMembers },
    ]
      .filter((source) => source.members.length > 0)
      .sort((a, b) => {
        const aTime = a.date ? a.date.getTime() : 0;
        const bTime = b.date ? b.date.getTime() : 0;
        return bTime - aTime;
      });

    return rankedSources.reduce(
      (merged, source) => mergeBoardMembers(merged, source.members),
      [] as any[],
    );

    /*
    let meetingAddedMembers: any[] = [];
    try {
      const bodFlaggedMembers = await Member.findAll({
        where: {
          society_id: { [Op.in]: promoterSocietyIds },
          is_active: true,
          is_bod: true
        },
        attributes: ['id', 'name', 'designation', 'gender', 'category', 'mobile', 'is_co_opted', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      meetingAddedMembers = bodFlaggedMembers.map((member) => {
        const json = member.toJSON();
        return {
          ...json,
          source: 'bod_meeting',
          is_bod_member: true,
          bod_member: null
        };
      });
    } catch (bodFlagError) {
      logger.warn('Skipping BOD-flagged members query', bodFlagError);
    }

    let bodMeetingMembers: any[] = [];
    try {
      const latestBodMeeting = await GeneralBodyMeeting.findOne({
        where: {
          society_id: societyId,
          meeting_type: BOD_MEETING_TYPE
        },
        order: [['meeting_date', 'DESC'], ['created_at', 'DESC']],
        attributes: ['id', 'elected_bod_members']
      });

      const bodMeetingElected: any[] = latestBodMeeting
        ? ((latestBodMeeting.get('elected_bod_members') as any[]) || [])
        : [];

      bodMeetingMembers = Array.isArray(bodMeetingElected)
        ? bodMeetingElected.map((elected) => ({
            id: elected?.member_id || null,
            name: elected?.name || '',
            designation: elected?.designation || '',
            gender: elected?.gender || null,
            category: elected?.category || null,
            mobile: elected?.mobile || null,
            is_co_opted: !!elected?.is_co_opted,
            created_at: null,
            source: 'bod_meeting',
            is_bod_member: true,
            bod_member: null
          }))
        : [];
    } catch (bodMeetingError) {
      logger.warn('Skipping latest BOD meeting elected members query', bodMeetingError);
    }

    return mergeBoardMembers(agmBasedMembers, mergeBoardMembers(meetingAddedMembers, bodMeetingMembers));
    */
  } catch (error) {
    logger.error('Failed to get promoters with BOD members by society id', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch promoters and BOD members', 500);
  }
};

export const upsertAgmMembersToBodMembersService = async (
  societyId: string,
  agmId: string,
  electedMembers: any[] | null | undefined,
  userId: string | null
) => {
  if (!societyId || !agmId || !Array.isArray(electedMembers) || electedMembers.length === 0) {
    return;
  }

  const memberIds = electedMembers
    .map((m) => m?.member_id)
    .filter((memberId) => typeof memberId === 'string' && memberId.length > 0);

  if (memberIds.length > 0) {
    await BodMember.update(
      { is_active: false, updated_by: userId || null },
      {
        where: {
          society_id: societyId,
          agm_id: agmId,
          is_active: true,
          id: { [Op.notIn]: memberIds }
        }
      }
    );
  } else {
    await BodMember.update(
      { is_active: false, updated_by: userId || null },
      { where: { society_id: societyId, agm_id: agmId, is_active: true } }
    );
  }

  for (const elected of electedMembers) {
    const memberId = elected?.member_id || null;
    const payload: any = {
      society_id: societyId,
      agm_id: agmId,
      name: elected?.name || '',
      designation: normalizeOptionalText(elected?.designation),
      gender: elected?.gender || null,
      category: elected?.category || null,
      shareholder_category: resolveShareholderCategory(elected),
      mobile: elected?.mobile || null,
      is_co_opted: !!elected?.is_co_opted,
      is_active: true,
      updated_by: userId || null
    };

    if (memberId) {
      const existing = await BodMember.findOne({ where: { id: memberId, society_id: societyId, agm_id: agmId } });
      if (existing) {
        await existing.update(payload);
        continue;
      }
    }

    const created = await BodMember.create({
      ...payload,
      created_by: userId || null
    });

    elected.member_id = created.id;
  }
};
