import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Users, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getMySociety } from '../../lib/data/users/api';
import { getBodMembersBySociety } from '../../lib/data/bodMembers/api';
import moment from 'moment';
import { Select } from '../../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import { getAnnualGeneralMeetings } from '../../lib/data/annualGeneralMeetings/api';
import { API_BASE_URL } from '../../lib/api';

interface Member {
  id: string;
  name: string;
  designation: string;
  gender: string;
  category: string;
  mobile: string;
  email: string;
  address: string;
  joining_date: string;
  is_active: boolean;
  created_at: string;
  is_co_opted?: boolean;
}

interface SocietyInfo {
  id: string;
  name: string;
  registration_number: string;
  address: string;
  total_members: number;
  board_members: Member[];
}

export const BoardOfDirectorsModule: React.FC = () => {
  const navigate = useNavigate();
  const [societyInfo, setSocietyInfo] = useState<SocietyInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [hasApprovedAgm, setHasApprovedAgm] = useState(false);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const designationOptions = Array.from(
    new Set(
      members
        .map((member) => String(member.designation || '').trim())
        .filter((designation) => designation.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
  const categoryOptions = Array.from(
    new Set(
      members
        .map((member) => String(member.category || '').trim())
        .filter((category) => category.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  const normalizeMembers = (payload: any): Member[] => {
    if (Array.isArray(payload)) return payload as Member[];
    if (Array.isArray(payload?.data)) return payload.data as Member[];
    if (Array.isArray(payload?.members)) return payload.members as Member[];
    if (Array.isArray(payload?.data?.members)) return payload.data.members as Member[];
    return [];
  };

  // Fetch society and members data
  useEffect(() => {
    fetchSocietyData();
  }, []);

  const fetchBodMembers = async (societyId: string) => {
    try {
      console.log('fetching BOD members for societyId:', societyId);
      const bodRes: any = await getBodMembersBySociety(societyId);
      console.log('BOD members API raw response:', bodRes);
      const bodMembers = normalizeMembers(bodRes);
      console.log('BOD members normalized list:', bodMembers);
      setMembers(bodMembers);
      setFilteredMembers(bodMembers);
    } catch (error) {
      console.error('Error fetching BOD members:', error);
      try {
        const token = localStorage.getItem('token');
        console.log('fallback direct fetch for BOD members, societyId:', societyId);
        const response = await fetch(`${API_BASE_URL}/bod-members/society/${societyId}`, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include',
          cache: 'no-store'
        });
        const body = await response.json();
        console.log('BOD members fallback raw response:', body);
        const fallbackMembers = normalizeMembers(body);
        console.log('BOD members fallback normalized list:', fallbackMembers);
        setMembers(fallbackMembers);
        setFilteredMembers(fallbackMembers);
      } catch (fallbackError) {
        console.error('Fallback BOD members fetch failed:', fallbackError);
        setMembers([]);
        setFilteredMembers([]);
      }
    }
  };

  const fetchSocietyData = async () => {
    setLoading(true);
    let societyId: string | null = null;
    try {
      const data: any = await getMySociety();
      const society =
        data?.data?.society ||
        data?.data?.user?.society ||
        data?.society ||
        null;
      setSocietyInfo(society || null);
      societyId = society?.id || null;
    } catch (error) {
      console.error('Error fetching society data:', error);
    }

    try {
      if (!societyId) {
        societyId =
          (user as any)?.society?.id ||
          null;
      }
      if (!societyId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          societyId =
            parsedUser?.society?.id ||
            null;
        }
      }

      if (societyId) {
        console.log('fetching BOD members for societyId:', societyId);
        await fetchBodMembers(societyId);
        console.log('BOD members fetched for societyId:', societyId);
        try {
          const agmRes: any = await getAnnualGeneralMeetings({
            page: 1,
            limit: 100,
            society_id: societyId,
          });
          const agmMeetings = agmRes?.data?.meetings || [];
          const approvedMeetingExists = agmMeetings.some(
            (meeting: any) => meeting?.statusDetails?.key === "approved",
          );
          setHasApprovedAgm(approvedMeetingExists);
        } catch (error) {
          console.error('Error fetching AGM meetings:', error);
          setHasApprovedAgm(false);
        }
      } else {
        setMembers([]);
        setFilteredMembers([]);
        setHasApprovedAgm(false);
        if (!societyInfo) {
          setSocietyInfo((user as any)?.society || null);
        }
      }
    } catch (error) {
      console.error('Error preparing board of directors data:', error);
      setHasApprovedAgm(false);
    } finally {
      setLoading(false);
    }
  };

  // Guaranteed BOD members fetch whenever society id becomes available.
  useEffect(() => {
    const resolvedSocietyId =
      (societyInfo as any)?.id ||
      (user as any)?.society?.id ||
      (() => {
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return null;
          const parsedUser = JSON.parse(storedUser);
          return parsedUser?.society?.id || null;
        } catch {
          return null;
        }
      })();

    if (resolvedSocietyId) {
      fetchBodMembers(String(resolvedSocietyId));
    }
  }, [societyInfo, user]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDesignationFilter('');
    setSelectedGenderFilter('');
    setSelectedCategoryFilter('');
  };

  // Filter members based on search term and all filters
  useEffect(() => {
    let filtered = members;

    // Apply search filter (searches in name, designation, email, and mobile)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.designation.toLowerCase().includes(searchLower)
      );
    }

    // Apply designation filter (exact match)
    if (selectedDesignationFilter) {
      filtered = filtered.filter(member =>
        member.designation.toLowerCase() === selectedDesignationFilter.toLowerCase()
      );
    }

    // Apply gender filter (exact match)
    if (selectedGenderFilter) {
      filtered = filtered.filter(member =>
        member.gender.toLowerCase() === selectedGenderFilter.toLowerCase()
      );
    }

    // Apply category filter (exact match)
    if (selectedCategoryFilter) {
      filtered = filtered.filter(member =>
        member.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
      );
    }

    setFilteredMembers(filtered);
  }, [searchTerm, members, selectedDesignationFilter, selectedGenderFilter, selectedCategoryFilter]);
 useEffect(() => {
  setCurrentPage(1);
}, [
  searchTerm,
  selectedDesignationFilter,
  selectedGenderFilter,
  selectedCategoryFilter
]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading society information...</p>
        </div>
      </div>
    );
  }

  if (!societyInfo) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No Society Information Found</h2>
        <p className="text-gray-500">Please ensure you are associated with a society.</p>
      </div>
    );
  }

