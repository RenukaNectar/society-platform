import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setSearchTerm } from '../store/slices/userSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Eye, EyeOff, RefreshCw, Upload } from 'lucide-react';
import UserTableColumns from '../hooks/user/useUserTableColums';
import toast from 'react-hot-toast';
import { Pagination } from '../components/layout/Pagination';
import { ErrorMsg } from '../components/layout/ErrorMsg';
import { AddUserForm, AddUserSchema } from '../utils/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUser, deleteUser, getUsers, updateUser } from '../lib/data/users/api';
import { allRoles } from '../lib/data/roles/api';
import moment from 'moment';
import { generatePassword } from '../utils/generatePassword';
import { Select } from '../components/ui/Select';
import { useMasterData } from '../hooks/useMasterData';
import { ExportUsersReport } from './exportReports/export';
import ActionPermissionGuard from '../components/guard/ActionPermissionGuard';
import { BulkUploadApplicantModal } from '../components/modals/BulkUploadApplicantModal';

const NO_DISTRICT_ROLE_NAMES = [
  'rcs_district',
  'jt_rcs_district',
  'drcs_arcs_auditor',
  'jics_sics_liquidator',
  'jics_sics_auditor',
];

const shouldShowDistrictForRole = (roleName?: string) => {
  if (!roleName) return false;

  const normalizedRoleName = roleName.toLowerCase();

  return (
    !NO_DISTRICT_ROLE_NAMES.includes(normalizedRoleName) &&
    !normalizedRoleName.includes('hq')
  );
};

const prepareUserPayload = (data: AddUserForm) => ({
  ...data,
  is_hq: !data.district_id,
});

export const Users: React.FC = () => {
  const dispatch = useDispatch();
  const { searchTerm } = useSelector((state: RootState) => state.users);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [page, setPage] = useState(1)
  const { masterData, selectedState, handleStateChange, handleDistrictChange } = useMasterData();
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [btnLoading, setbtnLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
    setValue,
    watch,
  } = useForm<AddUserForm>({
    resolver: zodResolver(AddUserSchema),
  
  });
  
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    limit: 0,
    from: 0,
    to: 10,
  })

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return `bg-purple-100 text-purple-800 ${mode}:bg-purple-900 ${mode}:text-purple-200`;
      case 'joint_registrar':
        return `bg-blue-100 text-blue-800 ${mode}:bg-blue-900 ${mode}:text-blue-200`;
      case 'registrar':
        return `bg-green-100 text-green-800 ${mode}:bg-green-900 ${mode}:text-green-200`;
      case 'senior_inspector':
        return `bg-amber-100 text-amber-800 ${mode}:bg-amber-900 ${mode}:text-amber-200`;
      case 'deputy_registrar':
        return `bg-red-100 text-red-800 ${mode}:bg-red-900 ${mode}:text-red-200`;
      case 'dealing_assistant':
        return `bg-yellow-100 text-yellow-800 ${mode}:bg-yellow-900 ${mode}:text-yellow-200`;
      case 'field_inspector':
        return `bg-indigo-100 text-indigo-800 ${mode}:bg-indigo-900 ${mode}:text-indigo-200`;
      case 'applicant':
        return `bg-pink-100 text-pink-800 ${mode}:bg-pink-900 ${mode}:text-pink-200`;
      default:
        return `bg-gray-100 text-gray-800 ${mode}:bg-gray-900 ${mode}:text-gray-200`;
    }
  };

  const getAllUsers = async () => {
    const requestParams = {
      page,
      search: debouncedSearchTerm,
      role_id: selectedRoleFilter
    };

    const response: any = await getUsers(requestParams)
    if (response) {
      setUsers(response?.data?.users)
      setPaginationInfo(response?.data?.pagination)
    }
  }

  const onSubmit = async (data: AddUserForm) => {
    setLoading(true);
    const payload = prepareUserPayload(data);
    let res = null;
    if (selectedUser) {
      res = await updateUser(selectedUser?.id, payload)
    }
    else {
      res = await createUser(payload);
    }
    if (res) {
      toast.success(res?.message || (selectedUser ? 'User updated successfully' : 'User added successfully'));
      setShowUserModal(false);
      reset();
      getAllUsers()
    }
    setLoading(false);
  };

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    getAllUsers()
  }, [page, debouncedSearchTerm, selectedRoleFilter])

  useEffect(() => {
    getRoles()
  }, [])

  const handleSearchChange = (value: string) => {
    dispatch(setSearchTerm(value));
    setPage(1); // Reset to first page when searching
  };

  const handleRoleFilterChange = (value: string) => {
    setSelectedRoleFilter(value);
    setPage(1); // Reset to first page when filtering
  };

  const getRoles = async () => {
    const response: any = await allRoles()
    if (response) {
      setRoles(response)
    }
  }

  const validateField = (field: string, value: any) => {
    const newErrors = { ...formErrors };

    if (value && value.toString().trim() !== '') {
      delete newErrors[field as keyof typeof newErrors];
    }
  };

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEditUser = (user: any) => {
    setShowUserModal(true)
    setSelectedUser(user)
    setValidationErrors({}) // Clear any previous validation errors
    setValue('first_name', user.first_name)
    setValue('last_name', user.last_name)
    setValue('email', user.email)
    setValue('phone', user.phone)
    if (user?.role?.name !== 'applicant') {
      setValue('role_id', user.role_id)
      setValue('state_id', user.state_id)
      setValue('district_id', user.district_id)
      setSelectedStateId(user.state_id)
      setSelectedDistrictId(user.district_id)
      if (user.state_id) {
        const state = masterData.states.find(s => s.id.toString() === user.state_id);
        if (state) {
          handleStateChange(state.state_code);
        }
      }
    }
  }

  const handleToggleUserStatus = (user: any) => {
    setShowDeleteConfirmationModal(true)
    setSelectedUser(user)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
    
      return
    }
    setbtnLoading(true)
    let res = await deleteUser(selectedUser?.id as string)
    if (res) {
      toast.success(res?.message || 'User deleted successfully')
      setShowDeleteConfirmationModal(false)
      setbtnLoading(false)
      setSelectedUser(null)
      getAllUsers()
    }
  }

  const clickNewUser = () => {
    setSelectedUser(null)
    setValidationErrors({}) // Clear any previous validation errors
    reset()
    setShowUserModal(true)
    getRoles()
    handleStateChange('')
    handleDistrictChange('')
    setSelectedStateId('')
    setSelectedDistrictId('')
    setSelectedRoleFilter('') // Reset role filter for new user
    setValue('state_id', '')
    setValue('district_id', '')
  }
