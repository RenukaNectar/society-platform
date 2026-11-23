import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Users } from "lucide-react";
import { RootState } from "../../store";
import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import type { ElectedBodMember } from "../../types";
import {
  isBodBoardMember,
  isClassAShareholder,
  isClassBShareholder,
  isCoOptedBodCategory,
  SHAREHOLDER_CATEGORY,
} from "../../utils/meetingBodMembers";

type MeetingElectedBodDetailsSectionProps = {
  members?: ElectedBodMember[] | null;
  title?: string;
};

const FILTER_BOD = "bod";
const FILTER_CLASS_A = SHAREHOLDER_CATEGORY.CLASS_A;
const FILTER_CLASS_B = SHAREHOLDER_CATEGORY.CLASS_B;
const FILTER_CO_OPTED = SHAREHOLDER_CATEGORY.CO_OPTED;

const FILTER_OPTIONS = [
  { value: FILTER_BOD, label: "BOD Members" },
  { value: FILTER_CLASS_A, label: SHAREHOLDER_CATEGORY.CLASS_A },
  { value: FILTER_CLASS_B, label: SHAREHOLDER_CATEGORY.CLASS_B },
  { value: FILTER_CO_OPTED, label: SHAREHOLDER_CATEGORY.CO_OPTED },
] as const;

const matchesFilter = (member: ElectedBodMember, filter: string) => {
  if (filter === FILTER_BOD) {
    return isBodBoardMember(member);
  }
  if (filter === FILTER_CLASS_A) {
    return isClassAShareholder(member.shareholder_category);
  }
  if (filter === FILTER_CLASS_B) {
    return isClassBShareholder(member.shareholder_category);
  }
  if (filter === FILTER_CO_OPTED) {
    return (
      isBodBoardMember(member) &&
      (isCoOptedBodCategory(member.shareholder_category) ||
        Boolean(member.is_co_opted))
    );
  }
  return false;
};

export const MeetingElectedBodDetailsSection: React.FC<
  MeetingElectedBodDetailsSectionProps
> = ({ members = [], title = "Elected BOD Members" }) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const [selectedCategory, setSelectedCategory] = useState(FILTER_BOD);

  const electedMembers = members || [];
  const filteredMembers = useMemo(
    () => electedMembers.filter((member) => matchesFilter(member, selectedCategory)),
    [electedMembers, selectedCategory],
  );

  const electedWomenCount = filteredMembers.filter(
    (member) => member.gender?.toLowerCase() === "female",
  ).length;

  const showDesignation =
    selectedCategory === FILTER_BOD || selectedCategory === FILTER_CO_OPTED;

  const sectionTitle =
    selectedCategory === FILTER_BOD || selectedCategory === FILTER_CO_OPTED
      ? title
      : selectedCategory === FILTER_CLASS_A
        ? "Class A Shareholders"
        : selectedCategory === FILTER_CLASS_B
          ? "Class B Nominal Shareholders"
          : title;

  return (
    <Card>
      <div className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} flex items-center`}
          >
            <Users className="h-5 w-5 mr-2 text-indigo-600" />
            {sectionTitle}
            <span
              className={`ml-2 text-sm font-normal ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              ({filteredMembers.length} shown)
            </span>
          </h3>

          <div className="w-full md:w-72">
            <Select
              label="Shareholder Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div
            className={`rounded-md border px-3 py-2 text-sm ${mode === "dark" ? "border-gray-600 text-gray-200" : "text-gray-700"}`}
          >
            Selected:{" "}
            <span className="font-semibold">{filteredMembers.length}</span>
          </div>
          <div
            className={`rounded-md border px-3 py-2 text-sm ${mode === "dark" ? "border-gray-600 text-gray-200" : "text-gray-700"}`}
          >
            Women: <span className="font-semibold">{electedWomenCount}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredMembers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${mode === "dark" ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                >
                  <th className="py-3 text-left font-medium">S.No.</th>
                  <th className="py-3 text-left font-medium">Name</th>
                  {showDesignation && (
                    <th className="py-3 text-left font-medium">Designation</th>
                  )}
                  <th className="py-3 text-left font-medium">Gender</th>
                  <th className="py-3 text-left font-medium">Category</th>
                  <th className="py-3 text-left font-medium">Shareholder Category</th>
                  <th className="py-3 text-left font-medium">Mobile</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.member_id || `${member.name}-${index}`}
                    className={`border-b ${mode === "dark" ? "border-gray-700" : "border-gray-100"}`}
                  >
                    <td
                      className={`py-3 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {index + 1}
                    </td>
                    <td
                      className={`py-3 font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      {member.name}
                    </td>
                    {showDesignation && (
                      <td
                        className={`py-3 capitalize ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {member.designation || "-"}
                      </td>
                    )}
                    <td
                      className={`py-3 capitalize ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {member.gender || "-"}
                    </td>
                    <td
                      className={`py-3 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {member.category || "-"}
                    </td>
                    <td
                      className={`py-3 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {member.shareholder_category ||
                        (member.is_co_opted ? SHAREHOLDER_CATEGORY.CO_OPTED : "-")}
                    </td>
                    <td
                      className={`py-3 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {member.mobile || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p
              className={`text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              {electedMembers.length === 0
                ? "No elected BOD members recorded for this meeting."
                : "No members found for the selected shareholder category."}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
