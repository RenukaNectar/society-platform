import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Eye, Edit, Trash2, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import CertificateIssuedGuard from '../../components/guard/CertificateIssuedGuard';
import { Pagination } from '../../components/layout/Pagination';
import { getAnnualFilings, deleteAnnualFiling } from '../../lib/data/annualFilings/api';
import moment from 'moment';
import { ExportUsersReport } from '../exportReports/export';
import { getStatusColor } from '../../utils/getStatusByKey';
import {
  getAnnualFilingStatusKey,
  getAnnualFilingStatusLabel,
  getAnnualFilingStatusTitle,
} from '../../utils/annualFilingStatus';

export const AnnualReturnModule: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [annualFilings, setAnnualFilings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load annual filings
  const loadAnnualFilings = async (params: any = {}) => {
    setLoading(true);
    try {
      const requestParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        ...params
      };

      let response = await getAnnualFilings(requestParams);
      if (response && response.annualForms) {
        setAnnualFilings(response.annualForms);
        setPaginationInfo(response.pagination || {
          total: 0,
          limit: 10,
          page: 1,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      console.error('Error loading annual filings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadAnnualFilings();
  }, [currentPage, debouncedSearchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this annual filing?')) {
      try {
        await deleteAnnualFiling(id);
        toast.success('Annual filing deleted successfully');
        loadAnnualFilings();
      } catch (error) {
        toast.error('Failed to delete annual filing');
      }
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Search and Create Button */}
      <div className="flex justify-between items-center">
        {user?.role !== 'applicant' && <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by financial year, auditor name, or society ID..."
            icon={<Search className="h-4 w-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>}
        <CertificateIssuedGuard>
          <Button onClick={() => navigate('/annual-filings/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Annual Filing
          </Button>
        </CertificateIssuedGuard>
        {user?.role !== 'applicant' && <ExportUsersReport exportModule="annual-filing" searchTerm={searchTerm} filters={{}} />}
      </div>

      {/* Annual Filings Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Financial Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Promoters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Institutional Promoters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Defaulter Promoters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deposits (in Rs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Assets (in Rs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading annual filings...</p>
                    </div>
                  </td>
                </tr>
              ) : annualFilings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No annual filings found</p>
                      <p className="text-sm">No annual filings match your current search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                annualFilings.map((filing) => (
                  <tr key={filing.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                      {filing.financial_year}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {filing.society_name}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {filing.registration_number}
                      </p>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.total_members || '0'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.institutional_members || '0'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.defaulter_members}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.deposits || '0'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.total_assets || '0'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${mode}:text-gray-400`}>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          getAnnualFilingStatusKey(filing) ||
                            getAnnualFilingStatusTitle(filing) ||
                            'Unknown',
                          mode,
                        )}`}
                      >
                        {getAnnualFilingStatusTitle(filing)
                          ? getAnnualFilingStatusLabel(filing)
                          : '-'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {filing.createdByUser?.first_name + ' ' + filing.createdByUser?.last_name || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {moment(filing.created_at).format('DD MMM, YYYY hh:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className='border' onClick={() => navigate(`/annual-filings/${filing.id}`)}>View</Button>

                        <PermissionGuard permission="canEditAnnualFiling" showAskPermission={false}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/annual-filings/${filing.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="canDeleteAnnualFiling" showAskPermission={false}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(filing.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
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
        {paginationInfo.total > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pagination={{
                total: paginationInfo.total,
                limit: paginationInfo.limit,
                from: ((currentPage - 1) * paginationInfo.limit) + 1,
                to: Math.min(currentPage * paginationInfo.limit, paginationInfo.total)
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};