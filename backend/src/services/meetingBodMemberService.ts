import { Op } from 'sequelize';
import Member from '../models/Member';
import BodMember from '../models/BodMember';
import GeneralBodyMeeting from '../models/GeneralBodyMeetings';
import SpecialGeneralBoardMeeting from '../models/SpecialGeneralBoardMeeting';
import { findStatusByKey } from './StatusService';

const AGM_MEETING_TYPE = 'AGM';

export const SHAREHOLDER_CATEGORY_CLASS_A = 'Class A - Shareholder';
export const SHAREHOLDER_CATEGORY_CLASS_B = 'Class B - Nominal Shareholder';

const normalizeMobile = (mobile?: string | null): string | null => {
    if (typeof mobile !== 'string') return null;
    const trimmed = mobile.trim();
    return trimmed.length ? trimmed : null;
};

const normalizeOptionalText = (value?: string | null): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

/** Detect Class A / Class B labels that may have been sent as `category`. */
export const resolveShareholderCategory = (elected: any): string | null => {
    const fromField = normalizeOptionalText(
        elected?.shareholder_category ?? elected?.shareholderCategory
    );
    if (fromField) return fromField;

    const category = normalizeOptionalText(elected?.category);
    if (!category) return null;

    const lower = category.toLowerCase();
    if (
        lower.includes('class a') ||
        lower.includes('nominal') ||
        lower.includes('class b') ||
        lower.includes('shareholder')
    ) {
        return category;
    }
    return null;
};

/** Ensure each elected member object includes shareholder_category and is_selected_for_bod (for API + JSON storage). */
export const normalizeElectedBodMembersWithShareholderCategory = (
    electedMembers: any[] | null | undefined
): any[] | null => {
    if (!Array.isArray(electedMembers)) return electedMembers ?? null;
    return electedMembers.map((elected) => {
        if (!elected || typeof elected !== 'object') return elected;
        const shareholderCategory = resolveShareholderCategory(elected);
        const categoryLower = String(shareholderCategory || '').toLowerCase();
        const isClassShareholder =
            categoryLower.includes('class a') || categoryLower.includes('class b');
        const isCoOpted =
            elected.is_co_opted === true || categoryLower.includes('co-opted bod');

        let selectedForBod = elected.is_selected_for_bod === true;
        if (isClassShareholder) {
            selectedForBod = false;
        } else if (isCoOpted && elected.is_selected_for_bod !== false) {
            selectedForBod = true;
        }

        return {
            ...elected,
            shareholder_category: shareholderCategory,
            is_co_opted: isClassShareholder ? false : isCoOpted,
            is_selected_for_bod: selectedForBod,
            ...(isCoOpted && !isClassShareholder
                ? { designation: elected.designation || 'Co-opted BOD' }
                : {}),
        };
    });
};

const getSocietyMemberIds = (society: { id: string; society_id: string }): string[] =>
    [String(society.id), String(society.society_id)]
        .map((value) => value.trim())
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

const getMemberDedupeKey = (member: { id?: string | null; mobile?: string | null }): string | null => {
    const mobile = normalizeMobile(member.mobile);
    if (mobile) return `mobile:${mobile}`;

    const id = typeof member.id === 'string' ? member.id.trim() : '';
    if (id.length > 0 && !id.startsWith('tmp-')) return `id:${id}`;

    return null;
};

/** Map AGM elected shareholder JSON to the member shape returned by GET /me. */
export const mapAgmElectedShareholderToMemberShape = (
    elected: any,
    societyRegistrationId: string
): Record<string, unknown> => {
    const memberId =
        typeof elected?.member_id === 'string' &&
        elected.member_id.trim().length > 0 &&
        !elected.member_id.trim().startsWith('tmp-')
            ? elected.member_id.trim()
            : null;

    return {
        id: memberId,
        name: elected?.name || null,
        gender: elected?.gender || null,
        category: elected?.category || null,
        shareholder_category: resolveShareholderCategory(elected),
        mobile: normalizeMobile(elected?.mobile),
        society_id: societyRegistrationId,
        designation: elected?.designation || null,
        is_co_opted: !!elected?.is_co_opted,
        is_bod: false,
        is_active: true,
    };
};

/** Non-selected AGM shareholders from the latest approved AGM for a society. */
export const getApprovedAgmNonSelectedShareholdersForSociety = async (
    societyRegistrationId: string
): Promise<Record<string, unknown>[]> => {
    const approvedStatus = await findStatusByKey('approved');
    if (!approvedStatus?.id) return [];

    const latestApprovedAgm = await GeneralBodyMeeting.findOne({
        where: {
            society_id: societyRegistrationId,
            meeting_type: AGM_MEETING_TYPE,
            status: approvedStatus.id,
            active: true,
        },
        order: [['meeting_date', 'DESC']],
        attributes: ['id', 'elected_bod_members'],
    });

    if (!latestApprovedAgm) return [];

    const electedMembers = normalizeElectedBodMembersWithShareholderCategory(
        (latestApprovedAgm.get('elected_bod_members') as any[] | null) ?? null
    );

    if (!Array.isArray(electedMembers)) return [];

    const deletedIdentities = await getApprovedDeletedShareholderIdentities(societyRegistrationId);

    return electedMembers
        .filter((elected) => elected && elected.is_selected_for_bod !== true)
        .filter((elected) => !isApprovedDeletedShareholder(elected, deletedIdentities))
        .map((elected) => mapAgmElectedShareholderToMemberShape(elected, societyRegistrationId));
};

