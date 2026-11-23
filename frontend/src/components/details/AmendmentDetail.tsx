import { Card } from "../ui/Card";
import { FileText, User, Phone, Calendar, Eye, Download, FileCheck, AlertCircle } from "lucide-react";
import moment from "moment";
import { Button } from "../ui/Button";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { handleViewPdf } from "../../utils/viewpdf";
import { getStatusColor } from "../../utils/getStatusByKey";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";
import { isReturnedFileWithApplicant } from "../../lib/workflow/assigneeUsers";
export const AmendmentDetailComponent: React.FC<{ amendment: any, handleDownloadPdf: (url: string, filename: string) => void, onReSubmit?: () => void }> = ({ amendment, handleDownloadPdf, onReSubmit }) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { token } = useSelector((state: RootState) => state.auth);
  const user = useSelector((state: RootState) => state.auth.user);
  return (
    <div className="space-y-4 mt-4 pb-5 mb-5">
      {/* Amendment Details View */}

      <div className="space-y-4 pb-5">
        {/* Amendment Information */}
        {amendment?.status && ['registrar_rejected', 'rejected', 'reverted', 'arc_rejected', 'senior_inspector_rejected'].includes(String(amendment?.status?.key || '').toLowerCase()) && isReturnedFileWithApplicant(amendment) && <div className="p-3 bg-red-500 border-red-200 rounded-lg flex justify-between items-center my-4">
            <div>
              <div className="flex items-center text-white">
                <AlertCircle className="w-5 h-5 mr-2" />
                Amendment is&nbsp;<span className="font-bold">Return / Re-View</span>
              </div>
              {amendment?.amendment_reason && <p className='text-white text-sm ps-5 ms-2'>{amendment?.amendment_reason}</p>}
            </div>
            {user?.role === 'applicant' && <Button variant="outline" onClick={() => onReSubmit ? onReSubmit() : window.location.reload()} size="sm">
              Re Submit Amendment
            </Button>}
          </div>}
        <Card>
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              Amendment Information
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <div className="flex items-center">
                <span className="ml-1 font-medium">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-normal max-w-xl ${getStatusColor(amendment?.status?.key || amendment?.status?.title || 'Unknown', mode)}`}>
                    {amendment?.status
                      ? getWorkflowMovementStatusLabel(amendment, {
                          statusKey: amendment?.status?.key,
                          statusTitle: amendment?.status?.title || amendment?.status?.key,
                        })
                      : '-'}
                  </span>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Society Name</label>
              <p className="text-gray-900 font-medium">{amendment?.society?.cooperative_society_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Registration Number</label>
              <p className="text-gray-900 font-medium">{amendment?.society?.registration_number}</p>
            </div>
          </div>
        </Card>

        {user?.role !== 'applicant' && <Card>
          <div className="">
            <p className="text-gray-900 font-medium">Created By: {amendment?.createdByUser?.first_name} {amendment?.createdByUser?.last_name}</p>
            <p className="text-gray-500">{amendment?.createdByUser?.email}</p>
          </div>
        </Card>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chairperson Details */}
          <Card>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-green-600 mr-2" />
              <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
                Chief Promoter/CEO/President/MD Details
              </h3>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">{amendment?.chairperson_name}</p>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Contact</label>
              <div className="flex items-center">
                <Phone className="h-3 w-3 text-gray-400 mr-1" />
                <p className="text-gray-900">{amendment?.chairperson_contact}</p>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-900">{amendment?.chairperson_address}</p>
            </div>
          </Card>

          {/* Signatory Details */}
          <Card>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-green-600 mr-2" />
              <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
                Signatory Details
              </h3>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">{amendment?.signatory_name || amendment?.signatory_details?.split(',')[0]?.split(':')[1] || '-'}</p>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Contact</label>
              <div className="flex items-center">
                <Phone className="h-3 w-3 text-gray-400 mr-1" />
                <p className="text-gray-900">{amendment?.signatory_contact || amendment?.signatory_details?.split(',')[2]?.split(':')[1] || '-'}</p>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-900">{amendment?.signatory_address || amendment?.signatory_details?.split(',')[1]?.split(':')[1] || '-'}</p>
            </div>
          </Card>
        </div>

        {/* Members Details */}
        <Card>
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              Promoters
            </h3>
            {amendment?.members && (
              <span className="text-sm text-gray-500 ml-2">
                ({amendment.members.length} members)
              </span>
            )}
          </div>
          {amendment?.members && Array.isArray(amendment.members) && amendment.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {amendment.members.map((member: any, index: number) => (
                <div key={member.id || index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {member.designation || '-'}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {member.category || '-'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${member.gender === 'male'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-pink-100 text-pink-800'
                      }`}>
                      {member.gender}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">{member?.name} ({member?.mobile})</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No promoters found</p>
            </div>
          )}
        </Card>

        {/* Deleted Shareholders */}
        {Array.isArray(amendment?.deleted_members) && amendment.deleted_members.length > 0 && (
          <Card>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
                Deleted Shareholders
              </h3>
              <span className="text-sm text-gray-500 ml-2">
                ({amendment.deleted_members.length})
              </span>
            </div>
            <div className="space-y-3">
              {amendment.deleted_members.map((member: any, index: number) => (
                <div key={member.member_id || index} className="p-3 border border-red-100 rounded-lg bg-red-50">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member?.name || '-'}
                        {member?.mobile ? ` (${member.mobile})` : ''}
                      </p>
                      <p className="text-xs text-gray-600">
                        {[member?.designation, member?.gender, member?.category].filter(Boolean).join(' • ') || '-'}
                      </p>
                      <p className="text-sm text-gray-800 mt-2">
                        <span className="font-medium">Reason:</span> {member?.deletion_reason || '-'}
                      </p>
                    </div>
                    {member?.supportingDocumentMedia?.url && (
                      <div className="flex items-center gap-2">
                        {member.supportingDocumentMedia.url?.split('.').pop()?.toLowerCase() === 'pdf' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPdf(member.supportingDocumentMedia.url, token || '')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownloadPdf(
                              member.supportingDocumentMedia.url,
                              member.supportingDocumentMedia.original_name ||
                                member.supportingDocumentMedia.file_name ||
                                'deletion-document.pdf'
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Meeting Details */}
        <Card>
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              Meeting Details
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Meeting Date</label>
              <p className="text-gray-900">{amendment?.general_body_meeting_date ? moment(amendment?.general_body_meeting_date).format('DD-MM-YYYY') : 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notice Days</label>
              <p className="text-gray-900">{amendment?.notice_days} days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Total Promoters</label>
              <p className="text-gray-900">{amendment?.total_members}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Quorum Required</label>
              <p className="text-gray-900">{amendment?.quorum_required}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Promoters Present</label>
              <p className="text-gray-900">{amendment?.members_present}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Votes in Favor</label>
              <div className="flex items-center">
                <p className="text-gray-900">{amendment?.votes_in_favour}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Amendment Details */}
        <Card>
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              Amendment Details
            </h3>
          </div>
          <div className="text-sm grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Byelaw Number</label>
              <p className="text-gray-900 font-medium">{amendment?.byelaw_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Resolution Extract</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">{amendment?.resolution_extract}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Reason for Amendment</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">{amendment?.amendment_reason}</p>
            </div>
          </div>
        </Card>

        {/* Bylaw Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
          <div className="flex items-center mb-4">
            <FileCheck className="h-5 w-5 text-green-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              Amendment Documents
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Existing Bylaw Document */}
            {amendment?.existingByelawMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Existing Byelaw Document</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.existingByelawMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.existingByelawMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.existingByelawMedia.url, 'existing-bylaw.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* New Proposed Bylaw Document */}
            {amendment?.newProposedByelawMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">New Proposed Byelaw Document</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.newProposedByelawMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.newProposedByelawMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.newProposedByelawMedia.url, amendment.newProposedByelawMedia.url.split('/').pop() || 'new-proposed-bylaw.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {amendment?.attendanceSheetMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Attendance Sheet</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.attendanceSheetMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.attendanceSheetMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.attendanceSheetMedia.url, amendment.attendanceSheetMedia.url.split('/').pop() || 'attendance-sheet.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {amendment?.circularNoticeMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Circular Notice</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.circularNoticeMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.circularNoticeMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.circularNoticeMedia.url, amendment.circularNoticeMedia.url.split('/').pop() || 'circular-notice.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {amendment?.minutesOfMeetingMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Minutes of Meeting</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.minutesOfMeetingMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.minutesOfMeetingMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.minutesOfMeetingMedia.url, amendment.minutesOfMeetingMedia.url.split('/').pop() || 'minutes-of-meeting.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}


            {amendment?.meetingNoticeAgendaMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Meeting Notice Agenda</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.meetingNoticeAgendaMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.meetingNoticeAgendaMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.meetingNoticeAgendaMedia.url, amendment.meetingNoticeAgendaMedia.url.split('/').pop() || 'meeting-notice-agenda.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {amendment?.districtDrcsArcsRecommendationMedia && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">District DRCS/ARCS Recommendation</p>
                  </div>
                </div>
              <div className="flex space-x-2">
                  {amendment?.districtDrcsArcsRecommendationMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment.districtDrcsArcsRecommendationMedia.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment.districtDrcsArcsRecommendationMedia.url, amendment.districtDrcsArcsRecommendationMedia.url.split('/').pop() || 'district-drcs-arcs-recommendation.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}

           

            {/* General Documents */}
            {amendment?.documents && amendment.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Supporting Documents:</p>
                {amendment.documents.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{doc.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      {doc?.url?.split('.')[1] === 'pdf' && <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPdf(doc.url, token || '')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(doc.url, doc.url.split('/').pop() || 'document.pdf')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

         <Card>
          <div className="flex items-center mb-4">
            <FileCheck className="h-5 w-5 text-green-600 mr-2" />
            <h3 className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}>
              RCS Observations
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 items-center">
            {amendment?.byeLawsMedia ? (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">RCS Observations</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {amendment?.byeLawsMedia?.url?.split('.')[1] === 'pdf' && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewPdf(amendment?.byeLawsMedia?.url, token || '')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf(amendment?.byeLawsMedia?.url, amendment?.byeLawsMedia?.url.split('/').pop() || 'rcs-observations.pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ):
            <div className="col-span-3 text-center py-8 text-gray-500">
            No RCS Observations uploaded
          </div>
            }
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};