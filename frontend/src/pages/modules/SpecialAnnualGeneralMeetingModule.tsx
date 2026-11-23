import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { SpecialAnnualGeneralMeeting } from '../../types';

import { getSpecialAnnualGeneralMeetings } from '../../lib/data/specialAnnualGeneralMeetings/api';
import { Plus, FileText, Calendar, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { Pagination } from '../../components/layout/Pagination';
import { getStatusBadgeClass } from '../../components/details/AnnualGeneralMeetingDetails';
import { formatStatusTitleForDisplay } from '../../utils/userFacingWorkflowCopy';

const getMeetingStatusKey = (meeting: any): string =>
  meeting?.statusDetails?.key ||
  meeting?.workflowStatus?.currentStatus?.key ||
  meeting?.status ||
  'submitted';

const getMeetingStatusTitle = (meeting: any): string =>
  formatStatusTitleForDisplay(
    meeting?.statusDetails?.title ||
      meeting?.workflowStatus?.current?.approvalStatus?.title ||
      meeting?.workflowStatus?.current?.approvalStatus?.name ||
      meeting?.workflowStatus?.currentStatus?.title ||
      getMeetingStatusKey(meeting),
  );

export const SpecialAnnualGeneralMeetingModule = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [meetings, setMeetings] = useState<SpecialAnnualGeneralMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Load meetings data
  useEffect(() => {
    loadMeetings();
  }, [pagination.currentPage]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await getSpecialAnnualGeneralMeetings({
        page: pagination.currentPage,
        limit: pagination.limit
      });
      
      if (response.data) {
        setMeetings(response.data.meetings || []);
        if (response.data.pagination) {
          const paginationData = response.data.pagination as {
            totalPages?: number;
            total?: number;
            totalItems?: number;
          };
          setPagination(prev => ({
            ...prev,
            totalPages: paginationData.totalPages || 1,
            total: paginationData.total ?? paginationData.totalItems ?? 0,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading special annual general meetings:', error);
      toast.error('Failed to load Special Annual General Meetings');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };



  const handleAddNew = () => {
    navigate('/special-annual-general-meeting/new');
  };

  const isApplicant = String((user as any)?.role || '').toLowerCase() === 'applicant';

  const hasInProgressSgbm = meetings.some((meeting: any) => {
    const rawStatus = String(
      meeting?.workflowStatus?.current?.approvalStatus?.key ||
      meeting?.statusDetails?.key ||
      meeting?.status ||
      ''
    );
    const normalizedStatus = rawStatus.toLowerCase().trim().replace(/\s+/g, '_');
    return ['submitted', 'forwarded'].includes(normalizedStatus);
  });

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 mt-4">
        {isApplicant && hasInProgressSgbm && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            You already have a Special General Body Meeting in progress. Complete or resolve it
            before creating a new one.
          </p>
        )}
        {isApplicant && !hasInProgressSgbm && (
          <Button onClick={handleAddNew} className="flex items-center gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Add New Special General Body Meeting
          </Button>
        )}
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Loading meetings...</p>
          </div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-64">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">No meetings found</p>
          <p className="text-sm text-gray-600">No Special General Body Meetings available</p>
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                    Meeting Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                    Society Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${mode === 'dark' ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}>
                          <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${mode === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {meeting.meeting_date ? moment(meeting.meeting_date).format('MMM DD, YYYY') : '-'}
                          </p>
                          <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {meeting.meeting_date ? moment(meeting.meeting_date).format('HH:mm') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${mode === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {meeting.society_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          getMeetingStatusKey(meeting),
                        )}`}
                      >
                        {getMeetingStatusTitle(meeting)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/special-annual-general-meeting/${meeting.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          pagination={{
            total: pagination.total,
            limit: pagination.limit,
            from: ((pagination.currentPage - 1) * pagination.limit) + 1,
            to: Math.min(pagination.currentPage * pagination.limit, pagination.total)
          }}
          currentPage={pagination.currentPage}
          onPageChange={handlePageChange}
          theme={mode}
        />
      )}

    </div>
  );
};