// Pagination calculations
const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;

const paginatedMembers = filteredMembers.slice(startIndex, endIndex);


  return (
    <div className="space-y-6 mt-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-center">
        <div className="text-sm text-gray-600">
          <span className="font-bold">Registration Number: {societyInfo?.registration_number}</span>
        </div>
       
        {hasApprovedAgm && (
          <div className="md:col-span-2 flex justify-end gap-2">
              <Button
              onClick={() => navigate("/board-of-directors/meetings/new")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New BOD Meeting
            </Button>
            <Button
              onClick={() => navigate("/board-of-directors/meetings")}
              className="flex items-center gap-2"
            >
              BOD View
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center justify-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            label="Search"
            placeholder="Search by name, designation, email, or mobile"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
        <Select
          label="Designation"
          value={selectedDesignationFilter}
          onChange={(e) => setSelectedDesignationFilter(e.target.value)}
        >
          <option value="">All Designations</option>
          {designationOptions.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </Select>

        <Select
          label="Gender"
          value={selectedGenderFilter}
          onChange={(e) => setSelectedGenderFilter(e.target.value)}
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="transgender">Transgender</option>
        </Select>

        <Select
          label="Category"
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

        <div className="flex mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      </div>


      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
              {members.length}
            </div>
            <div className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
              Total Promoters
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold text-indigo-600 ${mode}:text-indigo-400`}>
              {filteredMembers.length}
            </div>
            <div className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
              Filtered Results
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
              {members.filter(m => m.gender === 'male').length}
            </div>
            <div className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
              Male Promoters
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
              {members.filter(m => m.gender === 'female').length}
            </div>
            <div className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
              Female Promoters
            </div>
          </div>
        </Card>
      </div>

      {/* Members Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                  Promoter Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                  Mobile
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                  Gender
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 ${mode}:text-gray-400 uppercase tracking-wider`}>
                  Designation
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No promoters found</p>
                      <p className="text-sm">
                        {searchTerm
                          ? 'Try adjusting your search or filter criteria'
                          : 'Start by adding board promoters to your society'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className={`text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                          {member.name}
                        </div>
                        <div className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
                          Joined: {moment(member.created_at).format('DD MMM, YYYY hh:mm a')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {member.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {member.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {member.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ${mode}:bg-blue-900 ${mode}:text-blue-200`}>
                          {member.designation}
                        </span>
                     {  member?.is_co_opted &&  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ${mode}:bg-blue-900 ${mode}:text-blue-200`}>
                          Co-opted
                        </span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
{filteredMembers?.length > 0 && (
  <div className="flex items-center justify-between px-6 py-4 border-t">
    <div className="text-sm text-gray-500">
      Showing {startIndex + 1} to{" "}
      {Math.min(endIndex, filteredMembers.length)} of{" "}
      {filteredMembers.length} results
    </div>

    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
      >
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
      >
        Next
      </Button>
    </div>
  </div>
)}
        </div>
      </Card>
    </div>
  );
};