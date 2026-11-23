import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Card } from "../../components/ui/Card";
import {
  Building2,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import moment from "moment";
import { handleViewPdf } from "../../utils/viewpdf";
import { download } from "../../utils/download";
import { Button } from "../../components/ui/Button";
import { getStatusColor } from "../../utils/getStatusByKey";
import { useNavigate, useParams } from "react-router-dom";
import { getLiquidationById } from "../../lib/data/liquidations/api";
import { getMySociety } from "../../lib/data/users/api";
import toast from "react-hot-toast";
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from "../../lib/workflow/assigneeUsers";
import { updateWorkflow } from "../../lib/data/workflows/api";
import { ConfirmOrRejectModal } from "../../components/confirm&rejectModal/ConfirmModal";
import { WorkflowReassignBlock } from "../../components/workflow/WorkflowReassignBlock";
import { ProcessingHistoryPanel } from "../../components/workflow/ProcessingHistoryPanel";
import { PreviousCommentCard } from "../../components/workflow/PreviousCommentCard";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";
import {
  formatLiquidationWorkflowComment,
  isAutoWorkflowHistoryComment,
} from "../../utils/workflowComment";

type JtRcsDocument = {
  key?: string;
  sequence?: number | null;
  label?: string;
  url?: string;
  issuedMediaId?: string;
  stamped?: boolean;
};

const canonicalJtDocKey = (key?: string) =>
  key === "bye_laws" ? "rcs_observations" : key || "";

/** Hide audit reports and keep one row per document type and step. */
const dedupeJtRcsDocuments = (documents: JtRcsDocument[]): JtRcsDocument[] => {
  const indexBySlot = new Map<string, number>();
  const result: JtRcsDocument[] = [];
  for (const doc of documents) {
    const key = canonicalJtDocKey(doc.key);
    if (!doc.url || key === "audit_report") continue;
    const slot = key === "liquidation_report" ? key : `${key}:${doc.sequence ?? ""}`;
    const normalized = { ...doc, key };
    const existingIndex = indexBySlot.get(slot);
    if (existingIndex == null) {
      indexBySlot.set(slot, result.length);
      result.push(normalized);
      continue;
    }
    const current = result[existingIndex];
    const incomingSeq = Number(normalized.sequence) || 0;
    const currentSeq = Number(current.sequence) || 0;
    const preferIncoming =
      (normalized.stamped && !current.stamped) ||
      (Boolean(normalized.stamped) === Boolean(current.stamped) && incomingSeq >= currentSeq);
    if (preferIncoming) {
      result[existingIndex] = normalized;
    }
  }
  return result;
};

interface LiquidationDetailsProps {
  liquidation?: any;
}

const liquidationDocumentConfig = [
  { key: "minutesMeetingMedia", label: "Minutes & Agenda" },
  { key: "attendanceSheetMedia", label: "Attendance Sheet" },
  { key: "circularNoticeMedia", label: "Circular Notice" },
  { key: "creditorsListMedia", label: "Creditors List" },
  { key: "membersListMedia", label: "Member List" },
] as const;

const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs;

  if (typeof docs === "string") {
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  }

  return [];
};

