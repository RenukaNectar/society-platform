import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AmendmentFormData } from '../../types';
import { Plus, Search, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import AmendmentTableColumns from '../../hooks/amendment/useAmendmentTableColums';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import { AmendmentForm as AmendmentFormComponent } from '../forms/AmendmentForm';
import {
  getAmendments,
  getAmendmentDetailsByUserId
} from '../../lib/data/amendments/api';
import moment from 'moment';
import { getStatusColor } from '../../utils/getStatusByKey';
import { formatStatusTitleForDisplay } from '../../utils/userFacingWorkflowCopy';
import { Pagination } from '../../components/layout/Pagination';
import { getMySociety } from '../../lib/data/users/api';
import { Select } from '../../components/ui/Select';
import { ExportUsersReport } from '../exportReports/export';
import { isReturnedFileWithApplicant } from '../../lib/workflow/assigneeUsers';

type ViewMode = 'list' | 'add';

/** Final / closed statuses — a new amendment can be created after these. */
const AMENDMENT_CLOSED_STATUS_KEYS = new Set([
  'approved',
  'registrar_approved',
  'rejected',
  'registrar_rejected',
  'arc_rejected',
  'senior_inspector_rejected',
  'deputy_registrar_rejected',
  'field_inspector_rejected',
]);

const getAmendmentStatusKey = (amendment: any): string =>
  String(
    amendment?.status?.key ||
      amendment?.statusDetails?.key ||
      amendment?.workflowStatus?.current?.approvalStatus?.key ||
      ''
  )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const isAmendmentInProcess = (amendment: any): boolean => {
  const key = getAmendmentStatusKey(amendment);
  if (!key) return false;
  return !AMENDMENT_CLOSED_STATUS_KEYS.has(key);
};

export const AmendmentModule: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { statuses } = useSelector((state: RootState) => state.statuses);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [amendments, setAmendments] = useState<any[]>([]);
  const [amendmentForForm, setAmendmentForForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { mode } = useSelector((state: RootState) => state.theme);
  const isApplicant = user?.role === 'applicant';
  const [societyDetails, setSocietyDetails] = useState<any>(null);
  const navigate = useNavigate();

  const { reset } = useForm<AmendmentFormData>();

  const hasInProgressAmendment = useMemo(
    () => amendments.some((amendment) => isAmendmentInProcess(amendment)),
    [amendments]
  );

  const canShowAddButton = useMemo(() => {
    if (!isApplicant) return true;
    const societyReady = societyDetails?.status?.key === 'certificate_issued';
    return societyReady && !hasInProgressAmendment;
  }, [isApplicant, societyDetails, hasInProgressAmendment]);

  const loadAmendments = async (params: any = {}) => {
    setLoading(true);
    try {
      let response: any;

      if (isApplicant) {
        response = await getAmendmentDetailsByUserId(user?.id || '');
        const list = Array.isArray(response) ? response : [];
        setAmendments(list);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: list.length,
          limit: list.length || 10
        });
      } else {
        response = await getAmendments({
          page: pagination.currentPage,
          limit: pagination.limit,
          search: debouncedSearchTerm,
          status: statusFilter,
          ...params
        });
        setAmendments(response.data?.amendments || []);
        setPagination({
          currentPage: response.data?.pagination?.page || 1,
          totalPages: response.data?.pagination?.totalPages || 1,
          total: response.data?.pagination?.total || 0,
          limit: response.data?.pagination?.limit || 10
        });
      }
    } catch (error) {
      // keep silent — empty list shown
    } finally {
      setLoading(false);
    }
  };

  const getSocietyDetails = async () => {
    await getMySociety().then((res: any) => {
      if (res) {
        const societyWithMembers = {
          ...res?.data?.society,
          members: res?.data?.members || []
        };
        setSocietyDetails(societyWithMembers);
      }
    });
  };

  useEffect(() => {
    if (isApplicant) {
      getSocietyDetails();
    }
  }, [isApplicant]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadAmendments();
  }, [pagination.currentPage, debouncedSearchTerm, statusFilter, isApplicant]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const openNewAmendmentForm = () => {
    const draft = amendments.find((item: any) => getAmendmentStatusKey(item) === 'draft');
    setAmendmentForForm(draft || null);
    reset();
    setViewMode('add');
  };

  const openContinueAmendmentForm = (amendment: any) => {
    setAmendmentForForm(amendment);
    setViewMode('add');
  };

  if (isApplicant && viewMode === 'add') {
    if (!societyDetails) {
      return (
        <div className='flex justify-center items-center h-[90vh] bg-white rounded-lg p-4'>
          <div className='flex flex-col items-center justify-center space-y-4'>
            <h1 className='text-2xl font-bold'>No society found</h1>
            <h3>Register your society first</h3>
          </div>
        </div>
      );
    }

    if (societyDetails?.status?.key !== 'certificate_issued') {
      return (
        <div className='flex justify-center items-center h-[90vh] bg-white rounded-lg p-4'>
          <div className='flex flex-col items-center justify-center space-y-4'>
            <h1 className='text-2xl font-bold'>Society is under review</h1>
            <h3>Please wait for the review to be completed</h3>
            <Button variant="outline" onClick={() => setViewMode('list')}>
              Back to List
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        <AmendmentFormComponent
          data={amendmentForForm}
          societyData={societyDetails}
          onSuccess={() => {
            setAmendmentForForm(null);
            setViewMode('list');
            loadAmendments();
          }}
          onCancel={() => {
            setAmendmentForForm(null);
            setViewMode('list');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-3">
        {isApplicant && hasInProgressAmendment && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            You already have an amendment in progress. Complete or resolve it before creating a new one.
          </p>
        )}

        <div className="flex justify-between items-center">
          {!isApplicant && (
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search amendment ID, type, chairperson..."
                icon={<Search className="h-4 w-4 text-gray-400" />}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              />
            </div>
          )}

          {!isApplicant && (
            <div className="flex flex-row gap-4 max-w-md ml-4 justify-end">
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
              >
                <option value="">All Status</option>
                {statuses.map((status: any) => (
                  <option key={status.key} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </Select>
              <ExportUsersReport
                exportModule="amendment"
                searchTerm={searchTerm}
                filters={{ status: statusFilter }}
              />
            </div>
          )}

          {isApplicant ? (
            canShowAddButton ? (
              <Button onClick={openNewAmendmentForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Amendment
              </Button>
            ) : null
          ) : (
            <PermissionGuard permission="canAddAmendment" showAskPermission={false}>
              <Button onClick={openNewAmendmentForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Amendment
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <AmendmentTableColumns theme />
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading amendments...</p>
                    </div>
                  </td>
                </tr>
              ) : amendments.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No amendments found</p>
                      <p className="text-sm">
                        {isApplicant
                          ? 'Create a new amendment to get started'
                          : 'No amendments match your current search'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                amendments.map((amendment) => {
                  const statusKey = getAmendmentStatusKey(amendment);
                  const returnedToApplicant =
                    ['registrar_rejected', 'rejected', 'reverted', 'arc_rejected', 'senior_inspector_rejected'].includes(statusKey) &&
                    isReturnedFileWithApplicant(amendment);
                  const canContinue = isApplicant && (statusKey === 'draft' || returnedToApplicant);

                  return (
                    <tr key={amendment.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {amendment?.society?.cooperative_society_name || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {amendment?.society?.registration_number}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {amendment?.chairperson_name || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {amendment?.chairperson_contact || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {amendment?.general_body_meeting_date
                            ? moment(amendment.general_body_meeting_date).format('DD-MM-YYYY')
                            : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {amendment?.notice_days ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {amendment?.total_members ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {amendment?.quorum_required ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {amendment?.members_present ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium">
                          {amendment?.votes_in_favour ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            amendment?.status?.key || amendment?.status?.title,
                            mode
                          )}`}
                        >
                          {amendment?.status
                            ? formatStatusTitleForDisplay(
                                amendment?.status?.title || amendment?.status?.key
                              )
                            : '-'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {amendment?.created_at
                          ? moment(amendment.created_at).format('MMM DD, YYYY hh:mm a')
                          : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {amendment?.createdByUser
                          ? `${amendment.createdByUser.first_name || ''} ${amendment.createdByUser.last_name || ''}`.trim() ||
                            '-'
                          : '-'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border"
                            onClick={() => navigate(`/amendments/${amendment?.id}`)}
                          >
                            View
                          </Button>
                          {canContinue && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openContinueAmendmentForm(amendment)}
                            >
                              {statusKey === 'draft' ? 'Continue' : 'Re-submit'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isApplicant && (
          <Pagination
            pagination={{
              total: pagination.total,
              limit: pagination.limit,
              from: (pagination.currentPage - 1) * pagination.limit + 1,
              to: Math.min(pagination.currentPage * pagination.limit, pagination.total)
            }}
            currentPage={pagination.currentPage}
            onPageChange={handlePageChange}
            theme={mode}
          />
        )}
      </Card>
    </div>
  );
};
