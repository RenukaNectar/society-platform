import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Card } from "../../components/ui/Card";
import type {
  AnnualGeneralMeetingForm,
  DeletedAmendmentMember,
  ElectedBodMember,
  Member,
} from "../../types";
import {
  createAnnualGeneralMeeting,
  getAnnualGeneralMeetingById,
  getAnnualGeneralMeetings,
  resubmitAnnualGeneralMeeting,
} from "../../lib/data/annualGeneralMeetings/api";
import { getMySociety } from "../../lib/data/users/api";
import { toast } from "react-hot-toast";
import {
  Save,
  Building,
  Calendar,
  Users,
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { DocumentUpload } from "../../components/ui/DocumentUpload";
import { useAgmCalendarYearEligibility } from "../../hooks/annualGeneralMeeting/useAgmCalendarYearEligibility";
import {
  MeetingBodMembersSection,
} from "../../components/meeting/MeetingBodMembersSection";
import {
  buildElectedBodMembersPayload,
  getMeetingMemberKey,
  splitElectedMembersForForm,
} from "../../utils/meetingBodMembers";

const RESUBMIT_ALLOWED_STATUS_KEYS = ["rejected", "reverted", "resubmit"] as const;

/** Local `YYYY-MM-DDTHH:mm` for datetime-local max (avoids UTC shift from toISOString). */
const getLocalDateTimeMax = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const canCorrectAndResubmitAgm = (statusKey?: string | null) =>
  Boolean(
    statusKey &&
      RESUBMIT_ALLOWED_STATUS_KEYS.includes(
        statusKey as (typeof RESUBMIT_ALLOWED_STATUS_KEYS)[number],
      ),
  );

export const AnnualGeneralMeetingFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mode } = useSelector((state: RootState) => state.theme);
  const isEditMode = Boolean(id);

  const [userSociety, setUserSociety] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AnnualGeneralMeetingForm>({
    society_id: "",
    society_name: "",
    meeting_date: "",
    chairman_name: "",
    total_shareholders: 0,
    attended_shareholders: 0,
    media_id: "",
    minutes_of_meeting_id: "",
    notice_id: "",
    attendance_sheet_id: "",
    comments: "",
    declaration_accepted: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AnnualGeneralMeetingForm, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubmitMode, setIsResubmitMode] = useState(false);
  const [selectedElectedMembers, setSelectedElectedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const [addedMembers, setAddedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const [deletedMembers, setDeletedMembers] = useState<DeletedAmendmentMember[]>(
    [],
  );
  const [pendingElectedMembers, setPendingElectedMembers] = useState<
    ElectedBodMember[] | null
  >(null);
  const hasPrefilledBod = useRef(false);
  const [members, setMembers] = useState<Member[]>([]);

  const meetingCalendarYear = formData.meeting_date
    ? new Date(formData.meeting_date).getFullYear()
    : new Date().getFullYear();

  const agmYearEligibility = useAgmCalendarYearEligibility(
    userSociety?.data?.society?.id,
    meetingCalendarYear,
  );

  // Load user's society information
  useEffect(() => {
    const loadUserSociety = async () => {
      try {
        setLoading(true);
        const society = await getMySociety();
        if (society) {
          setUserSociety(society);
          setFormData((prev) => ({
            ...prev,
            society_id: society.data.society.id,
            society_name:
              society.data.society.cooperative_society_name ||
              society.data.society.name,
          }));

          setMembers(society?.data?.members || []);
        }
      } catch (error) {
        console.error("Error loading user society:", error);
        toast.error("Failed to load society information");
      } finally {
        setLoading(false);
      }
    };

    loadUserSociety();
  }, []);

  useEffect(() => {
    const societyId = userSociety?.data?.society?.id;
    if (isEditMode || !societyId || hasPrefilledBod.current) return;

    const prefillFromMembers = (sourceMembers: Member[]) => {
      const bodMembers = sourceMembers.filter(
        (member) => member.is_bod,
      );
      if (bodMembers.length === 0) return false;

      const record: Record<string, ElectedBodMember> = {};
      bodMembers.forEach((member, index) => {
        const key = getMeetingMemberKey(member, index);
        record[key] = {
          member_id: member.id,
          name: member.name,
          designation: member.designation || "Other Board Member",
          gender: member.gender,
          category: member.category,
          mobile: member.mobile,
          is_co_opted: Boolean(member.is_co_opted),
          is_selected_for_bod: true,
        };
      });
      setSelectedElectedMembers(record);
      return true;
    };

    (async () => {
      try {
        const response = await getAnnualGeneralMeetings({
          society_id: societyId,
          page: 1,
          limit: 20,
        });
        const approvedWithBod = (response.data?.meetings || [])
          .filter(
            (meeting) =>
              meeting.statusDetails?.key === "approved" &&
              Array.isArray(meeting.elected_bod_members) &&
              meeting.elected_bod_members.length > 0,
          )
          .sort(
            (a, b) =>
              new Date(b.meeting_date).getTime() -
              new Date(a.meeting_date).getTime(),
          );

        const latest = approvedWithBod[0];
        if (latest?.elected_bod_members?.length) {
          const { selected, added } = splitElectedMembersForForm(
            latest.elected_bod_members,
            members,
          );
          setSelectedElectedMembers(selected);
          setAddedMembers(added);
          hasPrefilledBod.current = true;
          return;
        }

        if (prefillFromMembers(members)) {
          hasPrefilledBod.current = true;
        }
      } catch (error) {
        console.error("Failed to prefill BOD members for AGM", error);
        if (prefillFromMembers(members)) {
          hasPrefilledBod.current = true;
        }
      }
    })();
  }, [userSociety, members, isEditMode]);

  // Load meeting data for editing
  useEffect(() => {
    if (isEditMode && id) {
      const loadMeetingData = async () => {
        try {
          setLoading(true);
          const response = await getAnnualGeneralMeetingById(id);
          if (response.data) {
            const meeting = response.data;
            const statusKey =
              meeting.statusDetails?.key || meeting.status?.key || null;

            if (!canCorrectAndResubmitAgm(statusKey)) {
              toast.error(
                "This AGM cannot be edited. Correction is only available when returned for rectification.",
              );
              navigate(`/annual-general-meeting/${id}`);
              return;
            }

            setIsResubmitMode(true);
            setFormData({
              society_id: meeting.society_id || "",
              society_name: meeting.society_name || "",
              meeting_date: meeting.meeting_date || "",
              chairman_name: meeting.chairman_name || "",
              total_shareholders: meeting.total_shareholders || 0,
              attended_shareholders: meeting.attended_shareholders || 0,
              media_id: meeting.media_id || "",
              minutes_of_meeting_id: meeting.minutes_of_meeting_id || "",
              notice_id: meeting.notice_id || "",
              attendance_sheet_id: meeting.attendance_sheet_id || "",
              comments: meeting.comments || "",
              elected_bod_members: meeting.elected_bod_members || [],
              declaration_accepted: true, // Default to true for editing
            });

            if (Array.isArray(meeting.deleted_members)) {
              setDeletedMembers(meeting.deleted_members);
            }

            const { selected, added } = splitElectedMembersForForm(
              meeting.elected_bod_members || [],
              members,
            );
            if (members.length > 0) {
              setSelectedElectedMembers(selected);
              setAddedMembers(added);
              hasPrefilledBod.current = true;
            } else {
              setPendingElectedMembers(meeting.elected_bod_members || []);
            }

          }
        } catch (error) {
          console.error("Error loading meeting data:", error);
          toast.error("Failed to load meeting data");
          navigate("/annual-general-meeting");
        } finally {
          setLoading(false);
        }
      };

      loadMeetingData();
    }
  }, [isEditMode, id, navigate, members]);

  useEffect(() => {
    if (
      !pendingElectedMembers?.length ||
      members.length === 0 ||
      hasPrefilledBod.current
    ) {
      return;
    }

    const { selected, added } = splitElectedMembersForForm(
      pendingElectedMembers,
      members,
    );
    setSelectedElectedMembers(selected);
    setAddedMembers(added);
    hasPrefilledBod.current = true;
    setPendingElectedMembers(null);
  }, [pendingElectedMembers, members]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof AnnualGeneralMeetingForm]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleUploadComplete = (documentId: string) => {
    setFormData((prev) => ({
      ...prev,
      media_id: documentId,
    }));
  };

  const handleUploadCancel = () => {
    setFormData((prev) => ({
      ...prev,
      media_id: "",
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AnnualGeneralMeetingForm, string>> =
      {};

    if (!userSociety?.data?.society?.id) {
      newErrors.society_id = "Society information not available";
    }

    if (!formData.meeting_date) {
      newErrors.meeting_date = "Meeting date is required";
    } else if (new Date(formData.meeting_date).getTime() > Date.now()) {
      newErrors.meeting_date =
        "Meeting date cannot be in the future. Select the date the AGM was actually held.";
    }

    if (formData.total_shareholders <= 0) {
      newErrors.total_shareholders =
        "Total shareholders must be greater than 0";
    }

    if (formData.attended_shareholders <= 0) {
      newErrors.attended_shareholders =
        "Attended shareholders must be greater than 0";
    }

    if (formData.attended_shareholders > formData.total_shareholders) {
      newErrors.attended_shareholders =
        "Attended shareholders cannot exceed total shareholders";
    }

    if (!formData.declaration_accepted) {
      newErrors.declaration_accepted = "You must accept the declaration";
    }

    if (
      !isEditMode &&
      !agmYearEligibility.loading &&
      !agmYearEligibility.canCreate
    ) {
      newErrors.meeting_date = `An AGM has already been recorded for ${agmYearEligibility.calendarYear}. Only one AGM is allowed per calendar year.`;
    }

    const electedPayload = buildElectedBodMembersPayload(
      selectedElectedMembers,
      addedMembers,
      members,
    );
    const totalMembersCount = electedPayload.length;

    if (totalMembersCount < 7) {
      toast.error("A minimum of 7 members is required to submit an AGM.");
      return false;
    }
    if (totalMembersCount > 21) {
      toast.error("A maximum of 21 members can be submitted.");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeEmptyFields = (obj: Record<string, any>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const electedMembers = buildElectedBodMembersPayload(
      selectedElectedMembers,
      addedMembers,
      members,
    );

    setIsSubmitting(true);

    try {
      const rawSubmitData = {
        ...formData,
        elected_bod_members: electedMembers,
        deleted_members: deletedMembers.map(
          ({ supportingDocumentMedia, ...rest }) => rest,
        ),
        society_id: userSociety?.data?.society?.id,
        society_name:
          userSociety?.data?.society?.cooperative_society_name ||
          userSociety?.data?.society?.name,
      };

      const submitData = removeEmptyFields(rawSubmitData);

      const response = isEditMode && id
        ? await resubmitAnnualGeneralMeeting(id, submitData as Partial<AnnualGeneralMeetingForm>)
        : await createAnnualGeneralMeeting(
            submitData as AnnualGeneralMeetingForm,
          );

      if (
        response.success ||
        response.status === 200 ||
        response.status === 201
      ) {
        toast.success(
          response.message ||
            (isResubmitMode
              ? "Annual General Meeting corrected and re-submitted successfully!"
              : isEditMode
                ? "Annual General Meeting updated successfully!"
                : "Annual General Meeting created successfully!"),
        );
        navigate(isResubmitMode && id ? `/annual-general-meeting/${id}` : "/annual-general-meeting");
      } else {
        throw new Error(
          response.message || "Failed to save Annual General Meeting",
        );
      }
    } catch (error: any) {
      console.error("Error saving Annual General Meeting:", error);
      toast.error(error.message || "Failed to save Annual General Meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/annual-general-meeting");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full">
      {/* Header */}

      <form onSubmit={handleSubmit} className="space-y-3 h-full mt-4">
        {isResubmitMode && (
          <Card padding="sm" className="border border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Correction / Re-submit required
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This AGM was returned for rectification. Update the required
                  details—especially the Minutes of Meeting—and re-submit for
                  review.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Society Information */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Building
              className={`h-6 w-6 text-indigo-600 ${mode === "dark" ? "text-indigo-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Society Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Society Registration Number"
              value={userSociety?.data?.society?.registration_number || ""}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Society Name"
              value={
                userSociety?.data?.society?.cooperative_society_name ||
                userSociety?.data?.society?.name ||
                ""
              }
              disabled
              className="bg-gray-50"
            />
          </div>
        </Card>

        {/* Meeting Details */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar
              className={`h-6 w-6 text-green-600 ${mode === "dark" ? "text-green-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Meeting Details
            </h3>
          </div>
          {!isEditMode &&
            !agmYearEligibility.loading &&
            !agmYearEligibility.canCreate && (
              <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                An AGM has already been recorded for {agmYearEligibility.calendarYear}.
                Only one AGM is allowed per calendar year (1 January to 31 December).
              </p>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Meeting Date"
              name="meeting_date"
              type="datetime-local"
              value={formData.meeting_date}
              onChange={handleInputChange}
              error={errors.meeting_date}
              max={getLocalDateTimeMax()}
              required
            />

            <Input
              label="Chairman Name"
              name="chairman_name"
              value={formData.chairman_name}
              onChange={handleInputChange}
              placeholder="Enter chairman name"
            />
          </div>
        </Card>

        {/* Shareholder Information */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Users
              className={`h-6 w-6 text-blue-600 ${mode === "dark" ? "text-blue-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Shareholder Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Shareholders"
              name="total_shareholders"
              type="number"
              value={formData.total_shareholders.toString()}
              onChange={handleInputChange}
              placeholder="Enter total number of shareholders"
              error={errors.total_shareholders}
              required
              min="1"
            />

            <Input
              label="Attended Shareholders"
              name="attended_shareholders"
              type="number"
              value={formData.attended_shareholders.toString()}
              onChange={handleInputChange}
              placeholder="Enter number of shareholders who attended"
              error={errors.attended_shareholders}
              required
              min="1"
              max={formData.total_shareholders}
            />
          </div>
        </Card>

        <MeetingBodMembersSection
          members={members}
          showShareholderCategory
          requireDeletionDetails
          selectedElectedMembers={selectedElectedMembers}
          onSelectedChange={setSelectedElectedMembers}
          addedMembers={addedMembers}
          onAddedMembersChange={setAddedMembers}
          deletedMembers={deletedMembers}
          onDeletedMembersChange={setDeletedMembers}
          title="Elected BOD Members (AGM Resolution)"
          description="Review and select from the current board list. Use Add Shareholder to create new directors — they appear in the Newly Added Members card below. This data syncs to BOD on final approval."
        />

        {/* Meeting Documents */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Upload
              className={`h-6 w-6 text-orange-600 ${mode === "dark" ? "text-orange-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Other Documents
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <DocumentUpload
                label="Other Documents"
                onUploadComplete={(mediaId) => handleUploadComplete(mediaId)}
                onUploadCancel={() => handleUploadCancel()}
                // existingDocument={formData.media_id ? { id: formData.media_id, url: formData.media_id } : undefined}
                // onReplace={(mediaId) => handleUploadComplete(mediaId)}
              />
            </div>
          </div>
        </Card>

        {/* Additional Documents */}
        <Card
          padding="sm"
          className={
            isResubmitMode ? "ring-2 ring-amber-300 border-amber-200" : undefined
          }
        >
          <div className="flex items-center space-x-3 mb-6">
            <FileText
              className={`h-6 w-6 text-purple-600 ${mode === "dark" ? "text-purple-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Additional Documents
            </h3>
          </div>
          {isResubmitMode && (
            <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Please review and upload the corrected Minutes of Meeting before
              re-submitting.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DocumentUpload
                label="Minutes of Meeting"
                onUploadComplete={(mediaId) =>
                  setFormData((prev) => ({
                    ...prev,
                    minutes_of_meeting_id: mediaId,
                  }))
                }
                onUploadCancel={() =>
                  setFormData((prev) => ({
                    ...prev,
                    minutes_of_meeting_id: "",
                  }))
                }
                required={false}
              />
            </div>
            <div className="space-y-2">
              <DocumentUpload
                label="Notice"
                onUploadComplete={(mediaId) =>
                  setFormData((prev) => ({ ...prev, notice_id: mediaId }))
                }
                onUploadCancel={() =>
                  setFormData((prev) => ({ ...prev, notice_id: "" }))
                }
                required={false}
              />
            </div>
            <div className="space-y-2">
              <DocumentUpload
                label="Attendance Sheet"
                onUploadComplete={(mediaId) =>
                  setFormData((prev) => ({
                    ...prev,
                    attendance_sheet_id: mediaId,
                  }))
                }
                onUploadCancel={() =>
                  setFormData((prev) => ({ ...prev, attendance_sheet_id: "" }))
                }
                required={false}
              />
            </div>
          </div>
        </Card>

        {/* Comments */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <FileText
              className={`h-6 w-6 text-indigo-600 ${mode === "dark" ? "text-indigo-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Additional Information
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments || ""}
                onChange={handleInputChange}
                placeholder="Enter any additional comments or notes about the meeting..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Declaration */}
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle
              className={`h-6 w-6 text-purple-600 ${mode === "dark" ? "text-purple-400" : ""}`}
            />
            <h3
              className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}
            >
              Declaration
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                name="declaration_accepted"
                checked={formData.declaration_accepted}
                onChange={handleCheckboxChange}
              />
              <label className="text-sm leading-relaxed">
                I accept the above declaration and confirm that all information
                provided is accurate
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            {errors.declaration_accepted && (
              <p className="text-red-600 text-sm mt-1">
                {errors.declaration_accepted}
              </p>
            )}
          </div>
        </Card>

        {/* Submit Button */}
        <Card padding="sm">
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting
                ? "Submitting..."
                : isResubmitMode
                  ? "Correct & Re-submit"
                  : isEditMode
                    ? "Update Meeting"
                    : "Submit Application"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
