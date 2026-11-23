import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Eye, Download, Award, Building, Users, DollarSign, Calendar, UserCheck, AlertTriangle, Gavel, FileSpreadsheet } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getAnnualFilingById } from '../../lib/data/annualFilings/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { useAssigneeAvailability } from '../../hooks/useAssigneeAvailability';
import moment from 'moment';
import toast from 'react-hot-toast';
import { download, openDocument } from '../../utils/download';
import { handleViewPdf } from '../../utils/viewpdf';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { getStatusColor } from '../../utils/getStatusByKey';
import {
  getAnnualFilingStatusKey,
  getAnnualFilingStatusTitle,
} from '../../utils/annualFilingStatus';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';

const MODULE_NAME = 'ANNUAL_FILING';

export const AnnualFilingDetails: React.FC = () => {
  const { id } = useParams();
  const [annualFiling, setAnnualFiling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);

  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;
    if (typeof docs === 'string') {
      try {
        return JSON.parse(docs);
      } catch {
        return [];
      }
    }
    return [];
  };

  const loadAnnualFiling = async () => {
    try {
      setLoading(true);
      const response = await getAnnualFilingById(id!);
      if (response) {
        setAnnualFiling(response);
      }
    } catch (error) {
      console.error('Error loading annual filing:', error);
      toast.error('Failed to load annual filing details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAnnualFiling();
    }
  }, [id]);

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setSubmitting(true);

      const resourceId = annualFiling?.id;
      if (!resourceId) {
        toast.error('Invalid resource ID');
        return;
      }

      const payload: any = {
        resourceId,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (
        !bypass &&
        action === 'approve' &&
        annualFiling?.workflowStatus?.next?.approval_send_to === 'single' &&
        !selectedUserId
      ) {
        toast.error('Please select the user to assign before approving.');
        return;
      }

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success(
          res?.message ||
          (action === 'approve'
            ? 'Annual filing forwarded successfully'
            : 'Annual filing sent back successfully'),
        );
        setModalOpen(false);
        setIsRejectModal(false);
        setSelectedUserId(null);
        setAssignmentUsers([]);
        setIsAssignmentRequired(false);
        loadAnnualFiling();
      } else {
        toast.error(res?.message || 'Workflow update failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Workflow update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const annualFilingAssigneeOpts = {
    workflowStatus: annualFiling?.workflowStatus,
    currentUserId: (user as any)?.id,
    userIsHq: (user as any)?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(annualFilingAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(annualFilingAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '')
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string, filename: string) => {
    download(url, token || '')
  };

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Helper function to format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value || 0);
  };

  const currentUser: any = user;
  const workflowStatus = annualFiling?.workflowStatus;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === 'string'
      ? currentUser.role
      : currentUser?.role?.name;
  const assigneeAvailability = useAssigneeAvailability({
    workflowStatus,
    entity: annualFiling,
    currentUserId: currentUser?.id,
  });
  const workflowActionEntity = annualFiling
    ? {
        ...annualFiling,
        assigned_to_user_id: assigneeAvailability.assignedToUserId,
      }
    : null;

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading annual filing data...</p>
          </div>
        </Card>
      </div>
    );
  }

  const showWorkflowActions = canShowWorkflowActions(
    workflowActionEntity,
    workflowStatus,
    currentUser?.id,
    userRoleId,
    userRoleName,
  );

  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const isLastStep = workflowStatus?.next?.approvalStatus?.key === 'approved';

  const previousCommentEntry = Array.isArray(annualFiling?.history)
    ? annualFiling.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    workflowStatus?.previousComment ||
    previousCommentEntry?.comments?.trim() ||
    '';
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ''} ${previousCommentUser.last_name || ''}`.trim() ||
    previousCommentUser.email ||
    ''
    : '';
  const previousCommentUserRole =
    previousCommentUser?.role?.description || previousCommentUser?.role?.name || '';
  const previousCommentDocuments = Array.isArray(annualFiling?.previousCommentDocuments)
    ? annualFiling.previousCommentDocuments
    : [];

  return (
    <div className="my-4 mb-5 pb-5 relative">
      <PreviousCommentCard
        visible={showWorkflowActions}
        commentText={previousCommentText}
        commentByName={previousCommentUserName}
        commentByRole={previousCommentUserRole}
        commentAtText={
          previousCommentEntry?.created_at
            ? moment(previousCommentEntry.created_at).format('DD MMM, YYYY hh:mm a')
            : ''
        }
        documents={previousCommentDocuments}
        onViewDocument={openInBlankTab}
        onDownloadDocument={openInBlankTab}
      />
      <div className="space-y-4 mb-5 pb-5">
        {/* Header Card */}
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {annualFiling?.society_name}
                </h1>
              </div>
              <p className="text-gray-600 mb-4">
                Society ID: {annualFiling?.society?.registration_number}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-between mb-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {annualFiling?.financial_year || '-'}
              </span>
              {annualFiling?.audit_date && (
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Audit Completed: {moment(annualFiling?.audit_date).format('DD MMM, YYYY')}
                </span>
              )}
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  getAnnualFilingStatusKey(annualFiling) ||
                  getAnnualFilingStatusTitle(annualFiling) ||
                  'Unknown',
                  mode,
                )}`}
              >
                {getAnnualFilingStatusTitle(annualFiling)
                  ? getWorkflowMovementStatusLabel(annualFiling, {
                      statusKey: getAnnualFilingStatusKey(annualFiling),
                      statusTitle: getAnnualFilingStatusTitle(annualFiling),
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Information & Society Details */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information & Society Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Financial Year</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.financial_year || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society ID</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.society?.society_id || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Name</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.society_name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.registration_number || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.registration_date ? moment(annualFiling?.registration_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Address</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.society_address || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Principal Activities/Sectors</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.principal_activities || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Major Activities Undertaken</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.major_activities || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Major Areas/States of Operation</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.operation_areas || '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Leadership Contact Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-purple-600" />
                Leadership Contact Information

              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">President/CEO/MD/Chief Promoter</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.president_name || '-'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {annualFiling?.president_contact || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Secretary</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.secretary_name || '-'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {annualFiling?.secretary_contact || '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Membership Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Membership Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Promoters</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.total_members)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nominal Promoters</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.nominal_members)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Institutional Promoters</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.institutional_members)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Defaulter Promoters</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.defaulter_members)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Financial Information - Capital & Reserves */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
                Capital & Reserves
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Authorised Share Capital</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.authorised_share_capital)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paid Up Share Capital</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.paid_up_share_capital)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Reserve</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_reserve)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deposits</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.deposits)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Financial Information - Assets & Investments */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Assets & Investments
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cash in Hand</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.cash_in_hand)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bank Balance</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.balance_with_banks)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Investments</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.investments)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fixed Assets</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.fixed_assets)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Assets</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_assets)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bad Debts</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.bad_debts)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Financial Information - Income & Expenditure */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Income & Expenditure
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income/Sales</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_income)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expenditure</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_expenditure)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.profit)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Profit</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.net_profit)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Purchase</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_purchase)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sale</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.total_sale)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Audit Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-green-600" />
                Audit Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Complete Year</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.audit_upto_year || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Classification</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.audit_classification || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Compliance Audit</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.compliance_audit || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.audit_date ? moment(annualFiling?.audit_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Election Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Election Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Election Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.last_election_date ? moment(annualFiling?.last_election_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Election Due</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.next_election_due_date ? moment(annualFiling?.next_election_due_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Management Committee Promoters</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.committee_members_count)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committee Meetings Held</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.committee_meetings_count)}
                  </p>
                </div>
              </div>
            </Card>

            {/* General Body & AGM Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-teal-600" />
                General Body & AGM Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last AGM Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.last_agm_date ? moment(annualFiling?.last_agm_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">General Body Meeting Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.general_body_meeting_date ? moment(annualFiling?.general_body_meeting_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Employee Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Employee Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sanctioned Posts</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.sanctioned_posts)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trained During Year</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.trained_employees)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employees Category Wise</span>
                <p className="text-sm text-gray-900 mt-1">
                  {annualFiling?.employees_category_wise || '-'}
                </p>
              </div>
            </Card>

            {/* Cost of Management */}
            {/* <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-red-600" />
                Cost of Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Salary</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.cost_management_salary)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Other Expenses</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.cost_management_other)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Administrative Cost</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(annualFiling?.cost_management_admin)}
                  </p>
                </div>
              </div>
            </Card> */}

            {/* Misappropriation Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Misappropriation Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nature of Misappropriation</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.misappropriation_nature || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Level at which Occurred</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {annualFiling?.misappropriationLevelAnnualForms?.name || '-'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount Involved</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(annualFiling?.misappropriation_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount Recieved</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(annualFiling?.misappropriation_amount_received)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action Taken and Status</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {annualFiling?.misappropriation_status || '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Arbitration Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Gavel className="w-5 h-5 mr-2 text-gray-600" />
                Arbitration and Execution Cases
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Cases at Beginning</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.cases_pending_start)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Settled During Year</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.cases_settled)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending at End</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(annualFiling?.cases_pending_end)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className=" p-4">
              <h3 className=" text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
                RCS Observations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">

                {(annualFiling?.byeLawsMedia && annualFiling?.byeLawsMedia?.url) ? (
                  <div className=" flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">RCS Observations</p>
                    </div>
                    <div className="flex space-x-2">
                      {annualFiling?.byeLawsMedia?.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(annualFiling?.byeLawsMedia?.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(annualFiling?.byeLawsMedia?.url, 'bye-laws.pdf')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    No RCS Observations uploaded
                  </div>
                )}




              </div>
            </Card>
          </div>
        </div>

        {/* Documents Section - Full Width */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
            Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {annualFiling?.balanceSheetAnnualForms && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Balance Sheet</p>
                </div>
                <div className="flex space-x-2">
                  {annualFiling?.balanceSheetAnnualForms?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(annualFiling?.balanceSheetAnnualForms?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(annualFiling?.balanceSheetAnnualForms?.url, 'balance-sheet.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Byelaw Amendments */}
            {annualFiling?.byelawAmendmentsAnnualForms && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Byelaw Amendments</p>
                </div>
                <div className="flex space-x-2">
                  {annualFiling?.byelawAmendmentsAnnualForms?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(annualFiling?.byelawAmendmentsAnnualForms?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(annualFiling?.byelawAmendmentsAnnualForms?.url, 'byelaw-amendments.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {annualFiling?.misappropriationLevelAnnualForms && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Misappropriation Level</p>
                </div>
                <div className="flex space-x-2">
                  {annualFiling?.misappropriationLevelAnnualForms?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(annualFiling?.misappropriationLevelAnnualForms?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(annualFiling?.misappropriationLevelAnnualForms?.url, 'balance-sheet.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {annualFiling?.generalBodyConstitutionAnnualForms && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">General Body Constitution</p>
                </div>
                <div className="flex space-x-2">
                  {annualFiling?.generalBodyConstitutionAnnualForms?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(annualFiling?.generalBodyConstitutionAnnualForms?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(annualFiling?.generalBodyConstitutionAnnualForms?.url, 'surplus-disposal-plan.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!annualFiling?.balanceSheetAnnualForms && !annualFiling?.byelawAmendmentsAnnualForms && !annualFiling?.misappropriationLevelAnnualForms && !annualFiling?.generalBodyConstitutionAnnualForms && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No documents uploaded
              </div>
            )}
          </div>
        </Card>
      </div>

      <ProcessingHistoryPanel
        resourcePath="annual-forms"
        resourceId={annualFiling?.id ?? id}
        embeddedHistory={annualFiling?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={annualFiling?.id ?? id ?? ''}
        entity={workflowActionEntity}
        workflowStatus={annualFiling?.workflowStatus}
        currentUserId={currentUser?.id}
        onRefresh={loadAnnualFiling}
        showWorkflowActions={showWorkflowActions}
        onReject={canReject ? openRejectModal : undefined}
        onApprove={canApprove ? openApproveModal : undefined}
        showApproveButton={canApprove && !assigneeAvailability.pendingReassign}
        showRejectButton={canReject}
        userRole={currentUser?.role}
        isLastStep={isLastStep}
        showHistory
      />

      <ConfirmOrRejectModal
        key={`${modalOpen}-${isRejectModal}`}
        loading={submitting || loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Return Annual Filing'
            : annualFiling?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Approve Annual Filing'
              : 'Forward Annual Filing'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this annual filing.'
            : annualFiling?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Are you sure you want to approve this annual filing?'
              : 'Are you sure you want to forward this annual filing?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={parseWorkflowDocuments(workflowStatus?.next?.approval_documents)}
        rejectDocuments={parseWorkflowDocuments(workflowStatus?.next?.reject_documents)}
        onSubmit={(message, documents, meta) =>
          callWorkflowAction(isRejectModal ? 'back' : 'approve', message, documents, meta?.bypass)
        }
        onCancel={() => {
          setModalOpen(false);
          setIsRejectModal(false);
          setSelectedUserId(null);
          setAssignmentUsers([]);
          setIsAssignmentRequired(false);
        }}
      />
    </div>
  );
};