const formData = watch();
const selectedFormRole = roles.find(role => role.id === formData?.role_id);
const roleName = selectedFormRole?.name;

const shouldShowDistrictField =
  selectedUser?.role?.name !== 'applicant' &&
  shouldShowDistrictForRole(roleName);
  const onUpdateSubmit = async () => {
    const formData = watch();

    const validationErrors: Record<string, string> = {};


    if (!formData.first_name || formData.first_name.trim() === '') {
      validationErrors.first_name = 'First name is required';
    }
    if (!formData.last_name || formData.last_name.trim() === '') {
      validationErrors.last_name = 'Last name is required';
    }
    if (!formData.email || formData.email.trim() === '') {
      validationErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || formData.phone.trim() === '') {
      validationErrors.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      validationErrors.phone = 'Mobile number must be exactly 10 digits';
    }

    const selectedRole = roles.find(role => role.id === formData.role_id);
     
    if (selectedRole) {

      if (!formData.role_id) {
  validationErrors.role_id = 'Role is required';
}

if (shouldShowDistrictForRole(selectedRole.name)) {
  if (!formData.state_id) {
    validationErrors.state_id = 'State is required for this role';
  }

  if (!formData.district_id) {
    validationErrors.district_id = 'District is required for this role';
  }
}
      else {
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);

      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);

      console.log('Validation errors:', validationErrors);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});

    setbtnLoading(true);

    delete formData.confirm_password
    delete formData.password
    const payload = prepareUserPayload(formData);
    try {
      const res: any = await updateUser(selectedUser?.id, payload);
      if (res) {
        toast.success(res?.message || 'User updated successfully');
        setShowUserModal(false);
        reset();
        getAllUsers();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update user');
    } finally {
      setbtnLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <div className="flex-1 max-w-4xl flex gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search user name, mobile, email address"
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              label=""
              value={selectedRoleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.description}
                </option>
              ))}
            </Select>
          </div>
          {(searchTerm || selectedRoleFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch(setSearchTerm(''));
                setSelectedRoleFilter('');
                setPage(1);
              }}
              className="self-end"
            >
              Clear Filters
            </Button>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <ActionPermissionGuard resource='users' action='create'>
            <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload Applicant
            </Button>
          </ActionPermissionGuard>
          <ActionPermissionGuard resource='users' action='create'>
            <Button onClick={clickNewUser}>
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          </ActionPermissionGuard>
          {user?.role?.name !== 'applicant' && <ExportUsersReport exportModule="users" searchTerm={searchTerm} filters={{
            role_id: selectedRoleFilter
          }} />}
        </div>
      </div>

      {/* Users Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Loading users...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the user data</p>
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-auto">
            <div className="min-w-full inline-block">
              <table className="w-full">
                <thead className={`sticky top-0 z-10 bg-gray-50 ${mode}:bg-gray-900`}>
                  <UserTableColumns theme={mode} />
                </thead>
                <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
                  {users.map((user, index) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${mode}:hover:bg-gray-800`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium text-gray-900 ${mode}:text-gray-100 underline`}>
                          {user.first_name} {user.last_name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user.phone}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRoleColor(user?.role?.name)}`}>
                          {user?.role?.description?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user?.is_hq ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800 ${mode}:bg-gray-700 ${mode}:text-gray-200`}
                            title="Head Quarters"
                          >
                            Yes
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user?.state?.name || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user?.district?.name || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${mode}:text-gray-400`}>
                        {user.created_at ? moment(user.created_at).format('DD MMM, YYYY hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className='border' onClick={() => handleEditUser(user)}>Edit</Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant={user.is_active ? 'danger' : 'success'} size="sm" className='border' onClick={() => handleToggleUserStatus(user)}>{!user.is_active ? 'Activate' : 'Deactivate'}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length <= 0 && (
                <div className="px-6 py-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || selectedRoleFilter ? 'No users found matching your criteria' : 'No users found'}
                  </h3>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      <Pagination
        pagination={paginationInfo}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        theme={mode}
      />

      {/* New User Modal */}
      {showUserModal && (
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setValidationErrors({});
          }}
          title={selectedUser ? 'Edit User' : 'Add New User'}
          size="md"
        >
          <form onSubmit={selectedUser ? onUpdateSubmit : handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="First Name"
                placeholder="Enter first name"
                {...register('first_name')}
                error={formErrors.first_name?.message || validationErrors.first_name}
                onChange={(e) => {
                  register('first_name').onChange(e);
                  clearValidationError('first_name');
                }}
                required
                maxLength={30}
              />
            </div>

            <div>
              <Input
                label="Last Name"
                placeholder="Enter Last name"
                {...register('last_name')}
                error={formErrors.last_name?.message || validationErrors.last_name}
                onChange={(e) => {
                  register('last_name').onChange(e);
                  clearValidationError('last_name');
                }}
                required
                maxLength={30}
              />
            </div>

            <div>
              <Input
                label="Email"
                type="email"
                placeholder="Enter email address"
                {...register('email')}
                error={formErrors.email?.message || validationErrors.email}
                onChange={(e) => {
                  register('email').onChange(e);
                  clearValidationError('email');
                }}
                required
                maxLength={30}
              />
            </div>

            <div>
              <Input
                label="Mobile"
                placeholder="Enter mobile number"
                {...register('phone')}
                error={formErrors.phone?.message || validationErrors.phone}
                onChange={(e) => {
                  register('phone').onChange(e);
                  clearValidationError('phone');
                }}
                required
                maxLength={10}
              />
            </div>

            {selectedUser?.role?.name !== 'applicant' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Select
                  label="Role"
                  placeholder="Select a role"
                  value={formData?.role_id || ''}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    const role = roles.find(item => item.id === roleId);

                    setValue('role_id', roleId);
                    if (!shouldShowDistrictForRole(role?.name)) {
                      setSelectedDistrictId('');
                      setValue('district_id', '');
                      handleDistrictChange('');
                    }
                    clearValidationError('role_id');
                    clearValidationError('district_id');
                  }}
                  error={formErrors.role_id?.message || validationErrors.role_id}
                  required
                >
                  {roles.filter((item: any) => item.name !== 'applicant').map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.description}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {selectedUser?.role?.name !== 'applicant' && <Select
              label="State / UT"
              placeholder="Select a state"
              value={selectedStateId}
              onChange={(e) => {
                const selectedStateId = e.target.value;
                setSelectedStateId(selectedStateId);
                // Update form field for validation
                setValue('state_id', selectedStateId);
                // Find the selected state to get its state_code for district loading
                const state = masterData.states.find(s => s.id.toString() === selectedStateId);
                if (state) {
                  handleStateChange(state.state_code);
                }
                // Reset district when state changes
                handleDistrictChange('');
                setSelectedDistrictId('');
                setValue('district_id', '');
                validateField('state_id', selectedStateId);
              }}
              error={formErrors.state_id?.message || validationErrors.state_id}
              disabled={masterData.loading}
              required
            >
              {masterData.loading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                masterData.states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))
              )}
            </Select>}

            {shouldShowDistrictField && (
              <Select
                label="District"
                value={selectedDistrictId}
                placeholder="Select a district"
                onChange={(e) => {
                  const districtId = e.target.value;
                  setSelectedDistrictId(districtId);
                  setValue('district_id', districtId);
                  const district = masterData.districts.find(
                    (d) => d.id.toString() === districtId
                  );
                  handleDistrictChange(
                    district?.district_code != null ? String(district.district_code) : ''
                  );
                  validateField('district_id', districtId);
                }}
                error={formErrors.district_id?.message || validationErrors.district_id}
                disabled={masterData.loading || !selectedState}
                required
              >
                {!selectedState ? (
                  <option value="" disabled>Please select a state first</option>
                ) : masterData.loading ? (
                  <option value="" disabled>Loading districts...</option>
                ) : (
                  masterData?.districts?.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))
                )}
              </Select>
            )}

            {!selectedUser && <div>
              <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register('password')}
                  error={formErrors.password?.message}
                  className="pr-20"
                  required
                  maxLength={24}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-10 w-10 p-0 hover:bg-gray-100"
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6 text-gray-500" />
                    ) : (
                      <Eye className="h-6 w-6 text-gray-500" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generatePassword}
                    className="h-10 w-10 p-0 hover:bg-gray-100"
                    title="Generate new password"
                  >
                    <RefreshCw className="h-6 w-6 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>}

            {!selectedUser && <div>
              <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter confirm password"
                  {...register('confirm_password')}
                  error={formErrors.confirm_password?.message}
                  className="pr-12"
                  required
                  maxLength={24}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 h-10 w-10 p-0 hover:bg-gray-100 mr-2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-6 w-6 text-gray-500" />
                  ) : (
                    <Eye className="h-6 w-6 text-gray-500" />
                  )}
                </Button>
              </div>
              {formErrors.confirm_password && <ErrorMsg message={formErrors.confirm_password.message} />}
            </div>}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => {
                setShowUserModal(false);
                setValidationErrors({});
              }} disabled={btnLoading}>
                Cancel
              </Button>
              {selectedUser ? <Button type="button" loading={btnLoading} onClick={onUpdateSubmit}>Update User</Button> : <Button type="submit" loading={btnLoading}>Add User</Button>}
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirmationModal && (
        <Modal
          isOpen={showDeleteConfirmationModal}
          onClose={() => setShowDeleteConfirmationModal(false)}
          title={!selectedUser?.is_active ? 'Activate User' : 'Deactivate User'}
        >
          <p>Are you sure you want to {!selectedUser?.is_active ? 'activate' : 'deactivate'} this user?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirmationModal(false)} disabled={btnLoading}>Cancel</Button>
            <Button variant={!selectedUser?.is_active ? 'success' : 'danger'} onClick={handleDeleteUser} loading={btnLoading}>{!selectedUser?.is_active ? 'Activate' : 'Deactivate'}</Button>
          </div>
        </Modal>
      )}

      <BulkUploadApplicantModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={getAllUsers}
      />
    </div>
  );
};
