import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { BodMeeting } from "../../types";
import { getBodMeetings } from "../../lib/data/bodMeetings/api";
import BodMeetingTableColumns from "../../hooks/bodMeeting/useBodMeetingTableColumns";
import { Plus, FileText, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Pagination } from "../../components/layout/Pagination";
import CertificateIssuedGuard from "../../components/guard/CertificateIssuedGuard";
import ActionPermissionGuard from "../../components/guard/ActionPermissionGuard";

export const BodMeetingModule = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const permissions = useSelector((state: RootState) => state.permissions.permissions);
  const [meetings, setMeetings] = useState<BodMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  useEffect(() => {
    loadMeetings();
  }, [pagination.currentPage]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await getBodMeetings({
        page: pagination.currentPage,
        limit: pagination.limit,
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
      console.error("Error loading BOD meetings:", error);
      toast.error("Failed to load BOD Meetings");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const normalizedRole = typeof user?.role === "string" ? user.role.toLowerCase() : "";
  const isApplicant = normalizedRole === "applicant";
  const hasCreatePermission = permissions.some(
    (p) => p.action === "create" && p.resource === "bod",
  );
  // BOD meeting creation is a primary applicant flow after AGM/BOD readiness.
  const canCreateBodMeeting = hasCreatePermission || isApplicant;

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
        <CertificateIssuedGuard>
          {canCreateBodMeeting ? (
            <Button
              onClick={() => navigate("/board-of-directors/meetings/new")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New BOD Meeting
            </Button>
          ) : (
            <ActionPermissionGuard resource="bod" action="create">
              <Button
                onClick={() => navigate("/board-of-directors/meetings/new")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New BOD Meeting
              </Button>
            </ActionPermissionGuard>
          )}
        </CertificateIssuedGuard>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode === "dark" ? "bg-gray-900" : ""}`}>
              <BodMeetingTableColumns theme={mode} />
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode === "dark" ? "divide-gray-700" : ""}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-5 text-center">Loading meetings...</td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className={`text-lg font-medium ${mode === "dark" ? "text-white" : "text-gray-900"}`}>
                        No meetings found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                meetings.map((meeting) => (
                  <tr key={meeting.id} className={`hover:bg-gray-50 ${mode === "dark" ? "hover:bg-gray-800" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.society_name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {meeting.meeting_date ? moment(meeting.meeting_date).format("MMM DD, YYYY HH:mm") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.chairman_name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.total_shareholders || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.attended_shareholders || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(meeting as any).creator?.first_name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/board-of-directors/meetings/${meeting.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination.total > 0 && (
        <Pagination
          pagination={{
            total: pagination.total,
            limit: pagination.limit,
            from: (pagination.currentPage - 1) * pagination.limit + 1,
            to: Math.min(pagination.currentPage * pagination.limit, pagination.total),
          }}
          currentPage={pagination.currentPage}
          onPageChange={handlePageChange}
          theme={mode}
        />
      )}
    </div>
  );
};
