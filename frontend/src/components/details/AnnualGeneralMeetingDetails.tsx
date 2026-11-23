import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  AlertCircle,
  Calendar,
  Users,
  User,
  FileText,
  Building,
  Eye,
  Download,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnnualGeneralMeetingById } from "../../lib/data/annualGeneralMeetings/api";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import moment from "moment";
import { handleViewPdf } from "../../utils/viewpdf";
import { download, openDocument } from "../../utils/download";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";
import { IssuedAgmProceedingsCard } from "../meeting/IssuedAgmProceedingsCard";
import { MeetingElectedBodDetailsSection } from "../meeting/MeetingElectedBodDetailsSection";
import { DeletedShareholdersSection } from "../meeting/DeletedShareholdersSection";

type AnnualGeneralMeetingDetailsProps = {
  meeting?: any;
  showElectedMembers?: boolean;
  electedMembersTitle?: string;
};

export const getStatusBadgeClass = (statusKey: string) => {
  switch (statusKey) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "forwarded":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-300";
    case "approved":
      return "bg-green-100 text-green-800 border border-green-300";
    case "certificate_issued":
      return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};

export const AnnualGeneralMeetingDetails: React.FC<
  AnnualGeneralMeetingDetailsProps
> = ({ meeting: meetingProp, showElectedMembers = true, electedMembersTitle }) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(meetingProp || null);
  const [loading, setLoading] = useState(!meetingProp);

  const loadMeeting = async () => {
    if (!id) {
      toast.error("Meeting ID not found");
      navigate("/annual-general-meeting");
      return;
    }

    try {
      setLoading(true);
      const response = await getAnnualGeneralMeetingById(id);
      if (response.data) {
        setMeeting(response.data);
      } else {
        toast.error("Meeting not found");
        navigate("/annual-general-meeting");
      }
    } catch (error) {
      console.error("Error loading meeting:", error);
      toast.error("Failed to load meeting details");
      navigate("/annual-general-meeting");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meetingProp) {
      setMeeting(meetingProp);
      setLoading(false);
      return;
    }
    loadMeeting();
  }, [id, meetingProp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2
          className={`text-xl font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-2`}
        >
          Meeting Not Found
        </h2>
        <p
          className={`text-sm ${mode === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}
        >
          The requested Annual General Meeting could not be found.
        </p>
        <Button onClick={() => navigate("/annual-general-meeting")}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  const calculateAttendancePercentage = (attended: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((attended / total) * 100)}%`;
  };

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || "");
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string) => {
    download(url, token || "");
  };

  const viewDocument = (url: string) => {
    openDocument(url, token || "");
  };

  const electedMembers: ElectedBodMember[] =
    meeting.elected_bod_members || [];

  const createdAtValue =
    (meeting as any)?.created_at ||
    (meeting as any)?.createdAt ||
    (meeting as any)?.created_date ||
    null;
  const updatedAtValue =
    (meeting as any)?.updated_at ||
    (meeting as any)?.updatedAt ||
    (meeting as any)?.updated_date ||
    null;

  return (
    <div className="space-y-6">
      {/* Meeting Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              {/* LEFT: Title + Role : Status */}
              <div className="flex items-center gap-3">
                <h3
                  className={`text-lg font-semibold flex items-center ${mode === "dark" ? "text-white" : "text-gray-900"
                    }`}
                >
                  <Building className="h-5 w-5 mr-2 text-indigo-600" />
                  Basic Information
                </h3>

                {meeting?.statusDetails && (
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full whitespace-normal max-w-xl ${getStatusBadgeClass(
                      meeting.statusDetails.key,
                    )}`}
                  >
                    {getWorkflowMovementStatusLabel(meeting)}
                  </span>
                )}
              </div>

              {/* RIGHT: Active / Inactive
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(`/history/annual-general-meeting/${meeting.id}`, {
                      state: {
                        societyName: meeting.society_name,
                      },
                    })
                  }
                >
                  View Full History
                </Button>
              </div> */}
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Society Name
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {meeting.society_name || "-"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Chairman Name
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {meeting.chairman_name || "-"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Meeting Date
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1 flex items-center`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {meeting.meeting_date
                    ? moment(meeting.meeting_date).format(
                      "MMMM DD, YYYY [at] HH:mm",
                    )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Information */}
        <Card>
          <div className="p-6">
            <h3
              className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
            >
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Attendance Information
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Total Shareholders
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {meeting.total_shareholders || 0}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Attended Shareholders
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {meeting.attended_shareholders || 0}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Attendance Percentage
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {calculateAttendancePercentage(
                    meeting.attended_shareholders || 0,
                    meeting.total_shareholders || 0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Documents */}
        <Card>
          <div className="p-6">
            <h3
              className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
            >
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              Additional Documents
            </h3>
            <div className="space-y-4">
              {/* Minutes of Meeting */}
              {meeting.minutesOfMeeting && meeting.minutesOfMeeting.url ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p
                      className={`text-sm font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Minutes of Meeting
                    </p>
                    <p
                      className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {meeting.minutesOfMeeting.file_name || "Minutes Document"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDocument(meeting.minutesOfMeeting.url)}
                      className={
                        mode === "dark"
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-900"
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDownloadPdf(meeting.minutesOfMeeting.url)
                      }
                      className={
                        mode === "dark"
                          ? "text-green-400 hover:text-green-300"
                          : "text-green-600 hover:text-green-900"
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-4 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No minutes of meeting uploaded</p>
                </div>
              )}

              {/* Notice */}
              {meeting.notice && meeting.notice.url ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p
                      className={`text-sm font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Notice
                    </p>
                    <p
                      className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {meeting.notice.file_name || "Notice Document"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDocument(meeting.notice.url)}
                      className={
                        mode === "dark"
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-900"
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(meeting.notice.url)}
                      className={
                        mode === "dark"
                          ? "text-green-400 hover:text-green-300"
                          : "text-green-600 hover:text-green-900"
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-4 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notice uploaded</p>
                </div>
              )}

              {/* Attendance Sheet */}
              {meeting.attendanceSheet && meeting.attendanceSheet.url ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p
                      className={`text-sm font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Attendance Sheet
                    </p>
                    <p
                      className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {meeting.attendanceSheet.file_name || "Attendance Sheet"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDocument(meeting.attendanceSheet.url)}
                      className={
                        mode === "dark"
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-900"
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDownloadPdf(meeting.attendanceSheet.url)
                      }
                      className={
                        mode === "dark"
                          ? "text-green-400 hover:text-green-300"
                          : "text-green-600 hover:text-green-900"
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-4 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance sheet uploaded</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <IssuedAgmProceedingsCard
          url={meeting.issuedProceedingsDocument?.url}
          hasDocumentReference={Boolean(meeting.issued_proceedings_document_id)}
          darkMode={mode === "dark"}
          onView={viewDocument}
          onDownload={handleDownloadPdf}
        />

        {/* Additional Information */}
        {meeting.comments && (
          <Card>
            <div className="p-6">
              <h3
                className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
              >
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Additional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Comments
                  </label>
                  <div
                    className={`mt-2 p-4  rounded-lg border border-gray-700`}
                  >
                    <p
                      className={`text-sm whitespace-pre-wrap ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      {meeting.comments}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Administrative Information */}
        <Card>
          <div className="p-6">
            <h3
              className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
            >
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Administrative
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Created At
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {createdAtValue
                    ? moment(createdAtValue).format(
                      "MMMM DD, YYYY [at] HH:mm",
                    )
                    : "-"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Updated At
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {updatedAtValue
                    ? moment(updatedAtValue).format(
                      "MMMM DD, YYYY [at] HH:mm",
                    )
                    : "-"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  Created By
                </label>
                <p
                  className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"} mt-1 flex items-center`}
                >
                  <User className="h-4 w-4 mr-2 " />
                  {(meeting as any).creator?.first_name || "-"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3
              className={`text-lg font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
            >
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              RCS Observations
            </h3>
            <div className="space-y-4">
              {/* Minutes of Meeting */}
            
              {/* Notice */}
              {(meeting?.byeLawsMedia && meeting?.byeLawsMedia?.url) ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p
                      className={`text-sm font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      RCS Observations
                    </p>
                    <p
                      className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {meeting?.byeLawsMedia?.file_name || "RCS Observations Document"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDocument(meeting?.byeLawsMedia?.url)}
                      className={
                        mode === "dark"
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-900"
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(meeting?.byeLawsMedia?.url)}
                      className={
                        mode === "dark"
                          ? "text-green-400 hover:text-green-300"
                          : "text-green-600 hover:text-green-900"
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-4 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No RCS Observations uploaded</p>
                </div>
              )}

              {/* Attendance Sheet */}
           
            </div>
          </div>
          
        </Card>
    
      </div>
      {showElectedMembers && (
        <MeetingElectedBodDetailsSection
          members={electedMembers}
          title={electedMembersTitle || "Elected BOD Members (AGM Resolution)"}
        />
      )}
      <DeletedShareholdersSection
        deletedMembers={meeting?.deleted_members}
        handleDownloadPdf={(url) => handleDownloadPdf(url)}
      />
    
    </div>
  );
};
