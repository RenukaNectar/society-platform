import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search } from 'lucide-react';
import moment from 'moment';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/layout/Pagination';
import { getMySociety } from '../../lib/data/users/api';
import {
  extractBusinessActivityList,
  getBusinessActivities,
  getBusinessActivitiesBySociety,
} from '../../lib/data/businessActivities/api';
import { getStatusColor } from '../../utils/getStatusByKey';
import { formatStatusTitleForDisplay } from '../../utils/userFacingWorkflowCopy';
import { BusinessActivityForm } from '../forms/BusinessActivityForm';

const APPROVED_STATUS_KEYS = new Set(['approved', 'registrar_approved']);

const statusKeyOf = (item: any) =>
  String(item?.statusDetails?.key || item?.status?.key || item?.workflowStatus?.currentStatus?.key || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const statusTitleOf = (item: any) =>
  formatStatusTitleForDisplay(
    item?.statusDetails?.title || item?.status?.title || statusKeyOf(item) || '-'
  );

export const BusinessActivityModule: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const isCertificateIssued = useSelector((state: RootState) => state.society.isCertificateIssued);
  const isApplicant = user?.role === 'applicant';

  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [society, setSociety] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const formHistoryPushed = useRef(false);

  const closeForm = () => {
    setEditing(null);
    setViewMode('list');
  };

  const leaveForm = () => {
    if (formHistoryPushed.current) {
      formHistoryPushed.current = false;
      window.history.back();
      return;
    }
    closeForm();
  };

  const societyReady =
    isCertificateIssued ||
    statusKeyOf({ status: society?.status, statusDetails: society?.statusDetails }) === 'certificate_issued' ||
    String(society?.status?.key || society?.statusDetails?.key || '') === 'certificate_issued';

  const hasUnapprovedRequest = useMemo(
    () => activities.some((item) => !APPROVED_STATUS_KEYS.has(statusKeyOf(item))),
    [activities]
  );

  const loadActivities = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      if (isApplicant) {
        const societyResponse: any = await getMySociety();
        const societyData = societyResponse?.data?.society || null;
        setSociety(societyData);
        if (!societyData?.id) {
          setActivities([]);
          return;
        }
        const response = await getBusinessActivitiesBySociety(societyData.id, {
          page,
          limit: pagination.limit,
        });
        const { rows, pagination: pageInfo } = extractBusinessActivityList(response);
        setActivities(rows);
        setPagination((prev) => ({
          ...prev,
          currentPage: pageInfo?.currentPage || pageInfo?.page || page,
          totalPages: pageInfo?.totalPages || 1,
          total: pageInfo?.total ?? pageInfo?.totalItems ?? rows.length,
          limit: pageInfo?.limit || pageInfo?.pageSize || prev.limit,
        }));
        return;
      }

      const response = await getBusinessActivities({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
      });
      const { rows, pagination: pageInfo } = extractBusinessActivityList(response);
      setActivities(rows);
      setPagination((prev) => ({
        ...prev,
        currentPage: pageInfo?.currentPage || pageInfo?.page || page,
        totalPages: pageInfo?.totalPages || 1,
        total: pageInfo?.total ?? pageInfo?.totalItems ?? rows.length,
        limit: pageInfo?.limit || pageInfo?.pageSize || prev.limit,
      }));
    } catch (error) {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (viewMode === 'list') {
      loadActivities(pagination.currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApplicant, debouncedSearch, pagination.currentPage, viewMode]);

  useEffect(() => {
    if (viewMode !== 'add') return;
    if (!formHistoryPushed.current) {
      window.history.pushState({ businessActivityForm: true }, '');
      formHistoryPushed.current = true;
    }
    const onPopState = () => {
      formHistoryPushed.current = false;
      setEditing(null);
      setViewMode('list');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [viewMode]);

  if (isApplicant && viewMode === 'add') {
    if (!society) {
      return (
        <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-bold">No society found</h1>
            <h3>Register your society first</h3>
          </div>
        </div>
      );
    }

    if (!societyReady) {
      return (
        <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-bold">Society is under review</h1>
            <h3>Please wait for the review to be completed</h3>
            <Button variant="outline" onClick={leaveForm}>Back to List</Button>
          </div>
        </div>
      );
    }

    return (
      <BusinessActivityForm
        societyId={String(society.id)}
        societyName={society.cooperative_society_name || society.name || ''}
        activityId={editing?.id || null}
        initialSectorId={String(
          editing?.sectorOfOperation?.id ||
            editing?.sector_of_operation ||
            society?.sector_of_operation?.id ||
            society?.sector_of_operation ||
            ''
        )}
        initialAdditionalData={editing?.additional_data ?? society?.additional_data ?? null}
        onCancel={leaveForm}
        onSuccess={() => {
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          leaveForm();
        }}
      />
    );
  }

  if (isApplicant && !loading && society && !societyReady && activities.length === 0) {
    return (
      <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Society is under review</h1>
          <h3>Please wait for the review to be completed</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-3">
        {isApplicant && hasUnapprovedRequest && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            You already have a sector of operation request that is not approved. You can add another only after it is approved.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          {isApplicant ? (
            societyReady && !hasUnapprovedRequest ? (
              <Button
                className="w-fit"
                onClick={() => {
                  setEditing(null);
                  setViewMode('add');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sector of Operation
              </Button>
            ) : (
              <span />
            )
          ) : (
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search society or sector..."
                icon={<Search className="h-4 w-4 text-gray-400" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <tr>
                {['Society', 'Sector of Operation', 'Status', 'Created At', 'Action'].map((title) => (
                  <th
                    key={title}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Loading sector of operation requests...</td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-lg font-medium">No sector of operation requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((item) => {
                  const key = statusKeyOf(item) || 'submitted';
                  const statusLabel = statusTitleOf(item);
                  const displayStatus = statusLabel && statusLabel !== '-' ? statusLabel : 'Submitted';
                  const societyRecord = item?.societyRegistration || item?.society;
                  const societyName =
                    societyRecord?.cooperative_society_name ||
                    item?.society_name ||
                    (isApplicant ? society?.cooperative_society_name || society?.name : '') ||
                    '-';
                  const registrationNumber =
                    societyRecord?.registration_number ||
                    (isApplicant ? society?.registration_number : '') ||
                    '';
                  const canResubmit = isApplicant && (key === 'rejected' || key === 'registrar_rejected');
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {societyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {registrationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {item?.sectorOfOperation?.name || '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(key, mode)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {item?.created_at ? moment(item.created_at).format('DD MMM, YYYY hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border"
                            onClick={() => navigate(`/sector-of-operation/${item.id}`)}
                          >
                            View
                          </Button>
                          {canResubmit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditing(item);
                                setViewMode('add');
                              }}
                            >
                              Re-submit
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
        <Pagination
          pagination={{
            total: pagination.total,
            limit: pagination.limit,
            from: pagination.total === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1,
            to: Math.min(pagination.currentPage * pagination.limit, pagination.total),
          }}
          currentPage={pagination.currentPage}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
          theme={mode}
        />
      </Card>
    </div>
  );
};