/** Append approved AGM non-selected shareholders to /me members (deduped by id/mobile). */
export const mergeMembersWithApprovedAgmNonSelectedShareholders = (
    dbMembers: any[],
    agmShareholders: Record<string, unknown>[]
): any[] => {
    const merged = dbMembers.map((member) =>
        typeof member?.get === 'function' ? member.get({ plain: true }) : member
    );
    const seenKeys = new Set<string>();

    for (const member of merged) {
        const key = getMemberDedupeKey(member);
        if (key) seenKeys.add(key);
    }

    for (const shareholder of agmShareholders) {
        const key = getMemberDedupeKey(shareholder as { id?: string | null; mobile?: string | null });
        if (key && seenKeys.has(key)) continue;
        if (key) seenKeys.add(key);
        merged.push(shareholder);
    }

    return merged;
};

export const upsertMeetingElectedMembersToMembers = async (
    society: { id: string; society_id: string },
    electedMembers: any[] | null | undefined,
    userId: string | null
) => {
    if (!Array.isArray(electedMembers) || electedMembers.length === 0) return;

    const memberSocietyId = String(society.id);
    const societyMemberIds = getSocietyMemberIds(society);

    for (const elected of electedMembers) {
        const memberId =
            typeof elected?.member_id === 'string' && elected.member_id.trim().length > 0
                ? elected.member_id.trim()
                : null;
        const mobile = normalizeMobile(elected?.mobile);
        const shareholderCategory = resolveShareholderCategory(elected);
        const categoryLower = String(shareholderCategory || '').toLowerCase();
        const isClassShareholder =
            categoryLower.includes('class a') || categoryLower.includes('class b');
        const isCoOpted =
            !!elected?.is_co_opted || categoryLower.includes('co-opted bod');
        const isSelectedForBod = isClassShareholder
            ? false
            : elected?.is_selected_for_bod === true ||
              (isCoOpted && elected?.is_selected_for_bod !== false);

        const payload: any = {
            society_id: memberSocietyId,
            name: elected?.name || null,
            designation: isCoOpted && !isClassShareholder
                ? elected?.designation || 'Co-opted BOD'
                : elected?.designation || null,
            gender: elected?.gender || null,
            category: elected?.category || null,
            shareholder_category: shareholderCategory,
            mobile,
            is_co_opted: isClassShareholder ? false : isCoOpted,
            is_bod: isSelectedForBod,
            is_active: true,
            updated_by: userId || null
        };

        if (memberId && !memberId.startsWith('tmp-')) {
            const existingById = await Member.findByPk(memberId as any);
            if (existingById) {
                await existingById.update(payload);
                continue;
            }
        }

        if (mobile) {
            const existingByMobile = await Member.findOne({
                where: {
                    society_id: { [Op.in]: societyMemberIds },
                    mobile
                }
            });
            if (existingByMobile) {
                await existingByMobile.update(payload);
                continue;
            }
        }

        await Member.create({
            ...payload,
            created_by: userId || null
        });
    }
};

const MEMBER_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DeletedShareholderIdentity = {
    id: string | null;
    mobile: string | null;
    name: string | null;
};

const toDeletedIdentity = (row: any): DeletedShareholderIdentity | null => {
    if (!row || typeof row !== 'object') return null;
    const rawId = typeof row.member_id === 'string' ? row.member_id.trim() : '';
    const id = rawId && MEMBER_UUID_RE.test(rawId) ? rawId : null;
    const mobile = normalizeMobile(row.mobile);
    const name = normalizeOptionalText(row.name)?.toLowerCase() || null;
    if (!id && !mobile && !name) return null;
    return { id, mobile, name };
};

const collectDeletedIdentities = (meetings: any[]): DeletedShareholderIdentity[] => {
    const identities: DeletedShareholderIdentity[] = [];
    for (const meeting of meetings) {
        const rows = typeof meeting?.get === 'function'
            ? meeting.get('deleted_members')
            : meeting?.deleted_members;
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
            const identity = toDeletedIdentity(row);
            if (identity) identities.push(identity);
        }
    }
    return identities;
};

