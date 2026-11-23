import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Calendar, FileText, Users } from "lucide-react";
import { createSpecialAnnualGeneralMeeting } from "../../lib/data/specialAnnualGeneralMeetings/api";
import { getAnnualGeneralMeetings } from "../../lib/data/annualGeneralMeetings/api";
import { getMySociety } from "../../lib/data/users/api";
import { toast } from "react-hot-toast";
import { DocumentUpload } from "../../components/ui/DocumentUpload";
import { Card } from "../../components/ui/Card";
import {
  MeetingBodMembersSection,
} from "../../components/meeting/MeetingBodMembersSection";
import type { DeletedAmendmentMember, ElectedBodMember, Member } from "../../types";
import {
  buildElectedBodMembersPayload,
  getMeetingMemberKey,
  splitElectedMembersForForm,
} from "../../utils/meetingBodMembers";

export const SpecialAnnualGeneralMeetingFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [userSociety, setUserSociety] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedElectedMembers, setSelectedElectedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const [addedMembers, setAddedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const [deletedMembers, setDeletedMembers] = useState<DeletedAmendmentMember[]>(
    [],
  );
  const hasPrefilledBod = useRef(false);
  const [formData, setFormData] = useState({
    meeting_date: "",
    total_shareholders: 0,
    attended_shareholders: 0,
    media_id: "",
    attendance_sheet_id: "",
    minutes_of_meeting_id: "",
    comments: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUserSociety = async () => {
      try {
        setLoading(true);
        const society = await getMySociety();
        if (society) {
          setUserSociety(society);
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
    if (!societyId || hasPrefilledBod.current) return;

    const prefillFromMembers = (sourceMembers: Member[]) => {
      const bodMembers = sourceMembers.filter((member) => member.is_bod);
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
        console.error("Failed to prefill BOD members for SGBM", error);
        if (prefillFromMembers(members)) {
          hasPrefilledBod.current = true;
        }
      }
    })();
  }, [userSociety, members]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meeting_date) {
      newErrors.meeting_date = "Meeting date is required";
    }
    if (!formData.media_id) {
      newErrors.media_id = "Notice document upload is required";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!userSociety?.data?.society?.id) {
      toast.error("Society information not available");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: Record<string, unknown> = {
        society_id: userSociety.data.society.id,
        society_name:
          userSociety.data.society.cooperative_society_name ||
          userSociety.data.society.name,
        meeting_date: formData.meeting_date,
        notice_id: formData.media_id,
        total_shareholders: formData.total_shareholders,
        attended_shareholders: formData.attended_shareholders,
        comments: formData.comments || undefined,
        elected_bod_members: buildElectedBodMembersPayload(
          selectedElectedMembers,
          addedMembers,
          members,
        ),
        deleted_members: deletedMembers.map(
          ({ supportingDocumentMedia, ...rest }) => rest,
        ),
      };

      if (formData.attendance_sheet_id) {
        submitData.attendance_sheet_id = formData.attendance_sheet_id;
      }
      if (formData.minutes_of_meeting_id) {
        submitData.minutes_of_meeting_id = formData.minutes_of_meeting_id;
      }

      const response = await createSpecialAnnualGeneralMeeting(submitData as any);
      if (response.success || response.status === 200 || response.status === 201) {
        toast.success("Special General Body Meeting created successfully!");
        navigate("/special-annual-general-meeting");
      } else {
        throw new Error(
          response.message || "Failed to create Special General Body Meeting",
        );
      }
    } catch (error: any) {
      console.error("Error creating Special General Body Meeting:", error);
      toast.error(error.message || "Failed to create Special General Body Meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-4 pb-8">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Special General Body Meeting
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Society Information
              </h3>
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Meeting Details
              </h3>
              <Input
                label="Meeting Date & Time"
                name="meeting_date"
                type="datetime-local"
                value={formData.meeting_date}
                onChange={handleInputChange}
                error={errors.meeting_date}
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Shareholder Information
              </h3>
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
            </div>

            <MeetingBodMembersSection
              members={members}
              selectedElectedMembers={selectedElectedMembers}
              onSelectedChange={setSelectedElectedMembers}
              addedMembers={addedMembers}
              onAddedMembersChange={setAddedMembers}
              requireDeletionDetails
              deletedMembers={deletedMembers}
              onDeletedMembersChange={setDeletedMembers}
              title="Elected BOD Members (SGBM Resolution)"
              showShareholderCategory
              description="Review and select from the current board list. Use Add Shareholder to create new directors — they appear in the Newly Added Members card below."
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Notice Upload
              </h3>
              <DocumentUpload
                label="Upload Notice Document"
                onUploadComplete={(documentId: string) =>
                  setFormData((prev) => ({ ...prev, media_id: documentId }))
                }
                onUploadCancel={() =>
                  setFormData((prev) => ({ ...prev, media_id: "" }))
                }
                required
              />
              {errors.media_id && (
                <p className="text-red-600 text-sm mt-1">{errors.media_id}</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUpload
                  label="Attendance Sheet"
                  onUploadComplete={(documentId: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      attendance_sheet_id: documentId,
                    }))
                  }
                  onUploadCancel={() =>
                    setFormData((prev) => ({ ...prev, attendance_sheet_id: "" }))
                  }
                  required={false}
                />
                <DocumentUpload
                  label="Minutes of Meeting"
                  onUploadComplete={(documentId: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      minutes_of_meeting_id: documentId,
                    }))
                  }
                  onUploadCancel={() =>
                    setFormData((prev) => ({ ...prev, minutes_of_meeting_id: "" }))
                  }
                  required={false}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="Enter any additional comments or notes about the meeting..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/special-annual-general-meeting")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || loading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Special General Body Meeting"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
