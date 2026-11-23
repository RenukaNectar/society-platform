import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { AnnualGeneralMeeting } from "../../types";
import { getAnnualGeneralMeetings } from "../../lib/data/annualGeneralMeetings/api";
import AnnualGeneralMeetingTableColumns from "../../hooks/annualGeneralMeeting/useAnnualGeneralMeetingTableColumns";
import { Plus, FileText, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Pagination } from "../../components/layout/Pagination";
// import { Act } from "../../components/permission/Permission";
import { getCurrentUserSociety } from "../../lib/data/societies/api";
import CertificateIssuedGuard from "../../components/guard/CertificateIssuedGuard";
import { ExportUsersReport } from "../exportReports/export";
import ActionPermissionGuard from "../../components/guard/ActionPermissionGuard";
import { useAgmCalendarYearEligibility } from "../../hooks/annualGeneralMeeting/useAgmCalendarYearEligibility";
import {
  getStatusBadgeClass,
} from "../../components/details/AnnualGeneralMeetingDetails";
import { formatStatusTitleForDisplay } from "../../utils/userFacingWorkflowCopy";
import { IssuedAgmProceedingsDocumentActions } from "../../components/meeting/IssuedAgmProceedingsDocumentActions";
import { openDocument } from "../../utils/download";
import { handleViewPdf } from "../../utils/viewpdf";

export const AnnualGeneralMeetingModule = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [meetings, setMeetings] = useState<AnnualGeneralMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const [societyStatusKey, setSocietyStatusKey] = useState<string | null>(null);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const agmYearEligibility = useAgmCalendarYearEligibility(societyId);

  useEffect(() => {
    const loadAuthUser = async () => {
      try {
        setAuthLoading(true);
        const response = await getCurrentUserSociety();

        const statusKey = response?.society?.status?.key || null;
        setSocietyStatusKey(statusKey);
        setSocietyId(response?.society?.id || null);
      } catch (error) {
        console.error("Failed to load auth user", error);
      } finally {
        setAuthLoading(false);
      }
    };

    loadAuthUser();
  }, []);

  // Load meetings data
  useEffect(() => {
    loadMeetings();
  }, [pagination.currentPage]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await getAnnualGeneralMeetings({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: undefined,
        society_id: undefined,
      });

      if (response.data) {
        setMeetings(response.data.meetings || []);
        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalPages: response.data?.pagination?.totalPages || 1,
            total: response.data?.pagination?.total || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading meetings:", error);
      toast.error("Failed to load Annual General Meetings");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleAddNew = () => {
    navigate("/annual-general-meeting/new");
  };

  const handleView = (meeting: AnnualGeneralMeeting) => {
    navigate(`/annual-general-meeting/${meeting.id}`);
  };

  const viewProceedingsDocument = async (url: string) => {
    await handleViewPdf(url, token || "");
  };

  const downloadProceedingsDocument = async (url: string) => {
    await openDocument(url, token || "");
  };

  const hasIssuedProceedings = (meeting: AnnualGeneralMeeting) =>
    Boolean(
      meeting.issuedProceedingsDocument?.url ||
        meeting.issued_proceedings_document_id,
    );

  const isApprovedAgm = (meeting: AnnualGeneralMeeting) =>
    meeting.statusDetails?.key === "approved" ||
    meeting.status?.key === "approved";

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-4">
        <div className="space-y-3">
          {!agmYearEligibility.loading && !agmYearEligibility.canCreate && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              An AGM has already been recorded for {agmYearEligibility.calendarYear}.
              Only one AGM is allowed per calendar year (1 January to 31 December).
            </p>
          )}
          <CertificateIssuedGuard>
            <ActionPermissionGuard resource="agm" action="create">
              <Button
                onClick={handleAddNew}
                className="flex items-center gap-2"
                disabled={
                  agmYearEligibility.loading || !agmYearEligibility.canCreate
                }
              >
                <Plus className="h-4 w-4" />
                Add New Meeting
              </Button>
            </ActionPermissionGuard>
          </CertificateIssuedGuard>
        </div>

        {/* <ExportUsersReport exportModule="agm" searchTerm="" filters={{}} /> */}
      </div>

      {/* Meetings Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={`bg-gray-50 ${mode === "dark" ? "bg-gray-900" : ""}`}
            >
              <AnnualGeneralMeetingTableColumns theme={mode} />
            </thead>
            <tbody
              className={`divide-y divide-gray-200 ${mode === "dark" ? "divide-gray-700" : ""}`}
            >
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p
                        className={`text-lg font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Loading meetings...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p
                        className={`text-lg font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        No meetings found
                      </p>
                      <p
                        className={`text-sm ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        No Annual General Meetings match your current search
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                meetings.map((meeting) => (
                  <tr
                    key={meeting.id}
                    className={`hover:bg-gray-50 ${mode === "dark" ? "hover:bg-gray-800" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {meeting.society_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {meeting.meeting_date
                          ? moment(meeting.meeting_date).format(
                              "MMM DD, YYYY HH:mm",
                            )
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {meeting.chairman_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {meeting.total_shareholders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {meeting.attended_shareholders || 0}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          meeting.statusDetails?.key ||
                            meeting.status?.key ||
                            "submitted",
                        )}`}
                      >
                        {formatStatusTitleForDisplay(
                          meeting.statusDetails?.title ||
                            meeting.status?.title ||
                            "Submitted",
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {meeting.issuedProceedingsDocument?.url ? (
                        <IssuedAgmProceedingsDocumentActions
                          url={meeting.issuedProceedingsDocument.url}
                          onView={viewProceedingsDocument}
                          onDownload={downloadProceedingsDocument}
                        />
                      ) : hasIssuedProceedings(meeting) ? (
                        <span
                          className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Pending issuance
                        </span>
                      ) : isApprovedAgm(meeting) ? (
                        <span
                          className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Pending issuance
                        </span>
                      ) : (
                        <span
                          className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${mode === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {(meeting as any).creator?.first_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(meeting)}
                          className={
                            mode === "dark"
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-900"
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          pagination={{
            total: pagination.total,
            limit: pagination.limit,
            from: (pagination.currentPage - 1) * pagination.limit + 1,
            to: Math.min(
              pagination.currentPage * pagination.limit,
              pagination.total,
            ),
          }}
          currentPage={pagination.currentPage}
          onPageChange={handlePageChange}
          theme={mode}
        />
      )}
    </div>
  );
};
