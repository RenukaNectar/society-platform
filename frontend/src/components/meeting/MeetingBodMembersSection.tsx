import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AlertCircle, Plus, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { RootState } from "../../store";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Textarea } from "../ui/Textarea";
import { DocumentUpload } from "../ui/DocumentUpload";
import type { DeletedAmendmentMember, ElectedBodMember, Member } from "../../types";
import {
  getMeetingMemberKey,
  isCoOptedBodCategory,
  isNonBodShareholder,
  SHAREHOLDER_CATEGORY,
} from "../../utils/meetingBodMembers";

const MOBILE_10_DIGIT_REGEX = /^\d{10}$/;

/** BOD designation options for selecting existing society members. */
const MEETING_BOD_DESIGNATIONS = [
  "Chairman",
  "Vice Chairman",
  "Other Board Member",
] as const;

/** At most one member may hold each of these designations. */
const UNIQUE_MEETING_BOD_DESIGNATIONS = new Set<string>([
  "Chairman",
  "Vice Chairman",
]);

const getMobileNumberError = (
  mobile: string,
  required = false,
): string | undefined => {
  if (!mobile.trim()) {
    return required ? "Mobile number is required" : undefined;
  }
  if (!MOBILE_10_DIGIT_REGEX.test(mobile.trim())) {
    return "Mobile number must be exactly 10 digits";
  }
  return undefined;
};

type MeetingBodMembersSectionProps = {
  members: Member[];
  bodMember?: boolean;
  selectedElectedMembers: Record<string, ElectedBodMember>;
  onSelectedChange: (selected: Record<string, ElectedBodMember>) => void;
  addedMembers?: Record<string, ElectedBodMember>;
  onAddedMembersChange?: (added: Record<string, ElectedBodMember>) => void;
  title?: string;
  description?: string;
  addButtonLabel?: string;
  /** When true, hide society member picker list — only manually added members are shown. */
  addOnly?: boolean;
  /** BOD meeting form only — show and require shareholder category. */
  showShareholderCategory?: boolean;
  /** BOD meeting form only — require reason/document when deleting a society shareholder. */
  requireDeletionDetails?: boolean;
  deletedMembers?: DeletedAmendmentMember[];
  onDeletedMembersChange?: (deleted: DeletedAmendmentMember[]) => void;
};

