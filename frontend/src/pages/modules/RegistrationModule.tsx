import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import RegistrationTableColumns from '../../hooks/registration/useRegistrationTableColums';
import { Pagination } from '../../components/layout/Pagination';
import { useNavigate } from 'react-router-dom';
import { getRegistrations } from '../../lib/data/registrations/api';
import { setRegistrations } from '../../store/slices/registrationSlice';
import moment from 'moment';
import { getStatusColor } from '../../utils/getStatusByKey';
import { Input } from '../../components/ui/Input';
import { Search, X, Copy, Check } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { ExportUsersReport } from '../exportReports/export';
import { DocumentChecklist } from '../../components/ui/DocumentChecklist';

function CopyNcdId({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);
  const text = String(value || '').trim();
  if (!text) return <>-</>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      if (!ok) return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{text}</span>
      <button
        type="button"
        onClick={copy}
        title={copied ? 'Copied' : 'Copy NCD ID'}
        className="text-gray-400 hover:text-gray-700"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

export const RegistrationModule: React.FC = () => {
  const dispatch = useDispatch();
  const [showDocumentChecklist, setShowDocumentChecklist] = useState(false);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const { registrations } = useSelector((state: RootState) => state.registrations);
  const { statuses } = useSelector((state: RootState) => state.statuses);
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    reference_year: '',
    from: '',
    to: '',
    status: '',
    has_applicant: ''
  })
  const [loading, setLoading] = useState(false)
  const [paginationInfo, setPaginationInfo] = useState({
    total: registrations.length,
    limit: 10,
    from: 0,
    to: 10,
  })

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Set default date range to last 90 days
  // useEffect(() => {
  //   const today = new Date();
  //   const fromDate = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

  //   setFilters(prev => ({
  //     ...prev,
  //     from: fromDate.toISOString().split('T')[0],
  //     to: today.toISOString().split('T')[0]
  //   }));
  // }, []);

  // Show document checklist on component load
  useEffect(() => {
    setShowDocumentChecklist(true);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'from' && filters.to && value > filters.to) {
      return; // Don't allow from date to be greater than to date
    }
    if (key === 'to' && filters.from && value < filters.from) {
      return; // Don't allow to date to be less than from date
    }

    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    // const today = new Date();
    // const fromDate = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters({
      reference_year: '',
      // from: fromDate.toISOString().split('T')[0],
      // to: today.toISOString().split('T')[0],
      from: '',
      to: '',
      status: '',
      has_applicant: ''
    });
    setPage(1);
  };

  useEffect(() => {
    const getAllRegistrations = async () => {
      setLoading(true);
      try {
        const response: any = await getRegistrations({
          page,
          ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
          ...(filters.reference_year ? { reference_year: filters.reference_year } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.has_applicant ? { has_applicant: filters.has_applicant } : {})
        })
        if (response) {
          dispatch(setRegistrations(response?.data?.societyRegistrations))
          setPaginationInfo(response?.data?.pagination)
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    }
    getAllRegistrations()
  }, [page, debouncedSearchTerm, filters])

  return (
    <div className='space-y-4 mt-4'>
      {user?.role !== 'applicant' && (
        <div className="space-y-4">
          {/* Search and Filters in same row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <Input
              label="Search"
              placeholder="Search registration number, name ..."
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
            <Select
              label="Reference Year"
              value={filters.reference_year.toString()}
              onChange={(e) => handleFilterChange('reference_year', e.target.value)}
            >
              <option value="">All Years</option>
              {Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </Select>

            <Input
              label="From Date"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />

            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {statuses.map((status: any) => (
                <option key={status.key} value={status.id}>
                  {status.title}
                </option>
              ))}
            </Select>

            <Select
              label="Applicant"
              value={filters.has_applicant}
              onChange={(e) => handleFilterChange('has_applicant', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Applicant Available</option>
              <option value="false">Applicant Not Available</option>
            </Select>

            <div className="mt-1">
              <Button
                variant="outline"
                size="md"
                onClick={clearFilters}
                className="flex items-center gap-2 mt-5"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            <div className="mt-5">
              <ExportUsersReport exportModule="society" searchTerm={searchTerm} filters={filters} />
            </div>
          </div>
        </div>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Loading registrations...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the registration data</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full">
              <thead className={`sticky top-0 z-10 bg-gray-50 ${mode}:bg-gray-900`}>
                <RegistrationTableColumns theme />
              </thead>
              <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
                {registrations?.length > 0 && registrations.map((item: any) => (
                  <tr className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                      {item?.registration_number}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      <CopyNcdId value={item?.ncd_id} />
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {item?.cooperative_society_name || '-'} {item?.local_langauge_society_name && `(${item?.local_langauge_society_name})`}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {item?.functional_status || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {item?.operation_area_location || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {item?.reference_year || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 ${mode}:bg-amber-900 ${mode}:text-amber-200 ${getStatusColor(item?.status?.key || item?.status, mode)}`}>
                        {item?.status || 'pending'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                      {moment(item?.created_at).format('DD MMM, YYYY hh:mm a') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant="ghost" size="sm" className='border' onClick={() => navigate(`/registrations/${item?.id}`)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length <= 0 && (
              <div className="px-6 py-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filters.reference_year || filters.from || filters.to || filters.status || filters.has_applicant
                    ? 'No registrations found matching your criteria'
                    : 'No registrations found'
                  }
                </h3>
              </div>
            )}
          </div>
        )}
      </Card>
      <Pagination
        pagination={paginationInfo}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        theme={mode}
      />
    </div>
  );
};