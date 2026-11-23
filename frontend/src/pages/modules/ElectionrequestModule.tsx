import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Search, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getElectionRequests } from '../../lib/data/elections/api';
import { getMySociety } from '../../lib/data/users/api';
import { ElectionRequest } from '../../types';
import { Pagination } from '../../components/layout/Pagination';
import moment from 'moment';
import { getStatusByKey } from '../../utils/getStatusByKey';
import { ExportUsersReport } from '../exportReports/export';

export const ElectionrequestModule: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);

  const [electionRequests, setElectionRequests] = useState<ElectionRequest[]>([]);  
  const [loading, setLoading] = useState(false);
  const [societyLoading, setSocietyLoading] = useState(false);
  const [userSociety, setUserSociety] = useState<any>(null);
  /** Applicant: true after /me fetch; hasSociety true when linked society exists */
  const [applicantSocietyReady, setApplicantSocietyReady] = useState(false);
  const [hasApplicantSociety, setHasApplicantSociety] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load user's society information
  const loadUserSociety = async () => {
    if (!user) {
      return;
    }
    if (user.role !== 'applicant') {
      setUserSociety(null);
      setHasApplicantSociety(false);
      setApplicantSocietyReady(true);
      setSocietyLoading(false);
      return;
    }

    setApplicantSocietyReady(false);
    try {
      setSocietyLoading(true);
      const society = await getMySociety();
      if (society?.data?.society) {
        setUserSociety(society.data);
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
      setSocietyLoading(false);
      setApplicantSocietyReady(true);
    }
  };

  // Load election requests
  const loadElectionRequests = async (params: any = {}) => {
    setLoading(true);
    try {
      const requestParams = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        ...params
      };

      let response = await getElectionRequests(requestParams);
      if (response) {
        setElectionRequests(response.data.electionRequests || []);
        setPaginationInfo(response.data.pagination);
      }
    } catch (error: any) {
      console.error('Error loading election requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Applicants: only load after their society is resolved (and only if they have one).
    // Every other role (drcs_arcs_district / drcs_arcs_hq / jics_sics_district /
    // jics_sics_hq / jt_rcs_district / rcs_district / admin / super_admin, etc.)
    // relies on the backend to filter by district/workflow scope — so just load.
    if (!user) return;
    if (user.role === 'applicant') {
      if (userSociety && userSociety?.society) {
        loadElectionRequests();
      }
      return;
    }
    loadElectionRequests();
  }, [currentPage, debouncedSearchTerm, userSociety, user]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadUserSociety();
  }, [user, user?.role]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const canCreateElectionRequest = () => {
    if (user?.role !== 'applicant') {
      return false;
    }
    if (!applicantSocietyReady || !hasApplicantSociety) {
      return false;
    }
    const hasPendingStatus = electionRequests.some(
      (request) => request.status?.key === 'pending'
    );

    return !hasPendingStatus;
  };
  return (
    <div className="space-y-6 mt-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        {user?.role !== 'applicant' && <div className="flex-1 max-w-md">
          <Input
            placeholder="Search election requests..."
            value={searchTerm}
            icon={<Search className="h-4 w-4 text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>}
        {canCreateElectionRequest() && (
          <Button
            onClick={() => navigate('/election-requests/new')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            Create Election Request
          </Button>
        )}
        {user?.role !== 'applicant' && <ExportUsersReport exportModule="election" searchTerm={searchTerm} filters={{}} />}
      </div>

      {/* Election Requests Table */}
      <Card padding="none">
        {/* Show loading state for applicants who are still loading their society */}
        {user?.role === 'applicant' && societyLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your society information...</p>
          </div>
        ) : loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading election requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Society
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {electionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-gray-400 mb-4" />
                        {user?.role === 'applicant' && !userSociety?.society ? (
                          <p className="text-lg font-medium">No election conducted yet</p>
                        ) : (
                          <p className="text-lg font-medium">No election requests found</p>
                        )}
                        <p className="text-sm">No election requests match your current search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  electionRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.societyRegistration?.cooperative_society_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.societyRegistration?.registration_number || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex py-1 text-xs font-semibold rounded-full ${getStatusByKey(request.reason_for_election_request)}`}>
                          {request.reason_for_election_request}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.proposed_election_date ?
                            moment(request.proposed_election_date).format('DD MMM, YYYY') : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {request.number_of_members_eligible_to_vote?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.submission_date ?
                            moment(request.submission_date).format('DD MMM, YYYY hh:mm a') : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.created_at ?
                            moment(request.created_at).format('DD MMM, YYYY hh:mm a') : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.createdBy ? (
                            <div className="font-medium">
                              {request.createdBy.first_name} {request.createdBy.last_name}
                            </div>
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className='border' onClick={() => navigate(`/election-requests/${request.id}`)}>View</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {electionRequests.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              pagination={paginationInfo}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              theme={mode}
            />
          </div>
        )}
      </Card>
    </div>
  );
};