export const MeetingBodMembersSection: React.FC<MeetingBodMembersSectionProps> = ({
  members,
  bodMember = false,
  selectedElectedMembers,
  onSelectedChange,
  addedMembers: addedMembersProp,
  onAddedMembersChange,
  title = "Elected BOD Members",
  description = "Select elected members and set their BOD designation. You can add new members or remove existing selections.",
  addButtonLabel = "Add Shareholder",
  addOnly = false,
  showShareholderCategory = false,
  requireDeletionDetails = false,
  deletedMembers = [],
  onDeletedMembersChange,
}) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [internalAddedMembers, setInternalAddedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const addedMembers = addedMembersProp ?? internalAddedMembers;

  const setAddedMembers = (
    updater:
      | Record<string, ElectedBodMember>
      | ((
          prev: Record<string, ElectedBodMember>,
        ) => Record<string, ElectedBodMember>),
  ) => {
    const next =
      typeof updater === "function" ? updater(addedMembers) : updater;
    onAddedMembersChange?.(next);
    if (!addedMembersProp) {
      setInternalAddedMembers(next);
    }
  };
  
  const [newMemberData, setNewMemberData] = useState({
    name: "",
    mobile: "",
    gender: "",
    category: "",
    shareholder_category: "",
    designation: "",
  });
  const [newMemberErrors, setNewMemberErrors] = useState<
    Partial<Record<keyof typeof newMemberData, string>>
  >({});
  const [deletingMemberKey, setDeletingMemberKey] = useState<string | null>(
    null,
  );
  const [deletingMember, setDeletingMember] = useState<ElectedBodMember | null>(
    null,
  );
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionDocumentId, setDeletionDocumentId] = useState("");
  const [deletionDocumentUrl, setDeletionDocumentUrl] = useState("");
  const [deletionErrors, setDeletionErrors] = useState<Record<string, string>>(
    {},
  );

  const bodEligibleMembers = Object.values(selectedElectedMembers).filter(
    (member) =>
      member.is_selected_for_bod !== false && !isNonBodShareholder(member),
  );
  const isDesignationAssignedToAnother = (
    designation: string,
    memberKey?: string,
  ) => {
    if (!designation.trim()) return false;
    if (!UNIQUE_MEETING_BOD_DESIGNATIONS.has(designation)) return false;
    return Object.entries(selectedElectedMembers).some(
      ([selectedMemberKey, member]) =>
        selectedMemberKey !== memberKey &&
        !isNonBodShareholder(member) &&
        member.designation === designation,
    );
  };
  const isAddingCoOptedBod =
    !showShareholderCategory ||
    isCoOptedBodCategory(newMemberData.shareholder_category);

  const renderDesignationOptions = (memberKey?: string) => (
    <>
      <option value="">Select designation</option>
      {MEETING_BOD_DESIGNATIONS.map((designation) => (
        <option
          key={designation}
          value={designation}
          disabled={
            UNIQUE_MEETING_BOD_DESIGNATIONS.has(designation) &&
            isDesignationAssignedToAnother(designation, memberKey)
          }
        >
          {designation}
        </option>
      ))}
    </>
  );

  // BOD meeting uses only newly created members — ignore existing society list.
  const effectiveMembers = bodMember ? [] : members;

  const societyMemberKeys = useMemo(
    () =>
      new Set(
        effectiveMembers.map((member, index) =>
          getMeetingMemberKey(member, index),
        ),
      ),
    [effectiveMembers],
  );

  /** Members created via Add Member modal — not from the society list. */
  const newlyAddedMembers = useMemo(() => {
    const merged: Record<string, ElectedBodMember> = { ...addedMembers };
    Object.entries(selectedElectedMembers).forEach(([memberKey, member]) => {
      if (!societyMemberKeys.has(memberKey)) {
        merged[memberKey] = selectedElectedMembers[memberKey] || member;
      }
    });
    return Object.entries(merged);
  }, [addedMembers, selectedElectedMembers, societyMemberKeys]);

  // BOD meeting: count women from newly added members.
  // AGM/SGBM: count from BOD-eligible selected members only.
  const membersForRule = bodMember
    ? newlyAddedMembers.map(([, member]) => member)
    : bodEligibleMembers;
  const electedMembersCount = membersForRule.length;
  const electedWomenCount = membersForRule.filter(
    (member) => (member.gender || "").toLowerCase() === "female",
  ).length;
  const isWomenRuleValid = electedMembersCount === 0 || electedWomenCount >= 2;

  const deletableSocietyMembers = useMemo(() => {
    if (!bodMember || !requireDeletionDetails) return [];
    return members.filter((member) => {
      const memberId = member.id;
      return !deletedMembers.some(
        (deleted) =>
          (memberId && deleted.member_id === memberId) ||
          (member.mobile && deleted.mobile === member.mobile),
      );
    });
  }, [bodMember, requireDeletionDetails, members, deletedMembers]);

  const displayMembers: Member[] = useMemo(() => {
    if (addOnly || bodMember) {
      return newlyAddedMembers.map(([memberKey, member]) => ({
        id: member.member_id || memberKey,
        name: member.name,
        mobile: member.mobile || "",
        gender: member.gender || "",
        category: member.category || "",
        designation: member.designation,
      }));
    }

    // Existing society members only — newly created ones render in a separate card.
    return effectiveMembers;
  }, [effectiveMembers, newlyAddedMembers, addOnly, bodMember]);

  const updateElectedMember = (
    memberId: string,
    patch: Partial<ElectedBodMember>,
  ) => {
    if (
      patch.designation &&
      isDesignationAssignedToAnother(patch.designation, memberId)
    ) {
      return;
    }

    onSelectedChange({
      ...selectedElectedMembers,
      [memberId]: {
        ...(selectedElectedMembers[memberId] || {
          member_id: memberId,
          name: "",
          designation: "",
        }),
        ...patch,
      },
    });
    setAddedMembers((prev) => {
      if (!prev[memberId]) return prev;
      return {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          ...patch,
        },
      };
    });
  };

  const removeElectedMember = (memberId: string) => {
    const updated = { ...selectedElectedMembers };
    delete updated[memberId];
    onSelectedChange(updated);
  };

  const removeAddedMember = (memberId: string) => {
    setAddedMembers((prev) => {
      const updated = { ...prev };
      delete updated[memberId];
      return updated;
    });
    removeElectedMember(memberId);
  };

  const resetDeletionDialog = () => {
    setDeletingMemberKey(null);
    setDeletingMember(null);
    setDeletionReason("");
    setDeletionDocumentId("");
    setDeletionDocumentUrl("");
    setDeletionErrors({});
  };

  const requestDeleteMember = (
    memberKey: string,
    member: ElectedBodMember,
  ) => {
    if (!requireDeletionDetails) {
      if (addedMembers[memberKey]) {
        removeAddedMember(memberKey);
      } else {
        removeElectedMember(memberKey);
      }
      return;
    }

    setDeletingMemberKey(memberKey);
    setDeletingMember(member);
    setDeletionReason("");
    setDeletionDocumentId("");
    setDeletionDocumentUrl("");
    setDeletionErrors({});
  };

  const confirmDeleteMember = () => {
    if (!deletingMemberKey || !deletingMember) return;

    const nextErrors: Record<string, string> = {};
    if (!deletionReason.trim()) {
      nextErrors.deletion_reason = "Reason for deletion is required";
    }
    if (!deletionDocumentId) {
      nextErrors.supporting_document = "Supporting document is required";
    }
    if (Object.keys(nextErrors).length > 0) {
      setDeletionErrors(nextErrors);
      return;
    }

    const deletedRow: DeletedAmendmentMember = {
      member_id: deletingMember.member_id || deletingMemberKey,
      name: deletingMember.name,
      mobile: deletingMember.mobile || null,
      gender: deletingMember.gender || null,
      category: deletingMember.category || null,
      designation: deletingMember.designation || null,
      deletion_reason: deletionReason.trim(),
      supporting_document_media_id: deletionDocumentId,
      supportingDocumentMedia: deletionDocumentUrl
        ? { id: deletionDocumentId, url: deletionDocumentUrl }
        : null,
      deleted_at: new Date().toISOString(),
    };

    onDeletedMembersChange?.([
      ...deletedMembers.filter(
        (item) =>
          item.member_id !== deletedRow.member_id &&
          item.member_id !== deletingMemberKey,
      ),
      deletedRow,
    ]);

    if (addedMembers[deletingMemberKey]) {
      removeAddedMember(deletingMemberKey);
    } else {
      removeElectedMember(deletingMemberKey);
    }

    toast.success("Shareholder removed successfully");
    resetDeletionDialog();
  };

  const toggleAddedMember = (
    memberKey: string,
    member: ElectedBodMember,
    checked: boolean,
  ) => {
    const base = addedMembers[memberKey] || member;
    const isShareholderOnly = isNonBodShareholder(base);
    const isCoOpted =
      Boolean(base.is_co_opted) ||
      isCoOptedBodCategory(base.shareholder_category);

    const nextMember = {
      ...base,
      ...(isShareholderOnly
        ? {
            designation: "",
            is_co_opted: false,
          }
        : isCoOpted
          ? {
              designation: SHAREHOLDER_CATEGORY.CO_OPTED,
              is_co_opted: true,
            }
          : {}),
      is_selected_for_bod: checked,
    };

    setAddedMembers((prev) => ({
      ...prev,
      [memberKey]: nextMember,
    }));

    if (!checked) {
      removeElectedMember(memberKey);
      return;
    }

    onSelectedChange({
      ...selectedElectedMembers,
      [memberKey]: nextMember,
    });
  };

  const toggleElectedMember = (
    member: Member,
    memberKey: string,
    checked: boolean,
  ) => {
    if (!checked) {
      removeElectedMember(memberKey);
      return;
    }

    onSelectedChange({
      ...selectedElectedMembers,
      [memberKey]: {
        member_id: member.id,
        name: member.name,
        designation: "",
        gender: member.gender,
        category: member.category,
        mobile: member.mobile,
        is_co_opted: false,
        is_selected_for_bod: true,
      },
    });
  };
  const resetNewMemberForm = () => {
    setNewMemberData({
      name: "",
      mobile: "",
      gender: "",
      category: "",
      shareholder_category: "",
      designation: "",
    });
    setNewMemberErrors({});
  };

  const validateNewMemberForm = () => {
    const validationErrors: Partial<Record<keyof typeof newMemberData, string>> =
      {};

    if (!newMemberData.name.trim()) {
      validationErrors.name = "Member name is required";
    }
    const mobileError = getMobileNumberError(newMemberData.mobile, true);
    if (mobileError) validationErrors.mobile = mobileError;
    if (!newMemberData.gender) validationErrors.gender = "Gender is required";
    if (!newMemberData.category) validationErrors.category = "Category is required";
    if (showShareholderCategory && !newMemberData.shareholder_category) {
      validationErrors.shareholder_category = "Shareholder category is required";
    }


    setNewMemberErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleNewMemberMobileChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setNewMemberData((prev) => ({ ...prev, mobile: digitsOnly }));
    setNewMemberErrors((prev) => ({
      ...prev,
      mobile: getMobileNumberError(digitsOnly),
    }));
  };

  const handleAddMemberFromModal = async () => {
    if (!validateNewMemberForm()) return;

    try {
      setIsAddingMember(true);
      const createdMemberId = `tmp-${Date.now()}`;
      const coOpted = showShareholderCategory
        ? isCoOptedBodCategory(newMemberData.shareholder_category)
        : true;

      const newMember = {
        member_id: createdMemberId,
        name: newMemberData.name,
        designation: coOpted ? SHAREHOLDER_CATEGORY.CO_OPTED : "",
        gender: newMemberData.gender,
        category: newMemberData.category,
        ...(showShareholderCategory && {
          shareholder_category: newMemberData.shareholder_category,
        }),
        mobile: newMemberData.mobile,
        // Keep UI based on selected category; BOD meeting sets is_co_opted in submit payload only.
        is_co_opted: bodMember ? true : coOpted,
        is_selected_for_bod: bodMember ? false : coOpted,
      };

      setAddedMembers((prev) => ({
        ...prev,
        [createdMemberId]: newMember,
      }));

      if (bodMember || coOpted) {
        onSelectedChange({
          ...selectedElectedMembers,
          [createdMemberId]: newMember,
        });
      }

      toast.success("Member added successfully");
      setIsAddMemberModalOpen(false);
      resetNewMemberForm();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users
              className={`h-6 w-6 text-indigo-600 ${mode === "dark" ? "text-indigo-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              {title}
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAddMemberModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {addButtonLabel}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-md border px-3 py-2 text-sm">
            Selected: <span className="font-semibold">{electedMembersCount}</span>
          </div>
          <div className="rounded-md border px-3 py-2 text-sm">
            Women: <span className="font-semibold">{electedWomenCount}</span>
          </div>
        </div>
        <div className="mb-4">
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              isWomenRuleValid
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {isWomenRuleValid
              ? "Women reservation rule passed"
              : "At least 2 women members required when BOD members are selected"}
          </div>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {bodMember ? (
            newlyAddedMembers.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
                No members added yet. Click{" "}
                <span className="font-semibold">{addButtonLabel}</span> to add
                members.
              </div>
            ) : (
              newlyAddedMembers.map(([memberKey, member]) => {
                // BOD meeting UI: show category as selected; do not display co-opted from payload flag.
                const showDesignation = !isNonBodShareholder(member);

                return (
                  <div
                    key={memberKey}
                    className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-4 gap-3"
                  >
                    <div className="text-sm font-medium flex items-center gap-2">
                      {member.name}
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        New
                      </span>
                    </div>
                    {showDesignation ? (
                      <select
                        value={member.designation || ""}
                        onChange={(e) =>
                          updateElectedMember(memberKey, {
                            designation: e.target.value,
                          })
                        }
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        {renderDesignationOptions(memberKey)}
                      </select>
                    ) : (
                      <div className="text-xs text-gray-500 flex items-center">
                        {member.shareholder_category || "-"}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 flex items-center">
                      {member.gender} | {member.category}
                      {showShareholderCategory && member.shareholder_category
                        ? ` | ${member.shareholder_category}`
                        : ""}
                      {member.mobile ? ` | ${member.mobile}` : ""}
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => requestDeleteMember(memberKey, member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )
          ) : displayMembers.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
              {addOnly ? (
                <>
                  No members added yet. Click{" "}
                  <span className="font-semibold">{addButtonLabel}</span> to add
                  shareholders.
                </>
              ) : (
                <>
                  No society members available yet. Click{" "}
                  <span className="font-semibold">{addButtonLabel}</span> to add elected
                  members in the card below.
                </>
              )}
            </div>
          ) : addOnly ? (
            newlyAddedMembers.map(([memberKey, member]) => {
              const isCoOpted =
                Boolean(member.is_co_opted) ||
                isCoOptedBodCategory(member.shareholder_category);
              const isShareholderOnly = isNonBodShareholder(member);
              const showDesignation = !isShareholderOnly;
              const isSelected = Boolean(selectedElectedMembers[memberKey]);
              return (
              <div
                key={memberKey}
                className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-4 gap-3"
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      toggleAddedMember(memberKey, member, e.target.checked)
                    }
                  />
                  {member.name}
                </label>
                {showDesignation ? (
                  isCoOpted ? (
                    <div className="text-sm text-gray-700 flex items-center">
                      {SHAREHOLDER_CATEGORY.CO_OPTED}
                    </div>
                  ) : (
                    <select
                      value={member.designation || ""}
                      disabled={!isSelected}
                      onChange={(e) =>
                        updateElectedMember(memberKey, {
                          designation: e.target.value,
                        })
                      }
                      className={`border rounded-md px-2 py-1 text-sm ${
                        !isSelected ? "bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {renderDesignationOptions(memberKey)}
                    </select>
                  )
                ) : (
                  <div className="text-xs text-gray-500 flex items-center">
                    {member.shareholder_category || "Shareholder"}
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-600 flex items-center">
                    {member.gender} | {member.category}
                    {showShareholderCategory && member.shareholder_category
                      ? ` | ${member.shareholder_category}`
                      : ""}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => requestDeleteMember(memberKey, member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
            })
          ) : (
            displayMembers.map((item, index) => {
              const memberKey = getMeetingMemberKey(item, index);
              const selectedMember = selectedElectedMembers[memberKey];
              const isSelected = Boolean(selectedMember);

              return (
                <div
                  key={memberKey}
                  className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-3"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        toggleElectedMember(item, memberKey, e.target.checked)
                      }
                    />
                    {item.name}
                  </label>
                  <div className="text-sm text-gray-700 flex items-center">
                    {item.designation || "-"}
                  </div>
                  <select
                    value={selectedMember?.designation || ""}
                    disabled={!isSelected}
                    onChange={(e) =>
                      updateElectedMember(memberKey, {
                        designation: e.target.value,
                      })
                    }
                    className={`border rounded-md px-2 py-1 text-sm ${
                      !isSelected ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {renderDesignationOptions(memberKey)}
                  </select>
                  <div className="text-xs text-gray-600 flex items-center">
                    {item.gender} | {item.category}
                    {showShareholderCategory && selectedMember?.shareholder_category
                      ? ` | ${selectedMember.shareholder_category}`
                      : ""}
                  </div>
                  <div className="flex items-center justify-end">
                    {isSelected && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() =>
                          requestDeleteMember(memberKey, {
                            member_id: item.id,
                            name: item.name,
                            designation:
                              selectedMember?.designation ||
                              item.designation ||
                              "",
                            gender: item.gender,
                            category: item.category,
                            mobile: item.mobile,
                            shareholder_category:
                              selectedMember?.shareholder_category,
                            is_co_opted: selectedMember?.is_co_opted,
                            is_selected_for_bod:
                              selectedMember?.is_selected_for_bod,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="mt-3 text-sm font-medium text-gray-700">
          Selected: {electedMembersCount}
        </p>
      </Card>

      {bodMember && requireDeletionDetails && (
        <Card padding="sm" className="mt-4">
          <div className="flex items-center space-x-3 mb-4">
            <Users
              className={`h-6 w-6 text-red-600 ${mode === "dark" ? "text-red-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Society Shareholders
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Remove a shareholder with a reason and supporting document. My Society
            updates after this meeting is approved.
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {deletableSocietyMembers.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
                No society shareholders available to delete.
              </div>
            ) : (
              deletableSocietyMembers.map((member, index) => {
                  const memberKey = getMeetingMemberKey(member, index);
                  return (
                    <div
                      key={memberKey}
                      className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-4 gap-3"
                    >
                      <div className="text-sm font-medium flex items-center">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center">
                        {member.designation || member.shareholder_category || "Shareholder"}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center">
                        {member.gender} | {member.category}
                        {member.mobile ? ` | ${member.mobile}` : ""}
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() =>
                            requestDeleteMember(memberKey, {
                              member_id: member.id,
                              name: member.name,
                              designation: member.designation || "",
                              gender: member.gender,
                              category: member.category,
                              mobile: member.mobile,
                              shareholder_category: member.shareholder_category,
                              is_co_opted: Boolean(member.is_co_opted),
                              is_selected_for_bod: Boolean(member.is_bod),
                            } as ElectedBodMember)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      )}

      {requireDeletionDetails && deletedMembers.length > 0 && (
        <Card padding="sm" className="mt-4">
          <h4 className="text-sm font-semibold text-red-700 mb-3">
            Deleted Shareholders ({deletedMembers.length})
          </h4>
          <div className="space-y-2">
            {deletedMembers.map((member, index) => (
              <div
                key={member.member_id || index}
                className="p-3 border border-red-100 rounded-lg bg-red-50"
              >
                <p className="text-sm font-medium text-gray-900">
                  {member.name}
                  {member.mobile ? ` (${member.mobile})` : ""}
                </p>
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Reason:</span>{" "}
                  {member.deletion_reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!addOnly && !bodMember && (
        <Card padding="sm" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users
                className={`h-6 w-6 text-emerald-600 ${mode === "dark" ? "text-emerald-400" : ""}`}
              />
              <h3
                className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
              >
                Newly Added Members
              </h3>
            </div>
            <span className="text-sm text-gray-600">
              {newlyAddedMembers.length} added
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Members created with{" "}
            <span className="font-semibold">{addButtonLabel}</span> appear here.
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {newlyAddedMembers.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
                No newly added members yet. Use{" "}
                <span className="font-semibold">{addButtonLabel}</span> above to create
                one.
              </div>
            ) : (
              newlyAddedMembers.map(([memberKey, member]) => {
                const isCoOpted =
                  Boolean(member.is_co_opted) ||
                  isCoOptedBodCategory(member.shareholder_category);
                const isShareholderOnly = isNonBodShareholder(member);
                const showDesignation = !isShareholderOnly;
                const isSelected = Boolean(selectedElectedMembers[memberKey]);
             
                return (
                <div
                  key={memberKey}
                  className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        toggleAddedMember(memberKey, member, e.target.checked)
                      }
                    />
                    {member.name}
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      New
                    </span>
                  </label>
                    {showDesignation ? (
                      isCoOpted ? (
                        <div className="text-sm text-gray-700 flex items-center">
                          {SHAREHOLDER_CATEGORY.CO_OPTED}
                        </div>
                      ) : (
                        <select
                          value={member.designation || ""}
                          disabled={!isSelected}
                          onChange={(e) => {
                            updateElectedMember(memberKey, {
                              designation: e.target.value,
                            });
                          }}
                          className={`border rounded-md px-2 py-1 text-sm ${
                            !isSelected ? "bg-gray-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {renderDesignationOptions(memberKey)}
                        </select>
                      )
                    ) : (
                      <div className="text-xs text-gray-500 flex items-center">
                        {member?.shareholder_category}
                      </div>
                    )}
                  <div className="text-xs text-gray-600 flex items-center">
                    {member.gender} | {member.category}
                    {showShareholderCategory && member.shareholder_category
                      ? ` | ${member.shareholder_category}`
                      : ""}
                    {member.mobile ? ` | ${member.mobile}` : ""}
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => requestDeleteMember(memberKey, member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </Card>
      )}

      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          resetNewMemberForm();
        }}
        title="Add Member"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Member Name"
            value={newMemberData.name}
            onChange={(e) =>
              setNewMemberData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={newMemberErrors.name}
            required
          />
          <Input
            label="Mobile"
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit mobile number"
            value={newMemberData.mobile}
            onChange={(e) => handleNewMemberMobileChange(e.target.value)}
            error={newMemberErrors.mobile}
            maxLength={10}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={newMemberData.gender}
              onChange={(e) =>
                setNewMemberData((prev) => ({ ...prev, gender: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
            </select>
            {newMemberErrors.gender && (
              <p className="text-red-600 text-sm mt-1">{newMemberErrors.gender}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={newMemberData.category}
              onChange={(e) =>
                setNewMemberData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select category</option>
              <option value="General">General</option>
              <option value="SC">SC</option>
              <option value="APST">APST</option>
            </select>
            {newMemberErrors.category && (
              <p className="text-red-600 text-sm mt-1">{newMemberErrors.category}</p>
            )}
          </div>
          {showShareholderCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shareholder Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newMemberData.shareholder_category}
                onChange={(e) =>
                  setNewMemberData((prev) => ({
                    ...prev,
                    shareholder_category: e.target.value,
                    designation: isCoOptedBodCategory(e.target.value)
                      ? SHAREHOLDER_CATEGORY.CO_OPTED
                      : "",
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Select shareholder category</option>
                <option value={SHAREHOLDER_CATEGORY.CLASS_A}>
                  {SHAREHOLDER_CATEGORY.CLASS_A}
                </option>
                <option value={SHAREHOLDER_CATEGORY.CLASS_B}>
                  {SHAREHOLDER_CATEGORY.CLASS_B}
                </option>
             { !bodMember && <option value={SHAREHOLDER_CATEGORY.CO_OPTED}>
                  {SHAREHOLDER_CATEGORY.CO_OPTED}
                </option>}
              </select>
              {newMemberErrors.shareholder_category && (
                <p className="text-red-600 text-sm mt-1">
                  {newMemberErrors.shareholder_category}
                </p>
              )}
            </div>
          )}
          {isAddingCoOptedBod && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <div className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-700">
                {SHAREHOLDER_CATEGORY.CO_OPTED}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddMemberModalOpen(false);
                resetNewMemberForm();
              }}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMemberFromModal}
              loading={isAddingMember}
              disabled={isAddingMember}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {deletingMember && (
        <Modal
          isOpen={!!deletingMember}
          onClose={resetDeletionDialog}
          title="Confirm Shareholder Deletion"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">
                Are you sure you want to remove this shareholder?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {deletingMember.name}
                </p>
                <p className="text-xs text-gray-600">
                  {deletingMember.designation} • {deletingMember.gender} •{" "}
                  {deletingMember.category}
                </p>
              </div>
            </div>

            <Textarea
              label="Reason for Deletion *"
              value={deletionReason}
              onChange={(e) => {
                setDeletionReason(e.target.value);
                if (deletionErrors.deletion_reason) {
                  setDeletionErrors((prev) => {
                    const next = { ...prev };
                    delete next.deletion_reason;
                    return next;
                  });
                }
              }}
              placeholder="Enter the reason for deleting this shareholder..."
              rows={3}
              error={deletionErrors.deletion_reason}
              required
            />

            <DocumentUpload
              label="Supporting Document *"
              onUploadComplete={(documentId, documentUrl) => {
                setDeletionDocumentId(documentId);
                setDeletionDocumentUrl(documentUrl || "");
                if (deletionErrors.supporting_document) {
                  setDeletionErrors((prev) => {
                    const next = { ...prev };
                    delete next.supporting_document;
                    return next;
                  });
                }
              }}
              onUploadCancel={() => {
                setDeletionDocumentId("");
                setDeletionDocumentUrl("");
              }}
              existingDocument={
                deletionDocumentId
                  ? { id: deletionDocumentId, url: deletionDocumentUrl }
                  : undefined
              }
              error={deletionErrors.supporting_document}
              required
            />

            <p className="text-sm text-gray-600">
              Reason and supporting document will be saved with this meeting record.
              My Society updates after this meeting is approved.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={resetDeletionDialog}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteMember}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Shareholder
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