/** Shareholders removed on an approved AGM, SGBM, or BOD meeting. */
export const getApprovedDeletedShareholderIdentities = async (
    societyRegistrationId: string
): Promise<DeletedShareholderIdentity[]> => {
    if (!societyRegistrationId) return [];
    const approvedStatus = await findStatusByKey('approved');
    if (!approvedStatus?.id) return [];

    const [bodyMeetings, sgbmMeetings] = await Promise.all([
        GeneralBodyMeeting.findAll({
            where: {
                society_id: societyRegistrationId,
                meeting_type: { [Op.in]: [AGM_MEETING_TYPE, 'BOD'] },
                status: approvedStatus.id,
                active: true,
            },
            attributes: ['deleted_members'],
        }),
        SpecialGeneralBoardMeeting.findAll({
            where: {
                society_id: societyRegistrationId,
                status: approvedStatus.id,
                active: true,
            },
            attributes: ['deleted_members'],
        }),
    ]);

    return [
        ...collectDeletedIdentities(bodyMeetings),
        ...collectDeletedIdentities(sgbmMeetings),
    ];
};

const personMatchesDeletedIdentity = (
    person: { id?: string | null; member_id?: string | null; mobile?: string | null; name?: string | null },
    deleted: DeletedShareholderIdentity
): boolean => {
    const personId = String(person.id || person.member_id || '').trim().toLowerCase();
    if (deleted.id && personId && deleted.id.toLowerCase() === personId) return true;

    const personMobile = normalizeMobile(person.mobile);
    if (deleted.mobile && personMobile && deleted.mobile === personMobile) return true;

    if (!deleted.id && !deleted.mobile && deleted.name) {
        const personName = normalizeOptionalText(person.name)?.toLowerCase() || null;
        if (personName && personName === deleted.name) return true;
    }

    return false;
};

export const isApprovedDeletedShareholder = (
    person: { id?: string | null; member_id?: string | null; mobile?: string | null; name?: string | null },
    deletedIdentities: DeletedShareholderIdentity[]
): boolean => deletedIdentities.some((deleted) => personMatchesDeletedIdentity(person, deleted));

/** Drop shareholders already deleted on an approved AGM, SGBM, or BOD meeting. */
export const excludeApprovedDeletedShareholders = async <T extends {
    id?: string | null;
    member_id?: string | null;
    mobile?: string | null;
    name?: string | null;
}>(
    societyRegistrationId: string,
    people: T[]
): Promise<T[]> => {
    const deletedIdentities = await getApprovedDeletedShareholderIdentities(societyRegistrationId);
    if (deletedIdentities.length === 0) return people;
    return people.filter((person) => !isApprovedDeletedShareholder(person, deletedIdentities));
};

/**
 * Remove shareholders listed on the meeting from My Society (`members`)
 * and from the active BOD roster. Runs on final approval.
 */
export const deactivateDeletedMeetingShareholders = async (
    society: { id: string; society_id: string },
    deletedMembers: any[] | null | undefined,
    userId: string | null
) => {
    if (!Array.isArray(deletedMembers) || deletedMembers.length === 0) return;

    const societyMemberIds = getSocietyMemberIds(society);

    for (const row of deletedMembers) {
        const identity = toDeletedIdentity(row);
        if (!identity) continue;

        let member: Member | null = null;
        if (identity.id) {
            member = await Member.findOne({
                where: {
                    id: identity.id,
                    society_id: { [Op.in]: societyMemberIds },
                    is_active: true,
                },
            });
        }
        if (!member && identity.mobile) {
            member = await Member.findOne({
                where: {
                    society_id: { [Op.in]: societyMemberIds },
                    mobile: identity.mobile,
                    is_active: true,
                },
            });
        }
        if (!member && identity.name && !identity.id && !identity.mobile) {
            const matches = await Member.findAll({
                where: {
                    society_id: { [Op.in]: societyMemberIds },
                    is_active: true,
                },
            });
            const named = matches.filter(
                (item) => normalizeOptionalText(item.name)?.toLowerCase() === identity.name
            );
            const onlyNamed = named[0];
            if (named.length === 1 && onlyNamed) member = onlyNamed;
        }

        if (member) {
            await member.update({
                is_active: false,
                is_bod: false,
                updated_by: userId || null,
            });
        }

        const bodWhere: Record<string, unknown> = {
            society_id: society.id,
            is_active: true,
        };
        if (identity.mobile) {
            await BodMember.update(
                { is_active: false, updated_by: userId || null },
                { where: { ...bodWhere, mobile: identity.mobile } }
            );
        } else if (identity.name && !identity.id) {
            const bodRows = await BodMember.findAll({
                where: bodWhere as any,
            });
            const named = bodRows.filter(
                (item) => normalizeOptionalText(item.name)?.toLowerCase() === identity.name
            );
            const onlyNamed = named[0];
            if (named.length === 1 && onlyNamed) {
                await onlyNamed.update({ is_active: false, updated_by: userId || null });
            }
        } else if (member?.name) {
            const bodRows = await BodMember.findAll({ where: bodWhere as any });
            const named = bodRows.filter(
                (item) =>
                    normalizeOptionalText(item.name)?.toLowerCase() ===
                    normalizeOptionalText(member?.name)?.toLowerCase()
            );
            for (const bodRow of named) {
                if (identity.mobile && normalizeMobile(bodRow.mobile) !== identity.mobile) continue;
                await bodRow.update({ is_active: false, updated_by: userId || null });
            }
        }
    }
};
