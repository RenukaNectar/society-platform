import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Edit, Trash2, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import { Pagination } from '../../components/layout/Pagination';
import { getAuditRequests, deleteAuditRequest, isAuditReturnedToApplicant } from '../../lib/data/audits/api';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';
import { Input } from '../../components/ui/Input';
import { ExportUsersReport } from '../exportReports/export';

export const AuditTrailModule: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [auditRequests, setAuditRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userSociety, setUserSociety] = useState<any>(null);
  /** Applicant only: true after /me society fetch finishes; hasSociety true if linked society exists */
  const [applicantSocietyReady, setApplicantSocietyReady] = useState(false);
  const [hasApplicantSociety, setHasApplicantSociety] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 10,
    from: 0,
    to: 0,
  });

  // Check if user can create audit request (applicants need a linked society)
  const canCreateAuditRequest = () => {
    if (user?.role !== 'applicant') {
      return false;
    }
    if (!applicantSocietyReady || !hasApplicantSociety) {
      return false;
    }
    const hasPendingStatus = auditRequests.some(
      (request) => request.status?.key === 'pending'
    );
    return !hasPendingStatus;
  };

  // Load audit requests
  const loadAuditRequests = async (params: any = {}) => {
    setLoading(true);
    try {
      const response = await getAuditRequests({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        ...params
      });

      if (response && response.auditRequests) {
        setAuditRequests(response.auditRequests || []);
        setPaginationInfo(response?.pagination || {});
      }
    } catch (error) {
      console.error('Error loading audit requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user's society information (used for list refetch + add-button visibility)
  const loadUserSociety = async () => {
    if (!user) {
      return;
    }
    if (user.role !== 'applicant') {
      setUserSociety(null);
      setHasApplicantSociety(false);
      setApplicantSocietyReady(true);
      return;
    }

    setApplicantSocietyReady(false);
    try {
      const response = await getMySociety();
      if (response?.data?.society) {
        setUserSociety(response.data);
        setHasApplicantSociety(true);
      } else {
        setUserSociety(null);
        setHasApplicantSociety(false);
      }
    } catch (error) {
      console.error('Error loading user society:', error);
      setUserSociety(null);
      setHasApplicantSociety(false);
    } finally {
      setApplicantSocietyReady(true);
    }
  };

  useEffect(() => {
    loadUserSociety();
  }, [user, user?.role]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadAuditRequests();
  }, [currentPage, debouncedSearchTerm, userSociety]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this audit request?')) {
      try {
        await deleteAuditRequest(id);
        toast.success('Audit request deleted successfully');
        loadAuditRequests();
      } catch (error) {
        toast.error('Failed to delete audit request');
      }
    }
  };

  const getAuditClassificationColor = (classification: string) => {
    switch (classification) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        {user?.role !== 'applicant' && <div className="flex-1 max-w-md">
          <Input
            placeholder="Search audit requests..."
            icon={<Search className="h-4 w-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>}
        {canCreateAuditRequest() && (
          <Button onClick={() => navigate('/audit-requests/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Audit Request
          </Button>
        )}
        {user?.role !== 'applicant' && <ExportUsersReport exportModule="audit" searchTerm={searchTerm} filters={{}} />}
      </div>

      {/* Audit Requests Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Society
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Financial Year
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Auditor Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Audit Classification
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Completion Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Created By
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-300 uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading audit requests...</p>
                    </div>
                  </td>
                </tr>
              ) : auditRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No audit requests found</p>
                      <p className="text-sm">No audit requests match your current search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                auditRequests.map((audit) => (
                  <tr key={audit.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {audit.societyRegistration?.cooperative_society_name || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {audit.societyRegistration?.registration_number || '-'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {audit.financial_year || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {audit.auditor_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAuditClassificationColor(audit.audit_classification)}`}>
                        Class {audit.audit_classification || '-'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {audit.audit_completion_date ? moment(audit.audit_completion_date).format('DD-MM-YYYY') : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {audit.createdBy?.first_name + ' ' + audit.createdBy?.last_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/audit-requests/${audit.id}`)}
                          className="border border-gray-200"
                        >
                          View
                        </Button>
                        {(typeof user?.role === 'string' ? user.role : (user as any)?.role?.name) === 'applicant' && isAuditReturnedToApplicant(audit) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/audit-requests/${audit.id}/edit`)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Re-submit
                          </Button>
                        )}
                        <PermissionGuard permission="canDeleteAudit" showAskPermission={false}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(audit.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          theme={mode}
        />
      </Card>
    </div>
  );
};