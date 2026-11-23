import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Plus,
  FileText,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAppeals } from '../../lib/data/appeals/api';
import { getMySociety } from '../../lib/data/users/api';
import { Appeal } from '../../types';
import moment from 'moment';
import { ExportUsersReport } from '../exportReports/export';
import { formatStatusTitleForDisplay } from '../../utils/userFacingWorkflowCopy';

export const AppealModule: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [userSociety, setUserSociety] = useState<any>(null);

  // Load user's society information
  const loadUserSociety = async () => {
    // Only load if user is an applicant
    if (user?.role !== 'applicant') {
      return;
    }

    try {
      const response = await getMySociety();
      if (response?.data?.society) {
        setUserSociety(response.data);
      }
    } catch (error) {
      console.error('Error loading user society:', error);
      // Don't show error toast as this is not critical for the main functionality
    }
  };

  // Load appeals data
  const loadAppeals = async () => {
    try {
      setLoading(true);
      const requestParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
      };

      const response = await getAppeals(requestParams);

      if (response) {
        setAppeals(response.appeals);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
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
    loadAppeals();
  }, [currentPage, debouncedSearchTerm]);

  // Load user society when user role changes
  useEffect(() => {
    loadUserSociety();
  }, [user?.role]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (['pending', 'submitted'].includes(s)) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (['accepted', 'approved'].includes(s)) {
      return 'bg-green-100 text-green-800';
    }
    if (['rejected', 'returned'].includes(s)) {
      return 'bg-red-100 text-red-800';
    }
    if (s === 'modified' || s === 'forwarded') {
      return 'bg-blue-100 text-blue-800';
    }
    if (s === 'sent_back_for_review') {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Get appellant type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'society':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get order type badge color
  const getOrderTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'election':
        return 'bg-green-100 text-green-800';
      case 'liquidation':
        return 'bg-red-100 text-red-800';
      case 'penalty':
        return 'bg-orange-100 text-orange-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && appeals.length === 0) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appeals...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Search and Create Button */}
      <div className="flex justify-between items-center">
        {user?.role !== 'applicant' && <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by registration number, appellant name, or order number..."
            icon={<Search className="h-4 w-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>}
        {(() => {
          const isApplicantWithIssuedCert =
            userSociety?.society?.id &&
            userSociety.society.status?.key === 'certificate_issued';

          // Hide "New Appeal" if any existing appeal is currently in-process
          // (status = submitted or forwarded). Applicants only see their own
          // appeals (backend filters by created_by), so this check is safe.
          const inProgressStatuses = ['submitted', 'forwarded'];
          const hasInProgressAppeal = appeals.some((a: any) => {
            const key = a?.appealStatus?.key;
            return key && inProgressStatuses.includes(key);
          });

          if (!isApplicantWithIssuedCert || hasInProgressAppeal) return null;

          return (
            <Button onClick={() => navigate('/appeals/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Appeal
            </Button>
          );
        })()}
        {user?.role !== 'applicant' && <ExportUsersReport exportModule="appeal" searchTerm={searchTerm} filters={{}} />}
      </div>

      {/* Appeals Table */}
      <Card padding='none'>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appellant Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appellant Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filing Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appeals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No appeals found</p>
                      <p className="text-sm">No appeals match your current search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appeals.map((appeal: any) => (
                  <tr key={appeal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appeal.society_name ||
                          appeal.society?.cooperative_society_name ||
                          appeal.society?.local_langauge_society_name ||
                          '-'}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {appeal.society_registration_no || appeal.society?.registration_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appeal.name_of_appellant}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm ">
                        {appeal.contact_phone}
                      </div>
                      <div className="text-sm">
                        {appeal.contact_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(appeal.appellant_type)}`}>
                          {appeal.appellant_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderTypeBadgeColor(appeal.order_type)}`}>
                          {appeal.order_type}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 mt-1">
                          {appeal.order_number}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {moment(appeal.order_date).format('DD MMM, YYYY')}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(appeal.created_at).format('DD MMM, YYYY hh:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-normal">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-normal ${getStatusBadgeColor(appeal.appealStatus?.key || appeal.appealStatus?.title)}`}>
                        {formatStatusTitleForDisplay(
                          appeal.appealStatus?.title || appeal.appealStatus?.key || '',
                        ) || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className='border' onClick={() => navigate(`/appeals/${appeal.id}`)}>View</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};