import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Plus,
  Search as SearchIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEnquiryInspections } from '../../lib/data/enquiryInspections/api';
import { getMySociety } from '../../lib/data/users/api';
import { EnquiryInspection } from '../../types';
import moment from 'moment';
import { ExportUsersReport } from '../exportReports/export';
import { enquiryHeadOfficeStatusLabel } from '../../utils/userFacingWorkflowCopy';

const ENQUIRY_OFFICER_CREATE_ROLES = ['jics_sics_district', 'jics_sics_hq'];

export const EnquiryInspectionModule: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState<EnquiryInspection[]>([]);
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

  // Load enquiries data
  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const response = await getEnquiryInspections({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm
      });

      if (response) {
        setEnquiries(response.data?.enquiries || []);
        const pagination = response.data?.pagination || response.pagination;
        setTotalPages(pagination?.total_pages || pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading enquiries:', error);
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
    loadEnquiries();
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
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get applicant type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'member':
        return 'bg-purple-100 text-purple-800';
      case 'office_bearer':
        return 'bg-indigo-100 text-indigo-800';
      case 'general_public':
        return 'bg-green-100 text-green-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get subject reason badge color
  const getSubjectBadgeColor = (reason: string) => {
    switch (reason) {
      case 'inquiry':
        return 'bg-sky-100 text-sky-800';
      case 'inspection':
        return 'bg-teal-100 text-teal-800';
      case 'complaint':
        return 'bg-red-100 text-red-800';
      case 'irregularity':
        return 'bg-orange-100 text-orange-800';
      case 'routine_check':
        return 'bg-blue-100 text-blue-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const userRole = user?.role || '';
  const canCreateAsOfficer = ENQUIRY_OFFICER_CREATE_ROLES.includes(userRole);
  const canCreateAsApplicant =
    Boolean(userSociety?.society?.id) &&
    userRole === 'applicant' &&
    userSociety.society.status?.key === 'certificate_issued';

  if (loading && enquiries.length === 0) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading enquiries...</p>
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
            placeholder="Search by registration number, applicant name, or subject..."
            icon={<SearchIcon className="h-4 w-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </div>}
        {(canCreateAsOfficer) && (
          <Button onClick={() => navigate('/inquiries/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
        {user?.role !== 'applicant' && <ExportUsersReport exportModule="enquiry-inspection" searchTerm={searchTerm} filters={{}} />}
      </div>

      {/* Enquiries Table */}
      <Card padding='none'>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject/Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preferred Office Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
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
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <SearchIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No enquiries found</p>
                      <p className="text-sm">No enquiries match your current search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry: any) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {enquiry.society_name}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {enquiry.society_registration_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enquiry.applicant_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enquiry.contact_number}
                        </div>
                        {/* <div className="text-xs text-gray-400">
                          {enquiry.email_id}
                        </div> */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enquiry.applicant_type ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(enquiry.applicant_type)}`}>
                          {enquiry.applicant_type === 'Member' ? 'Shareholder' : enquiry.applicant_type}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectBadgeColor(enquiry.subject_reason)}`}>
                        {enquiry.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 mt-1">
                        {enquiry.preferred_office_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(enquiry.created_at).format('DD MMM, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                        {enquiry.is_rcs_initiated ? 'RCS / HQ' : 'District (JICS/SICS)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(enquiry.statusInfo?.key)}`}>
                        {enquiryHeadOfficeStatusLabel(
                          enquiry.is_rcs_initiated,
                          enquiry.statusInfo?.key,
                          enquiry.statusInfo?.title,
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className='border' onClick={() => navigate(`/inquiries/${enquiry.id}`)}>View</Button>
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
