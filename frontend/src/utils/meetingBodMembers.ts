import type { ElectedBodMember, Member } from "../types";

export const SHAREHOLDER_CATEGORY = {
  CLASS_A: "Class A Shareholder",
  CLASS_B: "Class B Nominal Shareholder",
  CO_OPTED: "Co-opted BOD",
} as const;

export const getMeetingMemberKey = (
  member: { id?: string; mobile?: string; name?: string },
  index: number,
) => member.id || member.mobile || `${member.name}-${index}`;

export const electedMembersToRecord = (
  members: ElectedBodMember[],
): Record<string, ElectedBodMember> => {
  const record: Record<string, ElectedBodMember> = {};
  members.forEach((member, index) => {
    const key =
      member.member_id ||
      member.mobile ||
      `${member.name}-${member.designation}-${index}`;
    record[key] = member;
  });
  return record;
};

export const recordToElectedMembers = (
  record: Record<string, ElectedBodMember>,
): ElectedBodMember[] => Object.values(record);

const normalizeCategory = (category?: string) =>
  String(category || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export const isClassAShareholder = (category?: string) =>
  normalizeCategory(category).includes("class a");

export const isClassBShareholder = (category?: string) =>
  normalizeCategory(category).includes("class b");

export const isCoOptedBodCategory = (category?: string) =>
  normalizeCategory(category).includes("co-opted bod");

/** Class A / Class B shareholders are not eligible for BOD election. */
export const isNonBodShareholder = (member: {
  shareholder_category?: string;
}) =>
  isClassAShareholder(member.shareholder_category) ||
  isClassBShareholder(member.shareholder_category);

/** Board composition: selected for BOD and not a Class A/B shareholder. */
export const isBodBoardMember = (member: {
  is_selected_for_bod?: boolean;
  shareholder_category?: string;
}) => Boolean(member.is_selected_for_bod) && !isNonBodShareholder(member);

export const sanitizeElectedBodMembers = (
  members: ElectedBodMember[],
): ElectedBodMember[] =>
  members.map((member) => {
    if (isNonBodShareholder(member)) {
      return {
        ...member,
        designation: "",
        is_co_opted: false,
        is_selected_for_bod: false,
      };
    }
    if (
      isCoOptedBodCategory(member.shareholder_category) ||
      Boolean(member.is_co_opted)
    ) {
      return {
        ...member,
        designation: SHAREHOLDER_CATEGORY.CO_OPTED,
        is_co_opted: true,
        // Co-opted BOD defaults to selected unless explicitly unchecked.
        is_selected_for_bod: member.is_selected_for_bod !== false,
      };
    }
    return member;
  });

export const isSocietyElectedMember = (
  member: ElectedBodMember,
  societyMembers: Member[],
  memberKey?: string,
) => {
  const societyKeys = new Set(
    societyMembers.map((m, index) => getMeetingMemberKey(m, index)),
  );
  const societyIds = new Set(
    societyMembers.map((m) => m.id).filter(Boolean) as string[],
  );
  const societyMobiles = new Set(
    societyMembers.map((m) => m.mobile).filter(Boolean) as string[],
  );

  if (memberKey && societyKeys.has(memberKey)) return true;
  if (member.member_id && societyIds.has(member.member_id)) return true;
  if (member.mobile && societyMobiles.has(member.mobile)) return true;

  return societyMembers.some(
    (societyMember) =>
      (member.member_id && societyMember.id === member.member_id) ||
      (member.mobile && societyMember.mobile === member.mobile),
  );
};

export const splitElectedMembersForForm = (
  members: ElectedBodMember[],
  societyMembers: Member[],
): {
  selected: Record<string, ElectedBodMember>;
  added: Record<string, ElectedBodMember>;
} => {
  const selected: Record<string, ElectedBodMember> = {};
  const added: Record<string, ElectedBodMember> = {};

  members.forEach((member, index) => {
    const key =
      member.member_id ||
      member.mobile ||
      `${member.name}-${index}`;

    if (isSocietyElectedMember(member, societyMembers, key)) {
      selected[key] = {
        ...member,
        is_selected_for_bod: isNonBodShareholder(member)
          ? false
          : member.is_selected_for_bod ?? true,
      };
      return;
    }

    const isCoOpted =
      Boolean(member.is_co_opted) ||
      isCoOptedBodCategory(member.shareholder_category);
    const selectedForBod = isNonBodShareholder(member)
      ? false
      : isCoOpted
        ? member.is_selected_for_bod !== false
        : Boolean(member.is_selected_for_bod);

    added[key] = {
      ...member,
      is_selected_for_bod: selectedForBod,
    };
    if (selectedForBod) {
      selected[key] = added[key];
    }
  });

  return { selected, added };
};

/** Build AGM/SGBM payload: all newly added shareholders + checked society members. */
export const buildElectedBodMembersPayload = (
  selectedElectedMembers: Record<string, ElectedBodMember>,
  addedMembers: Record<string, ElectedBodMember>,
  societyMembers: Member[],
): ElectedBodMember[] => {
  const societyKeys = new Set(
    societyMembers.map((member, index) => getMeetingMemberKey(member, index)),
  );

  const societySelected = Object.entries(selectedElectedMembers)
    .filter(([memberKey]) => societyKeys.has(memberKey))
    .map(([, member]) => ({
      ...member,
      is_selected_for_bod: !isNonBodShareholder(member),
    }));

  const newlyAddedKeys = new Set([
    ...Object.keys(addedMembers),
    ...Object.keys(selectedElectedMembers).filter(
      (memberKey) => !societyKeys.has(memberKey),
    ),
  ]);

  const newlyAdded = [...newlyAddedKeys]
    .map((memberKey) => {
      const isSelected = Boolean(selectedElectedMembers[memberKey]);
      const base = addedMembers[memberKey] || selectedElectedMembers[memberKey];
      if (!base) return null;

      const isCoOpted =
        Boolean(base.is_co_opted) ||
        isCoOptedBodCategory(base.shareholder_category);
      const selectedForBod = isNonBodShareholder(base)
        ? false
        : isCoOpted
          ? isSelected || base.is_selected_for_bod !== false
          : isSelected;

      return {
        ...(isSelected ? selectedElectedMembers[memberKey] : base),
        is_selected_for_bod: selectedForBod,
      };
    })
    .filter(Boolean) as ElectedBodMember[];

  return sanitizeElectedBodMembers([...societySelected, ...newlyAdded]);
};

export const countBodEligibleSelected = (members: ElectedBodMember[]) =>
  members.filter((member) => isBodBoardMember(member)).length;
