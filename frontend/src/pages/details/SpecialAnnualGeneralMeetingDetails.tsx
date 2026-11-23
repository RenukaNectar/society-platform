import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { AlertCircle, Calendar, Users, FileText, Building, Eye, Download } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSpecialAnnualGeneralMeetingById } from '../../lib/data/specialAnnualGeneralMeetings/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import moment from 'moment';
import { handleViewPdf } from '../../utils/viewpdf';
import { download, openDocument } from '../../utils/download';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { MeetingElectedBodDetailsSection } from '../../components/meeting/MeetingElectedBodDetailsSection';
import { DeletedShareholdersSection } from '../../components/meeting/DeletedShareholdersSection';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';

export const SpecialAnnualGeneralMeetingDetails: React.FC = () => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const MODULE_NAME = 'SGBM';
  const [meeting, setMeeting] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  const loadMeeting = async () => {
    if (!id) {
      toast.error('Meeting ID not found');
      navigate('/special-annual-general-meeting');
      return;
    }
    try {
      setLoading(true);
      const response = await getSpecialAnnualGeneralMeetingById(id);
      if (response.data) {
        const meetingData: any = response.data;
        setMeeting(meetingData);
        setWorkflowStatus(meetingData?.workflowStatus || null);
      } else {
        toast.error('Meeting not found');
        navigate('/special-annual-general-meeting');
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
      toast.error('Failed to load meeting details');
      navigate('/special-annual-general-meeting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className={`text-xl font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
          Meeting Not Found
        </h2>
        <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          The requested Special General Body Meeting could not be found.
        </p>
        <Button onClick={() => navigate('/special-annual-general-meeting')}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  const calculateAttendancePercentage = (attended: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((attended / total) * 100)}%`;
  };

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '');
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string) => {
    download(url, token || '');
  };

  const parseWorkflowDocuments = (
    docs?: string | string[] | null,
  ): string[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;

    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  };

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setLoadingAction(true);

      if (!meeting?.id) {
        toast.error('Invalid SGBM ID');
        return;
      }

      const payload: any = {
        resourceId: meeting.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      await updateWorkflow(payload);
      toast.success('Workflow updated successfully');
      setModalOpen(false);
      setSelectedUserId(null);
      setAssignmentUsers([]);
      setIsAssignmentRequired(false);
      await loadMeeting();
    } catch {
      toast.error('Workflow update failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers({
      workflowStatus,
      currentUserId: user?.id,
      userIsHq: (user as any)?.is_hq,
    });
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = () => {
    setIsRejectModal(true);
    setIsAssignmentRequired(false);
    setAssignmentUsers([]);
    setModalOpen(true);
  };
  const noticeDocumentUrl =
    meeting?.notice?.url ||
    meeting?.media?.url ||
    meeting?.media_id ||
    '';
  const noticeDocumentName =
    meeting?.notice?.file_name ||
    meeting?.media?.file_name ||
    'Notice Document';

  const createdAtValue = meeting?.created_at || meeting?.createdAt || meeting?.meeting_date;
  const updatedAtValue = meeting?.updated_at || meeting?.updatedAt;
  const workflowStatusKey = String(
    meeting?.workflowStatus?.current?.approvalStatus?.key ||
    meeting?.statusDetails?.key ||
    ''
  ).toLowerCase();
  const workflowStatusName =
    meeting?.workflowStatus?.current?.approvalStatus?.name ||
    meeting?.workflowStatus?.current?.approvalStatus?.label ||
    meeting?.statusDetails?.name ||
    meeting?.statusDetails?.label ||
    '';
  const fallbackActiveStatus = meeting?.active ? 'Active' : 'Inactive';
  const statusLabel = workflowStatusName
    ? String(workflowStatusName)
    : workflowStatusKey
      ? workflowStatusKey.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
      : fallbackActiveStatus;
  const isRejectedStatus = ['rejected', 'back', 'sent_back'].includes(workflowStatusKey);
  const isApprovedStatus = ['approved', 'certificate_issued', 'active'].includes(workflowStatusKey);
  const statusBadgeClass = isRejectedStatus
    ? mode === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
    : isApprovedStatus
      ? mode === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
      : mode === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
  const previousCommentEntry = Array.isArray(meeting?.history)
    ? meeting.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    meeting?.workflowStatus?.previousComment ||
    previousCommentEntry?.comments?.trim() ||
    '';
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ''} ${previousCommentUser.last_name || ''}`.trim() ||
    previousCommentUser.email ||
    ''
    : '';
  const previousCommentUserRole =
    previousCommentUser?.role?.description ||
    previousCommentUser?.role?.name ||
    '';
  const previousCommentDocuments = Array.isArray(meeting?.previousCommentDocuments)
    ? meeting.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };
  const userRoleId = (user as any)?.role_id || (user as any)?.role?.id;
  const userRoleName =
    typeof (user as any)?.role === 'string'
      ? (user as any).role
      : (user as any)?.role?.name;
  const canShowActions = canShowWorkflowActions(
    meeting,
    workflowStatus,
    user?.id,
    userRoleId,
    userRoleName,
  );
  const isLastStep = Boolean(
    workflowStatus?.next?.sequence === workflowStatus?.current?.total_workflowLevel ||
    workflowStatus?.next?.sequence === workflowStatus?.next?.total_workflowLevel ||
    workflowStatus?.next?.sequence === workflowStatus?.previous?.total_workflowLevel ||
    workflowStatus?.next?.approvalStatus?.key === 'certificate_issued',
  );
  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents,
  );
  const rejectDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.reject_documents,
  );

  return (
    <div className="relative pb-28 space-y-6 mt-[5px]">
      <PreviousCommentCard
        visible={canShowActions}
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

      {/* Meeting Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Building className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusBadgeClass}`}>
                {getWorkflowMovementStatusLabel(meeting, {
                  statusKey: meeting?.statusDetails?.key || workflowStatusKey,
                  statusTitle: meeting?.statusDetails?.title || statusLabel,
                })}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Society Name
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                  {meeting.society_name || '-'}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Chairman Name
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                  {meeting.chairman_name || '-'}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Meeting Date
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1 flex items-center`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {meeting.meeting_date ? moment(meeting.meeting_date).format('MMMM DD, YYYY [at] HH:mm') : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Information */}
        <Card>
          <div className="p-6">
            <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <Users className="h-5 w-5 mr-2" />
              Attendance Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Shareholders
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                  {meeting.total_shareholders || 0}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Attended Shareholders
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                  {meeting.attended_shareholders || 0}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Attendance Percentage
                </label>
                <p className={`text-sm ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                  {calculateAttendancePercentage(meeting.attended_shareholders || 0, meeting.total_shareholders || 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <FileText className="h-5 w-5 mr-2" />
              Additional Documents
            </h3>
            <div className="space-y-4">
              {/* Notice Document */}
              {noticeDocumentUrl ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Notice Document
                    </p>
                    <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {noticeDocumentName}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {String(noticeDocumentUrl).toLowerCase().split('.').pop() === 'pdf' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPdf(noticeDocumentUrl)}
                        className={mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(noticeDocumentUrl)}
                      className={mode === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notice document uploaded</p>
                </div>
              )}

              {/* Attendance Sheet */}
              {meeting.attendanceSheet && meeting.attendanceSheet.url ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Attendance Sheet
                    </p>
                    <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {meeting.attendanceSheet.file_name || 'Attendance Sheet'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {meeting.attendanceSheet.url?.split('.').pop() === 'pdf' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPdf(meeting.attendanceSheet.url)}
                        className={mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(meeting.attendanceSheet.url)}
                      className={mode === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance sheet uploaded</p>
                </div>
              )}

              {/* Minutes of Meeting */}
              {meeting.minutesOfMeeting && meeting.minutesOfMeeting.url ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Minutes of Meeting
                    </p>
                    <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {meeting.minutesOfMeeting.file_name || 'Minutes Document'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {meeting.minutesOfMeeting.url?.split('.').pop() === 'pdf' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPdf(meeting.minutesOfMeeting.url)}
                        className={mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(meeting.minutesOfMeeting.url)}
                      className={mode === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No minutes of meeting uploaded</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <FileText className="h-5 w-5 mr-2" />
              RCS Observations
            </h3>
            <div className="space-y-4">
              {/* Notice Document */}
              {(meeting?.byeLawsMedia && meeting?.byeLawsMedia?.url) ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      RCS Observations
                    </p>
                    <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {meeting?.byeLawsMedia?.file_name || "RCS Observations Document"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {String(noticeDocumentUrl).toLowerCase().split('.').pop() === 'pdf' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPdf(meeting?.byeLawsMedia?.url)}
                        className={mode === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(meeting?.byeLawsMedia?.url)}
                      className={mode === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-4 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No uploaded</p>
                </div>
              )}


            </div>
          </div>
        </Card>
      </div>
      <MeetingElectedBodDetailsSection
        members={meeting?.elected_bod_members || []}
        title="Elected BOD Members (SGBM Resolution)"
      />
      <DeletedShareholdersSection
        deletedMembers={meeting?.deleted_members}
        handleDownloadPdf={(url) => handleDownloadPdf(url)}
      />

      {/* Additional Information */}
      {meeting.comments && (
        <Card>
          <div className="p-6">
            <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <FileText className="h-5 w-5 mr-2" />
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Comments
                </label>
                <div className={`mt-2 p-4 rounded-lg border border-gray-700`}>
                  <p className={`text-sm whitespace-pre-wrap ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {meeting.comments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Meeting Timeline */}
      <Card>
        <div className="p-6">
          <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Calendar className="h-5 w-5 mr-2" />
            Meeting Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Meeting Created
                </p>
                <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {createdAtValue ? moment(createdAtValue).format('MMMM DD, YYYY [at] HH:mm') : '-'}
                </p>
              </div>
            </div>
            {updatedAtValue && updatedAtValue !== createdAtValue && (
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Last Updated
                  </p>
                  <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {moment(updatedAtValue).format('MMMM DD, YYYY [at] HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <ProcessingHistoryPanel
        resourcePath="special-general-meeting"
        resourceId={meeting?.id ?? id}
        embeddedHistory={meeting?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={meeting?.id ?? id ?? ''}
        entity={meeting}
        workflowStatus={workflowStatus}
        currentUserId={user?.id}
        onRefresh={loadMeeting}
        showWorkflowActions={canShowActions}
        onApprove={canApprove ? openApproveModal : undefined}
        onReject={canReject ? openRejectModal : undefined}
        showApproveButton={canApprove && !workflowStatus?.pendingReassign}
        showRejectButton={canReject}
        userRole={user?.role}
        isLastStep={isLastStep}
        showHistory
      />

      <ConfirmOrRejectModal
        loading={loadingAction}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Return SGBM'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Approve SGBM'
              : 'Forward SGBM'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this SGBM.'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Are you sure you want to approve this SGBM?'
              : 'Are you sure you want to forward this SGBM?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={approvalDocuments}
        rejectDocuments={rejectDocuments}
        onSubmit={(msg, docs, meta) =>
          callWorkflowAction(isRejectModal ? 'back' : 'approve', msg, docs, meta?.bypass)
        }
        onCancel={() => setModalOpen(false)}
      />

    </div>
  );
};
