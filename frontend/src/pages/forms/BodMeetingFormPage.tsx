import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Card } from "../../components/ui/Card";
import { BodMeetingForm } from "../../types";
import { createBodMeeting } from "../../lib/data/bodMeetings/api";
import { getMySociety } from "../../lib/data/users/api";
import { toast } from "react-hot-toast";
import { Save, Building, Calendar, Users, Upload, CheckCircle, FileText } from "lucide-react";
import { DocumentUpload } from "../../components/ui/DocumentUpload";
import type { DeletedAmendmentMember, ElectedBodMember, Member } from "../../types";
import { MeetingBodMembersSection } from "../../components/meeting/MeetingBodMembersSection";
import {
  recordToElectedMembers,
  sanitizeElectedBodMembers,
} from "../../utils/meetingBodMembers";

export const BodMeetingFormPage = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const [userSociety, setUserSociety] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedElectedMembers, setSelectedElectedMembers] = useState<
    Record<string, ElectedBodMember>
  >({});
  const [members, setMembers] = useState<Member[]>([]);
  const [deletedMembers, setDeletedMembers] = useState<DeletedAmendmentMember[]>([]);

  const [formData, setFormData] = useState<BodMeetingForm>({
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

  const validateBodRulesFromMembers = () => {
    if (formData.total_shareholders < 7 || formData.total_shareholders > 21) {
      return "BOD member count must be between 7 and 21";
    }
    return null;
  };

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
              society.data.society.cooperative_society_name || society.data.society.name,
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

  const removeEmptyFields = (obj: Record<string, any>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declaration_accepted) {
      toast.error("Please accept declaration");
      return;
    }
    if (!formData.notice_id || !formData.minutes_of_meeting_id || !formData.attendance_sheet_id) {
      toast.error("Meeting Notice, Minutes and Attendance Sheet are required");
      return;
    }
    const bodRuleError = validateBodRulesFromMembers();
    if (bodRuleError) {
      toast.error(bodRuleError);
      return;
    }

    try {
      setIsSubmitting(true);
      const electedMembers = sanitizeElectedBodMembers(
        recordToElectedMembers(selectedElectedMembers),
      ).map((member) => ({
        ...member,
        // BOD meeting payload: mark all elected members as co-opted (UI does not show this).
        is_co_opted: true,
      }));
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
      const response = await createBodMeeting(
        removeEmptyFields(rawSubmitData) as BodMeetingForm,
      );

      if (response.success || response.status === 200 || response.status === 201) {
        toast.success(response.message || "BOD Meeting created successfully!");
        navigate("/board-of-directors/meetings");
      } else {
        throw new Error(response.message || "Failed to create BOD meeting");
      }
    } catch (error: any) {
      console.error("Error creating BOD meeting:", error);
      toast.error(error.message || "Failed to create BOD meeting");
    } finally {
      setIsSubmitting(false);
    }
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
      <form onSubmit={handleSubmit} className="space-y-3 h-full mt-4">
        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Building className={`h-6 w-6 text-indigo-600 ${mode === "dark" ? "text-indigo-400" : ""}`} />
            <h3 className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}>
              Society Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Society Registration Number" value={userSociety?.data?.society?.registration_number || ""} disabled />
            <Input label="Society Name" value={userSociety?.data?.society?.cooperative_society_name || userSociety?.data?.society?.name || ""} disabled />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className={`h-6 w-6 text-green-600 ${mode === "dark" ? "text-green-400" : ""}`} />
            <h3 className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}>
              BOD Meeting Details
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Meeting Date" name="meeting_date" type="datetime-local" value={formData.meeting_date} onChange={handleInputChange} required />
            <Input label="Chairman Name" name="chairman_name" value={formData.chairman_name} onChange={handleInputChange} />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Users className={`h-6 w-6 text-blue-600 ${mode === "dark" ? "text-blue-400" : ""}`} />
            <h3 className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}>
              BOD Attendance Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Total BOD Members" name="total_shareholders" type="number" value={formData.total_shareholders.toString()} onChange={handleInputChange} required min="7" max="21" />
            <Input label="Attended BOD Members" name="attended_shareholders" type="number" value={formData.attended_shareholders.toString()} onChange={handleInputChange} required min="1" max={formData.total_shareholders} />
          </div>
        </Card>

        <MeetingBodMembersSection
          members={members}
          bodMember={true}
          selectedElectedMembers={selectedElectedMembers}
          onSelectedChange={setSelectedElectedMembers}
          showShareholderCategory
          requireDeletionDetails
          deletedMembers={deletedMembers}
          onDeletedMembersChange={setDeletedMembers}
          title="Added Shareholders"
          description="Add members using Add Shareholder. Delete an existing society shareholder with a reason and supporting document."
        />

        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className={`h-6 w-6 text-orange-600 ${mode === "dark" ? "text-orange-400" : ""}`} />
            <h3 className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}>
              Other Documents
            </h3>
          </div>
          <DocumentUpload
            label="Custom Document (Optional)"
            onUploadComplete={(mediaId) => setFormData((prev) => ({ ...prev, media_id: mediaId }))}
            onUploadCancel={() => setFormData((prev) => ({ ...prev, media_id: "" }))}
            required={false}
          />
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className={`h-6 w-6 text-purple-600 ${mode === "dark" ? "text-purple-400" : ""}`} />
            <h3 className={`text-lg font-semibold text-gray-900 ${mode === "dark" ? "text-gray-100" : ""}`}>
              Checklist Documents
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocumentUpload
              label="Meeting Minutes"
              onUploadComplete={(mediaId) => setFormData((prev) => ({ ...prev, minutes_of_meeting_id: mediaId }))}
              onUploadCancel={() => setFormData((prev) => ({ ...prev, minutes_of_meeting_id: "" }))}
              required
            />
            <DocumentUpload
              label="Meeting Notice"
              onUploadComplete={(mediaId) => setFormData((prev) => ({ ...prev, notice_id: mediaId }))}
              onUploadCancel={() => setFormData((prev) => ({ ...prev, notice_id: "" }))}
              required
            />
            <DocumentUpload
              label="Attendance Sheet"
              onUploadComplete={(mediaId) => setFormData((prev) => ({ ...prev, attendance_sheet_id: mediaId }))}
              onUploadCancel={() => setFormData((prev) => ({ ...prev, attendance_sheet_id: "" }))}
              required
            />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className={`h-6 w-6 text-purple-600 ${mode === "dark" ? "text-purple-400" : ""}`} />
            <Checkbox name="declaration_accepted" checked={formData.declaration_accepted} onChange={handleCheckboxChange} />
            <label className="text-sm leading-relaxed">I confirm that all details provided are accurate</label>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate("/board-of-directors/meetings")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Create Meeting"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