export const LiquidationDetails: React.FC<LiquidationDetailsProps> = ({
  liquidation,
}) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);

  const { id } = useParams();
  const navigate = useNavigate();

  const MODULE_NAME = "LIQUIDATION";

  const [loading, setLoading] = useState(false);
  const [liquidationData, setLiquidationData] = useState<any>(
    liquidation || null,
  );
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);

  const [society, setSoceity] = useState<any>(null);

  const [loadingTypes, setLoadingTypes] = useState(false);

  /** =========================
   * ASSIGNMENT STATE
   ==========================*/
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  /** =========================
   * MODAL STATE
   ==========================*/
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  /** =========================
   * FETCH SOCIETY DETAILS
   ==========================*/
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await getMySociety();
        setSoceity(response?.data?.society);
      } catch (error) {
        console.error("Failed to fetch society types:", error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  /** =========================
   * FETCH LIQUIDATION DATA
   ==========================*/
  const fetchData = useCallback(async () => {
    const liquidationId = id || liquidation?.id;
    if (!liquidationId) return;

    try {
      const res: any = await getLiquidationById(liquidationId);

      setLiquidationData(res);

      // IMPORTANT: backend must return workflowStatus
      setWorkflowStatus(res?.workflowStatus || null);
    } catch (error) {
      toast.error("Failed to load liquidation");
      console.error(error);
    }
  }, [id, liquidation?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** =========================
   * WORKFLOW ACTION
   ==========================*/
  const callWorkflowAction = async (
    action: "approve" | "back",
    comments?: string,
    documentData?: Record<string, string | string[]>,
    bypass?: boolean,
  ) => {
    try {
      setLoading(true);

      const resourceId = liquidationData?.id;
      if (!resourceId) return toast.error("Invalid liquidation ID");

      const payload: any = {
        resourceId,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success("Liquidation updated successfully");
      } else {
        toast.error(res?.message || "Workflow update failed");
      }

      await fetchData();
      setModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      toast.error("Workflow update failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /** =========================
   * APPROVE MODAL
   ==========================*/
  const liquidationAssigneeOpts = {
    workflowStatus,
    currentUserId: user?.id,
    userIsHq: user?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(liquidationAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /** =========================
   * REJECT MODAL
   ==========================*/
  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(liquidationAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /** =========================
   * BUTTON VISIBILITY
   ==========================*/
  const userRoleId = user?.role_id || user?.role?.id;
  const userRoleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;

  const canShowActions = canShowWorkflowActions(
    liquidationData,
    workflowStatus,
    user?.id,
    userRoleId,
    userRoleName,
  );

  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const isLastStep =
    workflowStatus?.next?.approvalStatus?.key === "liquidation_approved";
  const liquidationId = liquidationData?.id ?? id ?? "";
  const liquidationCommentIsVisible = (comment?: string | null) => {
    const text = String(comment || "").trim();
    if (!text) return false;
    if (formatLiquidationWorkflowComment(text)) return true;
    return !isAutoWorkflowHistoryComment(text, MODULE_NAME, liquidationId);
  };
  const previousCommentEntry = Array.isArray(liquidationData?.history)
    ? liquidationData.history.find((entry: any) =>
      liquidationCommentIsVisible(entry?.comments),
    )
    : null;
  const rawPreviousComment =
    previousCommentEntry?.comments?.trim() ||
    (workflowStatus?.previousComment &&
      liquidationCommentIsVisible(workflowStatus.previousComment)
      ? workflowStatus.previousComment.trim()
      : "");
  const previousCommentText =
    formatLiquidationWorkflowComment(rawPreviousComment) || rawPreviousComment;
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ""} ${previousCommentUser.last_name || ""}`.trim() ||
    previousCommentUser.email ||
    ""
    : "";
  const previousCommentUserRole =
    previousCommentUser?.role?.description ||
    previousCommentUser?.role?.name ||
    "";
  const previousCommentDocuments = Array.isArray(liquidationData?.previousCommentDocuments)
    ? liquidationData.previousCommentDocuments
    : [];
  const apiJtRcsDocuments = Array.isArray(liquidationData?.rcsSignedDocuments)
    ? liquidationData.rcsSignedDocuments.filter((doc: { url?: string; key?: string }) => Boolean(doc?.url) && doc?.key !== "audit_report")
    : [];
  const jtRcsDocuments = dedupeJtRcsDocuments([...apiJtRcsDocuments]);
  const observationsUrl = liquidationData?.liquidatorAppointmentObservationsMedia?.url as string | undefined;
  if (
    observationsUrl &&
    !jtRcsDocuments.some((doc: { key?: string }) => doc.key === "liquidator_appointment_observations")
  ) {
    jtRcsDocuments.unshift({
      key: "liquidator_appointment_observations",
      label: "RCS Observations for Liquidator Appointment",
      url: observationsUrl,
      stamped: false,
    });
  }
  const rcsObservationsUrl = liquidationData?.byeLawsMedia?.url as string | undefined;
  if (
    rcsObservationsUrl &&
    !jtRcsDocuments.some((doc: { key?: string }) => doc.key === "rcs_observations" || doc.key === "bye_laws")
  ) {
    jtRcsDocuments.push({
      key: "rcs_observations",
      label: "RCS Observations",
      url: rcsObservationsUrl,
      stamped: false,
    });
  }

  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents,
  );

  const rejectDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.reject_documents,
  );

  const uploadedDocuments = liquidationDocumentConfig
    .map(({ key, label }) => {
      const doc = liquidationData?.[key];
      if (!doc?.url) return null;
      return { key, label, url: doc.url as string };
    })
    .filter(Boolean) as Array<{ key: string; label: string; url: string }>;

  /** =========================
   * PDF HANDLERS
   ==========================*/
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || "");
  };

  const handleDownloadPdf = (url: string) => {
    download(url, token || "");
  };
  const openInBlankTab = async (url: string) => {
    await download(url, token || "");
  };

  /** =========================
   * Stauss and Roles
   ==========================*/
  const STATUS_BADGE_CLASS: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800 border border-blue-300",
    forwarded: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    rejected: "bg-red-100 text-red-800 border border-red-300",
    reverted: "bg-red-100 text-red-800 border border-red-300",
    approved: "bg-green-100 text-green-800 border border-green-300",
  };

  const liquidationStatusLabel = getWorkflowMovementStatusLabel(liquidationData, {
    workflowStatus: workflowStatus || liquidationData?.workflowStatus,
  });

  /** =========================
   * UI EMPTY
   ==========================*/
  if (!liquidationData) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600">
              No liquidation data available
            </h2>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative pb-28">
      <div className="space-y-4 mt-4 pb-5 mb-5">
        <PreviousCommentCard
          visible={canShowActions}
          commentText={previousCommentText}
          commentByName={previousCommentUserName}
          commentByRole={previousCommentUserRole}
          commentAtText={
            previousCommentEntry?.created_at
              ? moment(previousCommentEntry.created_at).format("DD MMM, YYYY hh:mm a")
              : ""
          }
          documents={previousCommentDocuments}
          onViewDocument={openInBlankTab}
          onDownloadDocument={openInBlankTab}
        />
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h3
                className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Basic Society Information
              </h3>
            </div>

            {/* <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(
                  `/history/liquidations/${liquidationData?.id}`,
                  {
                    state: {
                      societyName:
                        liquidationData.society_name,
                    },
                  },
                )
              }
            >
              View Full History
            </Button> */}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              {liquidationData?.statusObj && (
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full whitespace-normal ${STATUS_BADGE_CLASS[liquidationData.statusObj.key] ||
                    "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                >
                  {liquidationStatusLabel}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Society Name
              </label>
              <p className="text-gray-900 font-medium">
                {liquidationData.society_name || "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Registration Number
              </label>
              <p className="text-gray-900 font-medium">
                {liquidationData.society_registration_number || "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Society Type
              </label>
              <p className="text-gray-900 font-medium">
                {liquidationData?.societyType?.title || "-"}
              </p>
            </div>
          </div>
        </Card>

        {user?.role !== "applicant" && (
          <Card>
            <p className="text-gray-900 font-medium">
              Created By: {liquidationData?.createdByUser?.first_name || ""}{" "}
              {liquidationData?.createdByUser?.last_name || ""}
            </p>
            <p className="text-gray-500">
              {liquidationData?.createdByUser?.email || "-"}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <h3
                className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Meeting and Notice Details
              </h3>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Address
              </label>
              <p className="text-gray-900">{society?.full_address || "-"}</p>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Original Registration Date
              </label>
              <p className="text-gray-900">
                {liquidationData.date_of_original_registration
                  ? moment(
                    liquidationData.date_of_original_registration,
                  ).format("DD-MM-YYYY")
                  : "-"}
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <h3
                className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}
              >
                Liquidation Details
              </h3>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Order Number
              </label>
              <p className="text-gray-900">
                {liquidationData.liquidation_order_number || "-"}
              </p>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Order Date
              </label>
              <p className="text-gray-900">
                {liquidationData.date_of_liquidation_order
                  ? moment(liquidationData.date_of_liquidation_order).format(
                    "DD-MM-YYYY",
                  )
                  : "-"}
              </p>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Mode
              </label>
              <p className="text-gray-900">
                {liquidationData.mode_of_liquidation || "-"}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-orange-600 mr-2" />
            <h3
              className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}
            >
              Reason for Liquidation
            </h3>
          </div>
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {liquidationData.reason_for_liquidation?.trim() || "-"}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
            JT RCS Documents
          </h3>
          {jtRcsDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {jtRcsDocuments.map((doc: { key: string; sequence?: number | null; label: string; url: string; issuedMediaId?: string; stamped?: boolean }) => (
                <div
                  key={`${doc.key}-${doc.sequence || ""}-${doc.issuedMediaId || doc.url}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {String(doc.label || "").replace(/\s*\(step\s+\d+\)/gi, "")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {doc.url.toLowerCase().includes(".pdf") && (
                      <Button size="sm" variant="outline" onClick={() => viewPdf(doc.url)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(doc.url)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No JT RCS documents uploaded</div>
          )}
        </Card>
        <Card>
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <h3
              className={`text-sm font-semibold text-gray-900 ${mode}:text-gray-100`}
            >
              Uploaded Documents
            </h3>
          </div>

          {uploadedDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocuments.map(({ key, label, url }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <div className="flex space-x-2">
                    {url.toLowerCase().includes(".pdf") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewPdf(url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(url)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No documents available</p>
          )}
        </Card>
      </div>

      <ProcessingHistoryPanel
        resourcePath="liquidations"
        resourceId={liquidationData?.id}
        embeddedHistory={liquidationData?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={liquidationData?.id ?? ""}
        entity={liquidationData}
        workflowStatus={workflowStatus}
        currentUserId={user?.id}
        onRefresh={fetchData}
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
        key={`${modalOpen}-${isRejectModal
            ? rejectDocuments.join(",")
            : approvalDocuments.join(",")
          }`}
        loading={loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Return Liquidation'
            : liquidationData?.workflowStatus?.next === null
              ? 'Approve Liquidation'
              : 'Forward Liquidation'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this liquidation.'
            : liquidationData?.workflowStatus?.next === null
              ? 'Are you sure you want to approve this liquidation?'
              : 'Are you sure you want to forward this liquidation?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={approvalDocuments}
        rejectDocuments={rejectDocuments}
        next={workflowStatus?.next}
        onSubmit={(msg, docs, meta) =>
          callWorkflowAction(isRejectModal ? "back" : "approve", msg, docs, meta?.bypass)
        }
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
