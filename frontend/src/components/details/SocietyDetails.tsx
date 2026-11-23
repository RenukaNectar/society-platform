/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { AlertCircle, Upload } from "lucide-react";
import {
  Building2,
  MapPin,
  Users,
  FileText,
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Trash2,
} from "lucide-react";
import newSociety from "../../assets/images/newSociety.png";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ProcessingHistoryPanel } from "../workflow/ProcessingHistoryPanel";
import { getResourceHistory } from "../../lib/data/history/api";
import { handleViewPdf } from "../../utils/viewpdf";
import { ChallanUploadModal } from "./ChallanUploadModal";
import {
  // getSocietyRenewals,
  // getSocietyRenewalsBySocietyId,
  issueCertificate,
} from "../../lib/data/registrations/api";
import { download } from "../../utils/download";
import moment from "moment";
import { AdditionalDetails } from "./AdditionalDetails";
import {
  generateSocietyDetailsPDF,
  downloadPDF,
} from "../../utils/pdfGenerator";
import { getConversionById } from "../../lib/data/conversionSociety/api";
import { RenewalChallanUploadModal } from "./RenewalChallanUploadModal";
import { getSettings } from "../../lib/data/settings/api";
// import { HistoryFlowPage, mapApiHistoryToFlow } from "../submissionHistory/HistoryFlowPage";
import CertificateIssuedGuard from "../guard/CertificateIssuedGuard";
import Spinner from "../spinner/Spinner";
import ActionPermissionGuard from "../guard/ActionPermissionGuard";
import { PreviousCommentCard } from "../workflow/PreviousCommentCard";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";
import { useConversionMeetingEligibility } from "../../hooks/conversion/useConversionMeetingEligibility";
import {
  hasConversionFormData,
  normalizeConversionFormData,
} from "../../utils/conversionFormData";
import { getAnnualGeneralMeetings } from "../../lib/data/annualGeneralMeetings/api";
import { deleteRenewal } from "../../lib/data/renewals/api";
import { IssuedAgmProceedingsDocumentActions } from "../meeting/IssuedAgmProceedingsDocumentActions";
import { IssuedRenewalCertificateCard } from "../renewal/IssuedRenewalCertificateCard";
import { openDocument } from "../../utils/download";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import {
  isApplicantChallanReuploadStep,
  needsApplicantChallanAction,
} from "../../utils/societyRegistrationChallan";
import {
  isClassAShareholder,
  isClassBShareholder,
  isCoOptedBodCategory,

} from "../../utils/meetingBodMembers";
import { Select } from "../ui/Select";

const NotFoundBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300 rounded-full">
    Not Found
  </span>
);

const displayOrNotFound = (value: unknown) => {
  if (value === null || value === undefined) return <NotFoundBadge />;
  if (typeof value === "string" && value.trim() === "") return <NotFoundBadge />;
  return value;
};

const SOCIETY_DOCUMENT_FIELDS: { key: string; label: string }[] = [
  { key: "bye_laws", label: "Bye-law" },
  { key: "bank_certificate", label: "Bank Certificate" },
  { key: "economic_scheme", label: "Economic Scheme" },
  { key: "contributor_list", label: "Promoter List" },
  { key: "custom_documents", label: "Custom Documents" },
  { key: "non_family_coop_certificate", label: "Non-family coop certificate" },
  { key: "site_inspection_report", label: "Site Inspection Report" },
  { key: "circular_minutes_of_meeting", label: "Circular Minutes of Meeting" },
  { key: "land_document", label: "Land Document" },
  {
    key: "full_particulars_of_the_promoter",
    label: "Full Particulars of the Promoter",
  },
  {
    key: "circular_for_promoters_meeting",
    label: "Circular for Promoters’ Meeting",
  },
  {
    key: "minutes_of_meeting_of_promoters_meeting",
    label: "Minutes of Meeting of Promoters’ Meeting",
  },
];

const getStatusBadgeClass = (statusKey: string) => {
  switch (statusKey) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "forwarded":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "resubmit":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    // case "approved":
    // case "registrar_approved":
    //   return "bg-green-100 text-green-800 border border-green-300";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-300";
    // case "registrar_rejected":
    //   return "bg-red-100 text-red-800 border border-red-300";
    // case "requested":
    //   return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "challan_pending":
      return "bg-orange-100 text-orange-800 border border-orange-300";
    case "challan_uploaded":
      return "bg-purple-100 text-purple-800 border border-purple-300";
    // case "challan_rejected":
    //   return "bg-red-100 text-red-800 border border-red-300";
    case "certificate_issued":
      return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};

const getConversionStatusBadge = (key?: string) => {
  switch (key) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const SocietyDetails = ({
  societyData,
  loading,
  user,
  reload,
}: {
  societyData: any;
  loading: boolean;
  user: any;
  reload?: () => void;
}) => {
  const society = societyData?.society ? societyData?.society : null;
  const members = societyData?.members || [];
  console.log(members);
  const classAShareholders = members.filter((member: any) =>
    isClassAShareholder(member.shareholder_category),
  );
  const coOptedBodMembers = members.filter((member: any) =>
    isCoOptedBodCategory(member.shareholder_category),
  );
  const classBShareholders = members.filter((member: any) =>
    isClassBShareholder(member.shareholder_category),
  );
  const promoterMembers = members.filter(
    (member: any) =>
      !member?.is_co_opted &&
      !isClassAShareholder(member.shareholder_category) &&
      !isClassBShareholder(member.shareholder_category),
  );
  const classAListingMembers = [
    ...promoterMembers.map((member: any) => ({
      ...member,
      memberListingType: "Society Promoter",
    })),
    ...classAShareholders.map((member: any) => ({
      ...member,
      memberListingType: "Class A Shareholder",
    })),
  ];
  const createdByUser = societyData?.user ? societyData?.user : null;
  const navigate = useNavigate();
  const isApplicantUser = user?.role === "applicant";
  const conversionMeetingEligibility = useConversionMeetingEligibility(
    isApplicantUser,
  );

 
  const { statuses } = useSelector((state: RootState) => state.statuses);
  const { token } = useSelector((state: RootState) => state.auth);
  const [currentStatus, setCurrentStatus] = useState(society?.status);
  const [history, setHistory] = useState<any[]>([]);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [isRenewalChallanModalOpen, setIsRenewalChallanModalOpen] =
    useState(false);
  const [showRemoveRenewalChallanModal, setShowRemoveRenewalChallanModal] =
    useState(false);
  const [removingRenewalChallan, setRemovingRenewalChallan] = useState(false);
  const [certificateIssueLoading, setCertificateIssueLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settingValue, setsettingValue] = useState();
  const societyId = society?.id;
  const [conversion, setConversion] = useState<any>(null);
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [approvedAgmProceedings, setApprovedAgmProceedings] = useState<any[]>([]);
  const [issuedRenewalCertificates, setIssuedRenewalCertificates] = useState<any[]>([]);
  const statusKey =
    currentStatus?.key || society?.status?.key || society?.statusDetails?.key;
  const applicantNeedsChallanAction =
    isApplicantUser && needsApplicantChallanAction(society, statusKey);
  const displayStatusKey =
    applicantNeedsChallanAction &&
    statusKey === "rejected" &&
    isApplicantChallanReuploadStep(society)
      ? "challan_pending"
      : statusKey;
  const notificationMedia =
    society?.notificationMedia || society?.notification_media;

  const certificateLastdate = moment(
    society?.certificateMedia?.created_at,
  ).isSameOrBefore(moment().subtract(settingValue, "months"));
  
  const hasRenewalChallanUploaded = !!society?.renewal_challan_receipt?.url;
  const renewalChallanStatusKey =
    society?.renewal_challan_receipt?.status_key ?? null;
  const isRenewalWorkflowComplete =
    renewalChallanStatusKey === "renewal_certificate_issued";
  const hasActiveRenewalChallan =
    hasRenewalChallanUploaded && !isRenewalWorkflowComplete;
  const canRemoveRenewalChallan =
    isApplicantUser &&
    hasActiveRenewalChallan &&
    renewalChallanStatusKey === "renewal_challan_uploaded";

  const showConversionResubmitSection =
    conversion?.statusDetails?.key === "resubmit" ||
    conversion?.statusDetails?.key === "rejected";
   
  /** Roles that receive the application after applicant re-submit (seq 1 → DRCS/ARCS district). */
  const RESUBMIT_NEXT_STEP_ROLES = new Set([
    "drcs_arcs_district",
    "arcs_drcs_district",
  ]);
  const workflowNext = society?.workflowStatus?.next;
  const workflowNextRoleNames = [
    workflowNext?.allowedRole?.name,
    workflowNext?.assignedToRole?.name,
    ...(workflowNext?.allowedRoles || []).map((r: { name?: string }) => r?.name),
    ...(workflowNext?.assignedToRoles || []).map(
      (r: { name?: string }) => r?.name,
    ),
  ].filter(Boolean) as string[];
  const isNextStepArcsDrcsDistrict = workflowNextRoleNames.some((name) =>
    RESUBMIT_NEXT_STEP_ROLES.has(name),
  );
  // Final reject to applicant clears workflow_status (next/current null); still allow full resubmit.
  const isFinalRejectAwaitingResubmit =
    statusKey === "rejected" &&
    !workflowNext &&
    !society?.workflowStatus?.current &&
    !isApplicantChallanReuploadStep(society);
  const canShowResubmitApplication =
    isApplicantUser &&
    statusKey === "rejected" &&
    !isApplicantChallanReuploadStep(society) &&
   (  society?.workflow_status == null) &&
    (isNextStepArcsDrcsDistrict || isFinalRejectAwaitingResubmit);

  // const isCertificateIssued = society?.status?.key === "certificate_issued";

  const isConversionWorkflowCompleted =
    conversion?.workflowStatus?.next === null;

  const hasNoActiveConversion =
    !conversion?.id || isConversionWorkflowCompleted;

  const canShowRequestConversionButton =
    !loadingConversion &&
    hasNoActiveConversion &&
    (!isApplicantUser || conversionMeetingEligibility.isEligible);

  const MemberTypes: { label: string; value: string }[] =[
    {
      label: "ShareHolder Member",
      value: "promoter_member",
    },
    {
      label: "Class A Shareholder",
      value: "class_a_shareholder",
    },
    {
      label: "Class B Nominal Shareholder",
      value: "class_b_shareholder",
    },
    {
      label: "Co-opted BOD Member",
      value: "co_opted_bod_member",
    },
  ]

  const [membersSelected, setMembersSelected] = useState<string>("promoter_member");
  useEffect(() => {
    if (!society?.renewals) {
      setIssuedRenewalCertificates([]);
      return;
    }

    const renewals = Array.isArray(society.renewals)
      ? society.renewals
      : [society.renewals];

    setIssuedRenewalCertificates(
      renewals.filter(
        (renewal: any) =>
          Boolean(renewal?.renewal_certificate_url) &&
          renewal?.statusDetails?.key === "renewal_certificate_issued",
      ),
    );
  }, [society?.renewals]);
  useEffect(() => {
    const handleSetting = async () => {
      const getsettings = await getSettings();

      setsettingValue(getsettings?.settings[0]?.value);
    };
    handleSetting();
  }, []);

  console.log(coOptedBodMembers);
  useEffect(() => {
    if (!societyId) return;

    const fetchConversion = async () => {
      setLoadingConversion(true);

      try {
        const res: any = await getConversionById(societyId);
       
        if (res?.success && res?.data) {
          setConversion(res.data);
        } else {
          setConversion(null);
        }
      } catch (error: any) {
        if (
          error?.message?.includes("not found") ||
          error?.message?.includes("Society conversion not found")
        ) {
          setConversion(null);
        } else {
          console.error("Conversion fetch error:", error);
        }
      } finally {
        setLoadingConversion(false);
      }
    };

    fetchConversion();
  }, [societyId]);

  useEffect(() => {
    const loadApprovedAgmProceedings = async () => {
      if (!societyId || !isApplicantUser) {
        setApprovedAgmProceedings([]);
        return;
      }

      try {
        const response = await getAnnualGeneralMeetings({
          society_id: societyId,
          page: 1,
          limit: 50,
        });
        const meetings = response.data?.meetings || [];
        setApprovedAgmProceedings(
          meetings.filter(
            (meeting) =>
              meeting.issuedProceedingsDocument?.url ||
              meeting.issued_proceedings_document_id,
          ),
        );
      } catch (error) {
        console.error("Failed to load approved AGM proceedings:", error);
      }
    };

    loadApprovedAgmProceedings();
  }, [societyId, isApplicantUser]);

  const conversionDocumentConfig = [
    { key: "noticeSgbmMedia", label: "Notice of SGBM" },
    { key: "minutesMeetingMedia", label: "Minutes of Meeting" },
    { key: "attendanceSheetMedia", label: "Attendance Sheet" },
    { key: "formGMedia", label: "Form G" },
    { key: "byeLawsMedia", label: "Bye Laws" },
    { key: "auditReportMedia", label: "Audit Report" },
  ];

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || "");
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string) => {
    download(url, token || "");
  };

  const handleRemoveRenewalChallan = async () => {
    const renewalId = society?.renewal_challan_receipt?.id;
    if (!renewalId) {
      toast.error("Renewal challan not found");
      return;
    }

    setRemovingRenewalChallan(true);
    try {
      await deleteRenewal(renewalId);
      toast.success("Renewal challan removed successfully");
      setShowRemoveRenewalChallanModal(false);
      reload?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to remove renewal challan";
      toast.error(message);
    } finally {
      setRemovingRenewalChallan(false);
    }
  };

  useEffect(() => {
    setCurrentStatus(society?.status);
  }, [society]);

  useEffect(() => {
    if (!society?.id) return;
    getResourceHistory("societies", society.id).then(setHistory);
  }, [society?.id]);

  // const historyFlowItems = mapApiHistoryToFlow(history);

  const handleIssueCertificate = async (societyId: string) => {
    setCertificateIssueLoading(true);
    try {
      const result = await issueCertificate(societyId);

      if (result.success) {
        toast.success(result.message || "Certificate issued successfully!");
        setCurrentStatus(
          statuses.find((status: any) => status.key === "certificate_issued"),
        );
        reload?.();
      } else {
        throw new Error(result.message || "Failed to issue certificate");
      }
    } catch (error) {
      console.error("Error issuing certificate:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to issue certificate",
      );
      reload?.();
    } finally {
      setCertificateIssueLoading(false);
    }
  };

  const downloadSocietyDetails = async () => {
    setExporting(true);
    try {
      // Generate HTML content using the utility function
      const htmlContent = generateSocietyDetailsPDF(
        society,
        members,
        createdByUser,
        currentStatus,
      );

      // Download PDF using the utility function
      downloadPDF(htmlContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  type PreviousDoc = {
    key: string;
    label: string;
    mediaId: string;
    url: string;
  };

  const normalizePreviousCommentDocuments = (): PreviousDoc[] => {
    const base: PreviousDoc[] = [];

    const directDocs = Array.isArray((society as any)?.previousCommentDocuments)
      ? (society as any).previousCommentDocuments
      : [];
    if (directDocs.length > 0) {
      for (const d of directDocs) {
        const url = typeof d?.url === "string" ? d.url.trim() : "";
        if (!url) continue;
        base.push({
          key: String(d.key || d.mediaId || "document"),
          label: String(
            d.label ||
            String(d.key || "document")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          ),
          mediaId: String(d.mediaId || d.key || d.id || ""),
          url,
        });
      }
    } else {
      const attachments = history?.[0]?.attachments;
      if (attachments && typeof attachments === "object") {
        const fromHistory = Object.entries(
          attachments as Record<string, unknown>,
        ).flatMap(([key, value]) => {
          if (typeof value === "string" && value.trim()) {
            return [
              {
                key,
                label: key.replace(/_/g, " ").toUpperCase(),
                mediaId: key,
                url: value,
              },
            ];
          }
          if (value && typeof value === "object") {
            return Object.entries(value as Record<string, unknown>)
              .filter(([, nested]) => typeof nested === "string" && !!nested)
              .map(([nestedKey, nested]) => ({
                key: `${key}_${nestedKey}`,
                label: nestedKey.replace(/_/g, " ").toUpperCase(),
                mediaId: `${key}_${nestedKey}`,
                url: String(nested),
              }));
          }
          return [];
        });
        base.push(...fromHistory);
      }
    }

    const seenUrls = new Set(base.map((d) => d.url));
    const out = [...base];

    const appendSocietyMedia = (
      key: string,
      label: string,
      media: { id?: string; url?: string } | null | undefined,
    ) => {
      const url = media?.url?.trim();
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      out.push({
        key,
        label,
        mediaId: media?.id || key,
        url,
      });
    };

    appendSocietyMedia(
      "non_family_coop_certificate",
      "NON FAMILY COOP CERTIFICATE",
      society?.non_family_coop_certificate,
    );
    appendSocietyMedia(
      "site_inspection_report",
      "SITE INSPECTION REPORT",
      society?.site_inspection_report,
    );

    return out;
  };

  const previousCommentTextRaw =
    society?.workflowStatus?.previousComment || history?.[0]?.comments || "";
  const previousCommentDocuments = normalizePreviousCommentDocuments();
  const hasStickySocietyWorkflowDocs = !!(
    society?.non_family_coop_certificate?.url ||
    society?.site_inspection_report?.url
  );
  const displayPreviousCommentText =
    previousCommentTextRaw.trim() ||
    (hasStickySocietyWorkflowDocs
      ? "Non-family cooperative certificate and/or site inspection report are attached below."
      : "");

  // Assignee / active step (like conversion), OR any non-applicant when these society uploads exist so they always appear in this section
  const userRoleId = user?.role_id || user?.role?.id;
  const canShowPreviousCommentSection =
    !!society &&
    user?.role !== "applicant" &&
    (society.assigned_to_user_id
      ? society.assigned_to_user_id === user?.id
      : society?.workflowStatus?.next?.allowedRole?.id === userRoleId);
  const showPreviousCommentSection =
    !!society &&
    user?.role !== "applicant" &&
    (canShowPreviousCommentSection || hasStickySocietyWorkflowDocs);

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading society data...</p>
          </div>
        </Card>
      </div>
    );
  }

  const societyStatusLabel =
    displayStatusKey === "challan_pending"
      ? "Challan upload pending"
      : getWorkflowMovementStatusLabel(society, {
          statusKey: displayStatusKey || currentStatus?.key || statusKey,
          statusTitle:
            currentStatus?.title ??
            society?.status?.title ??
            society?.statusDetails?.title ??
            statuses.find(
              (s: { key?: string; title?: string }) =>
                s.key === (displayStatusKey || statusKey),
            )?.title ??
            displayStatusKey ??
            statusKey ??
            "",
        });

  return (
    <>
      <div className="my-4 mb-5 pb-5">
        {user?.role === "applicant" && !society ? (
          <Card className="flex">
            <img
              src={newSociety}
              alt="Society Logo"
              className="w-100 h-100 mx-auto mb-0 w-1/3"
            />
            <div className="w-2/3 p-4">
              <h3 className={`text-lg font-semibold text-gray-900 mb-3`}>
                Register Society
              </h3>
              <p className={`text-sm text-gray-500 mb-4`}>
                To register a cooperative society, you need to submit a joint
                application along with the society's bylaws to the Registrar of
                Cooperative Societies in the relevant state. The application
                should detail the society's purpose, membership, and operational
                plan. The Registrar will then review the application and bylaws,
                and if everything is in order, issue a registration certificate
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/registrations/new")}
                className="mt-4"
              >
                Register Your Society
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {society ? (
              <div className="space-y-4 mb-5 pb-5 pt-[5px]">
                {canShowResubmitApplication && (
                  <div className="p-3 bg-red-500 border-red-200 rounded-lg flex justify-between items-center">
                    <div className="w-[80%]">
                      <div className="flex items-center text-white">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Application is&nbsp;
                        <span className="font-bold">Return / Re-View</span>
                      </div>
                      {history?.length > 0 && (
                        <p className="ps-5 ms-2 text-white text-sm">
                          {history[0]?.comments || ""}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate("/registrations/new", {
                          state: { id: society?.id },
                        })
                      }
                      size="sm"
                    >
                      Re Submit Application
                    </Button>
                  </div>
                )}
                <PreviousCommentCard
                  visible={showPreviousCommentSection}
                  commentText={displayPreviousCommentText}
                  documents={previousCommentDocuments}
                  onViewDocument={viewPdf}
                  onDownloadDocument={handleDownloadPdf}
                />
                {/* Header Card */}
                <Card className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                  
                    <div>
                      <div className="flex items-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {society.cooperative_society_name}
                        </h1>

                        {(currentStatus || displayStatusKey) && (
                          <span
                            className={`text-sm font-medium px-3 py-1 rounded-full ms-3 whitespace-normal max-w-xl ${getStatusBadgeClass(
                              displayStatusKey || currentStatus?.key || statusKey || "",
                            )}`}
                          >
                            {societyStatusLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600">
                        {society.local_langauge_society_name &&
                          `${society.local_langauge_society_name} • `}
                        Registration No: {society.registration_number}
                      </p>

                      <h5 className="mt-2">
                        NCD ID: <strong>{society.ncd_id}</strong>
                      </h5>
                    </div>

                    
                  </div>
                  <div className="flex gap-2 justify-between mb-4 items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {society.functional_status?.name}
                      </span>
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        {society.is_profit_making === "yes"
                          ? "Profitable"
                          : "Non-Profitable"}
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                        {society.bank_type} Bank
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                        {society.sector_of_operation?.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {currentStatus?.key === "draft" &&
                        user?.role === "applicant" && (
                          <Button
                            variant="success"
                            onClick={() =>
                              navigate("/registrations/new", {
                                state: { id: society?.id },
                              })
                            }
                            size="sm"
                          >
                            Continue Draft
                          </Button>
                        )}

                      {/* Conversion Request */}
                      <CertificateIssuedGuard>
                        {canShowRequestConversionButton && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (!society?.id) {
                                toast.error("Invalid society");
                                return;
                              }
                              navigate(`/society/${society.id}/conversion`);
                            }}
                          >
                            Request for Conversion
                          </Button>
                        )}
                      </CertificateIssuedGuard>

                      {user?.role === "applicant" && (
                        <Button
                          variant="primary"
                          onClick={downloadSocietyDetails}
                          size="sm"
                          disabled={exporting}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {exporting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            "Export as .pdf"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {user?.role !== "applicant" && (
                  <Card className="p-4">
                    <h5 className="flex items-center gap-2 flex-wrap">
                      Society Created by:{" "}
                      {createdByUser?.first_name || createdByUser?.last_name ? (
                        <>
                          {createdByUser?.first_name} {createdByUser?.last_name}
                        </>
                      ) : (
                        <NotFoundBadge />
                      )}
                    </h5>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {createdByUser?.email || <NotFoundBadge />}
                    </p>
                  </Card>
                )}

                {/* challan upload / re-upload (applicant only) */}
                {applicantNeedsChallanAction && (
                    <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          {society?.challan_receipt?.url
                            ? "Challan re-upload"
                            : "Challan upload"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {society?.challan_receipt?.url
                            ? "RCS has returned the application for challan correction. Upload a new challan PDF."
                            : "Upload challan to get your certificate issued"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {society?.challan_receipt?.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewPdf(society.challan_receipt.url)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsChallanModalOpen(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {society?.challan_receipt?.url
                            ? "Re-upload challan"
                            : "Upload challan"}
                        </Button>
                      </div>
                    </Card>
                  )}

                {notificationMedia && (
                    <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-green-600" />
                          Notification
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 text-right">
                          <div>
                            Issued on:{" "}
                            {moment(notificationMedia?.updated_at).format(
                              "DD MMM, YYYY hh:mm a",
                            )}
                          </div>
                        </div>
                        {notificationMedia && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPdf(notificationMedia.url)}
                            >
                              <Eye className="w-4 h-4 " />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(notificationMedia.url)}
                            >
                              <Download className="w-4 h-4 " />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                {/* {society?.status?.key == "certificate_issued" && */}
                <ActionPermissionGuard resource="renewals" action="create">
                  <CertificateIssuedGuard>
                    {/* {certificateLastdate && ( */}
                    <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <FileText
                            className={`w-5 h-5 mr-2 ${hasActiveRenewalChallan ? "text-green-600" : "text-blue-600"}`}
                          />
                          Renewal Challan
                        </h3>
                        <p className="text-sm text-gray-500">
                          {hasActiveRenewalChallan
                            ? "Renewal challan receipt is available for review"
                            : "Upload challan for Renewal the Challan"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasActiveRenewalChallan && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                viewPdf(society.renewal_challan_receipt.url)
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadPdf(
                                  society.renewal_challan_receipt.url,
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {canRemoveRenewalChallan && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                onClick={() =>
                                  setShowRemoveRenewalChallanModal(true)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {user?.role === "applicant" && !hasActiveRenewalChallan && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setIsRenewalChallanModalOpen(true)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Challan
                            </Button>
                          )}
                      </div>
                    </Card>
                    {/* )}  */}
                  </CertificateIssuedGuard>
                </ActionPermissionGuard>
                {/* } */}

                {/* challan uploaded - show view/download and certificate issue */}
                {society?.challan_receipt && (
                  <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Uploaded Challan
                      </h3>
                      <p className="text-sm text-gray-500">
                        Challan receipt is available for review
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPdf(society.challan_receipt.url)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadPdf(society.challan_receipt.url)
                        }
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {/* {user?.role === "rcs_district" && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={certificateIssueLoading}
                          onClick={() => handleIssueCertificate(society.id)}
                        >
                          <FileText className="w-4 h-5 mr-2" />
                          Issue Certificate
                        </Button>
                      )} */}
                    </div>
                  </Card>
                )}

                {/* certificate issued */}
                {currentStatus?.key === "certificate_issued" && (
                  <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Certificate Issued
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                        Certificate issued by:{" "}
                        {society?.catificateIssuedByUser?.first_name ||
                        society?.catificateIssuedByUser?.last_name ? (
                          <>
                            {society?.catificateIssuedByUser?.first_name}{" "}
                            {society?.catificateIssuedByUser?.last_name}
                          </>
                        ) : (
                          <NotFoundBadge />
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600 text-right">
                        <div>
                          Issued on:{" "}
                          {moment(society?.updated_at).format(
                            "DD MMM, YYYY hh:mm a",
                          )}
                        </div>
                      </div>
                      {society?.certificateMedia?.url ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              viewPdf(society.certificateMedia.url)
                            }
                          >
                            <Eye className="w-4 h-4 " />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadPdf(society.certificateMedia.url)
                            }
                          >
                            <Download className="w-4 h-4 " />
                          </Button>
                        </div>
                      ) : (
                        <NotFoundBadge />
                      )}
                    </div>
                  </Card>
                )}

                {issuedRenewalCertificates.map((renewal) => (
                  <IssuedRenewalCertificateCard
                    key={renewal.id}
                    url={renewal.renewal_certificate_url}
                    issuedOn={renewal.certificate_issue_date}
                    onView={(url) => openDocument(url, token || "")}
                    onDownload={(url) => openDocument(url, token || "")}
                  />
                ))}

                {isApplicantUser && approvedAgmProceedings.length > 0 && (
                  <Card className="p-4 pb-4 mb-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                        Approved AGM Proceedings
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Official proceedings issued with QR verification and
                        SD-RCS Authorized Signatory.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {approvedAgmProceedings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              AGM —{" "}
                              {meeting.meeting_date
                                ? moment(meeting.meeting_date).format(
                                    "DD MMM, YYYY",
                                  )
                                : "Meeting date unavailable"}
                            </p>
                            <p className="text-xs text-gray-500">
                              QR verified · SD-RCS Authorized Signatory
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <IssuedAgmProceedingsDocumentActions
                              url={meeting.issuedProceedingsDocument?.url}
                              onView={(url) => viewPdf(url)}
                              onDownload={(url) =>
                                openDocument(url, token || "")
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/annual-general-meeting/${meeting.id}`)
                              }
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {currentStatus?.key === "certificate_issued" && (
                  <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Bye-law
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      {society?.bye_laws?.url ? (
                        <div className="flex space-x-2">
                          {society.bye_laws.url?.split(".").pop() ===
                            "pdf" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewPdf(society.bye_laws.url)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDownloadPdf(society.bye_laws.url)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <NotFoundBadge />
                      )}
                    </div>
                  </Card>
                )}

                {/* {renewalData?.data[0]?.statusDetails?.key ===
                  "renewal_challan_uploaded" && (
                  <Card className="p-4 pb-0 flex justify-between items-center pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Renewal Challan Uploaded
                      </h3>
                      <p className="text-sm text-gray-500">
                        Challan has been uploaded successfully
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {society?.challan_receipt && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewPdf(society.challan_receipt.url)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadPdf(society.challan_receipt.url)
                            }
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {user?.role === "rcs_district" && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={certificateIssueLoading}
                          onClick={() => handleIssueCertificate(society.id)}
                        >
                          <FileText className="w-4 h-5 mr-2" />
                          Issue Certificate
                        </Button>
                      )}
                    </div>
                  </Card>
                )} */}

                {/* isConversionRejected */}
                {conversion && showConversionResubmitSection && (
                  <div className="p-3 bg-red-500 border-red-200 rounded-lg flex justify-between items-center mb-4">
                    <div className="w-[80%]">
                      <div className="flex items-center text-white">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Conversion Request is&nbsp;
                        <span className="font-bold">Returned / Re-View</span>
                      </div>

                      {conversion.approval_remarks && (
                        <p className="ps-7 mt-1 text-white text-sm">
                          {conversion.approval_remarks}
                        </p>
                      )}
                    </div>

                    {user?.role === "applicant" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/society/${society.id}/conversion/${conversion.id}`,
                          )
                        }
                      >
                        Re-Submit Conversion
                      </Button>
                    )}
                  </div>
                )}

                {!loadingConversion && conversion && (
                  <Card className="p-4 bg-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
                      Conversion Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Conversion From</span>
                        <p className="font-medium">
                          {conversion.conversionFrom?.name || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Conversion To</span>
                        <p className="font-medium">
                          {conversion.conversionTo?.name || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500">Status: </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm font-medium ${getConversionStatusBadge(
                            conversion.statusDetails?.key,
                          )}`}
                        >
                          {getWorkflowMovementStatusLabel(conversion) || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Submitted On</span>
                        <p className="font-medium">
                          {moment(conversion.created_at).format(
                            "DD MMM YYYY, hh:mm A",
                          )}
                        </p>
                      </div>
                    </div>

                    {hasConversionFormData(conversion.data) && (
                      <div className="mt-4">
                        <AdditionalDetails
                          additionalData={conversion.data}
                          title="Conversion Form Details"
                          useConversionLabels
                        />
                      </div>
                    )}

                    {/* Documents */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                      Documents
                    </h3>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {conversionDocumentConfig.map(({ key, label }) => {
                        const doc = (conversion as any)?.[key];

                        if (!doc || !doc.url) return null;

                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <p className="text-sm font-medium">{label}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewPdf(doc.url)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPdf(doc.url)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Basic Information */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Basic Details */}
                    {/* <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Registration Date
                          </span>
                          <p className="text-sm font-semibold text-gray-900">
                            {society.date_registration || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Reference Year
                          </span>
                          <p className="text-sm font-semibold text-gray-900">
                            {society.reference_year || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Location Type
                          </span>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {society.operation_area_location || "-"}
                          </p>
                        </div>
                        {society.locality_ward_code && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Ward No
                            </span>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {society.locality_ward_code?.ward_name || ""}{" "}
                              {society.locality_ward_code?.ward_code
                                ? `(${society.locality_ward_code?.ward_code})`
                                : ""}
                            </p>
                          </div>
                        )}
                        {society?.urban_local_body_type && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Urban Local Body
                            </span>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {society.urban_local_body_type?.local_body_name ||
                                ""}{" "}
                              {society.urban_local_body_type?.localbody_code
                                ? `(${society.urban_local_body_type?.localbody_code})`
                                : ""}
                            </p>
                          </div>
                        )}
                        {society?.urban_local_body_type && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Urban Local Body Type
                            </span>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {society.urban_local_body_type
                                ?.localbody_type_name || ""}{" "}
                              {society.urban_local_body_type
                                ?.localbody_type_code
                                ? `(${society.urban_local_body_type?.localbody_type_code})`
                                : ""}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Operation Area
                          </span>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {society.area_of_operation?.name || "-"}
                          </p>
                        </div>
                      </div>
                    </Card> */}

                    {/* Members */}
                    <Card className="p-4">
                      <div className="w-full flex justify-between items-center pb-8">
                    
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-purple-600" />
                          {membersSelected === "promoter_member"
                            ? "ShareHolders"
                            : membersSelected === "class_a_shareholder"
                              ? "Class A Shareholders & Society Promoters"
                              : membersSelected === "class_b_shareholder"
                                ? "Class B Shareholders"
                                : "Co-opted BOD Members"}{" "}
                          (
                          {membersSelected === "promoter_member"
                            ? promoterMembers.length
                            : membersSelected === "class_a_shareholder"
                              ? classAListingMembers.length
                              : membersSelected === "class_b_shareholder"
                                ? classBShareholders.length
                                : coOptedBodMembers.length}
                          )
                        </h3>
                        <Select value={membersSelected as string} onChange={(e) => setMembersSelected(e.target.value)}>
                          {MemberTypes.map((memberType) => (
                            <option value={memberType.value}>{memberType.label}</option>
                          ))}
                        </Select>
                      </div>
                        {membersSelected === "promoter_member" && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    S.No.
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Name
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Mobile
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Gender
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Category
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Designation
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Promoter Since
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {promoterMembers.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="py-4 text-sm text-gray-500 text-center"
                                    >
                                      Not Found
                                    </td>
                                  </tr>
                                ) : (
                                  promoterMembers.map(
                                    (member: any, index: number) => (
                                      <tr
                                        key={member.id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-3 text-sm text-gray-600">
                                          {index + 1}
                                        </td>
                                        <td className="py-3 text-sm font-medium text-gray-900">
                                          {member.name}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.mobile}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.gender}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.category}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.designation}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {new Date(
                                            member.created_at,
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    ),
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {membersSelected === "class_a_shareholder" && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    S.No.
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Name
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Mobile
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Gender
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Category
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Member Type
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Designation
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Promoter Since
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {classAListingMembers.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={8}
                                      className="py-4 text-sm text-gray-500"
                                    >
                                      No Class A Shareholders or Society Promoters
                                    </td>
                                  </tr>
                                ) : (
                                  classAListingMembers.map(
                                    (member: any, index: number) => (
                                      <tr
                                        key={member.id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-3 text-sm text-gray-600">
                                          {index + 1}
                                        </td>
                                        <td className="py-3 text-sm font-medium text-gray-900">
                                          {member.name}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.mobile}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.gender}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.category}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.memberListingType}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.designation || "-"}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.created_at
                                            ? new Date(
                                                member.created_at,
                                              ).toLocaleDateString()
                                            : "-"}
                                        </td>
                                      </tr>
                                    ),
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {membersSelected === "class_b_shareholder" && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    S.No.
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Name
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Mobile
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Gender
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Category
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {classBShareholders.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="py-4 text-sm text-gray-500"
                                    >
                                      No Class B Shareholders
                                    </td>
                                  </tr>
                                ) : (
                                  classBShareholders.map(
                                    (member: any, index: number) => (
                                      <tr
                                        key={member.id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-3 text-sm text-gray-600">
                                          {index + 1}
                                        </td>
                                        <td className="py-3 text-sm font-medium text-gray-900">
                                          {member.name}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.mobile}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.gender}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.category}
                                        </td>
                                      </tr>
                                    ),
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {membersSelected === "co_opted_bod_member" && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    S.No.
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Name
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Mobile
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Gender
                                  </th>
                                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Category
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {coOptedBodMembers.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="py-4 text-sm text-gray-500"
                                    >
                                      No Co-opted BOD Members
                                    </td>
                                  </tr>
                                ) : (
                                  coOptedBodMembers.map(
                                    (member: any, index: number) => (
                                      <tr
                                        key={member.id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-3 text-sm text-gray-600">
                                          {index + 1}
                                        </td>
                                        <td className="py-3 text-sm font-medium text-gray-900">
                                          {member.name}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.mobile}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 capitalize">
                                          {member.gender}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                          {member.category}
                                        </td>
                                      </tr>
                                    ),
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>

                    {/* <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                        Class A Shareholder ({classAShareholders.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                S.No.
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Name
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Mobile
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Gender
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Category
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {classAShareholders.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-4 text-sm text-gray-500"
                                >
                                  No Class A Shareholders
                                </td>
                              </tr>
                            ) : (
                              classAShareholders.map(
                                (member: any, index: number) => (
                                  <tr
                                    key={member.id}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="py-3 text-sm text-gray-600">
                                      {index + 1}
                                    </td>
                                    <td className="py-3 text-sm font-medium text-gray-900">
                                      {member.name}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600 capitalize">
                                      {member.mobile}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600 capitalize">
                                      {member.gender}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600">
                                      {member.category}
                                    </td>
                                  </tr>
                                ),
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card> */}

                    {/* <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-emerald-600" />
                        Class B Nominal Shareholder ({classBShareholders.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                S.No.
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Name
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Mobile
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Gender
                              </th>
                              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Category
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {classBShareholders.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-4 text-sm text-gray-500"
                                >
                                  No Class B Nominal Shareholders
                                </td>
                              </tr>
                            ) : (
                              classBShareholders.map(
                                (member: any, index: number) => (
                                  <tr
                                    key={member.id}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="py-3 text-sm text-gray-600">
                                      {index + 1}
                                    </td>
                                    <td className="py-3 text-sm font-medium text-gray-900">
                                      {member.name}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600 capitalize">
                                      {member.mobile}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600 capitalize">
                                      {member.gender}
                                    </td>
                                    <td className="py-3 text-sm text-gray-600">
                                      {member.category}
                                    </td>
                                  </tr>
                                ),
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card> */}

                    {/* Documents */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SOCIETY_DOCUMENT_FIELDS.map(({ key, label }) => {
                          const media = society?.[key];
                          const url = media?.url;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {label}
                                </p>
                              </div>
                              {url ? (
                                <div className="flex space-x-2">
                                  {url.split(".").pop() === "pdf" && (
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
                              ) : (
                                <NotFoundBadge />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Financial & Other Info */}
                  <div className="space-y-4">
                    {/* Financial Information */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Financial Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Annual Turnover
                          </span>
                          <p className="text-lg font-bold text-green-600">
                            ₹
                            {Number(
                              society?.annual_turnover,
                            ).toLocaleString() || "0"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Annual Loss
                          </span>
                          <p className="text-lg font-bold text-red-600">
                            ₹
                            {Number(society?.annual_loss).toLocaleString() ||
                              "0"}
                          </p>
                        </div>
                        {society.is_dividend_paid === "yes" && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Dividend Rate
                            </span>
                            <p className="text-lg font-bold text-blue-600">
                              {society?.dividend_rate || "0"}%
                            </p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Profit Making
                            </span>
                            <span
                              className={`text-sm font-semibold ${society?.is_profit_making === "yes" ? "text-green-600" : "text-red-600"}`}
                            >
                              {society?.is_profit_making === "yes"
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">
                              Dividend Paid
                            </span>
                            <span
                              className={`text-sm font-semibold ${society?.is_dividend_paid === "yes" ? "text-green-600" : "text-gray-600"}`}
                            >
                              {society?.is_dividend_paid === "yes"
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Address Information */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-green-600" />
                        Address & Location
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Full Address
                          </span>
                          <p className="text-sm text-gray-900">
                            {displayOrNotFound(society.full_address)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            State
                          </span>
                          <p className="text-sm text-gray-900">
                            {displayOrNotFound(society.state?.name)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            District
                          </span>
                          <p className="text-sm text-gray-900">
                            {displayOrNotFound(society.district?.name)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Pincode
                          </span>
                          <p className="text-sm text-gray-900">
                            {displayOrNotFound(society.pincode)}
                          </p>
                        </div>
                        {society.location_of_head_quarter === "rural" && (
                          <>
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Block
                              </span>
                              <p className="text-sm text-gray-900">
                                {displayOrNotFound(society.block?.name)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Gram Panchayat
                              </span>
                              <p className="text-sm text-gray-900">
                                {displayOrNotFound(society.gram_panchayat?.name)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Village
                              </span>
                              <p className="text-sm text-gray-900">
                                {displayOrNotFound(
                                  society.gram_panchayat?.village_name ||
                                    society.village_code,
                                )}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Audit Information */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                        Audit Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Financial Audit
                          </span>
                          <span
                            className={`text-sm font-semibold ${society?.financial_audit === "yes" ? "text-green-600" : "text-gray-600"}`}
                          >
                            {society?.financial_audit === "yes"
                              ? "Completed"
                              : "Not Done"}
                          </span>
                        </div>
                        {society?.financial_audit === "yes" && (
                          <>
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Audit Year
                              </span>
                              <p className="text-sm text-gray-900">
                                {displayOrNotFound(society?.audit_complete_year)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Audit Category
                              </span>
                              <p className="text-sm text-gray-900 capitalize">
                                {displayOrNotFound(society?.category_audit)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Legal Information */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                        Legal & Tax Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            MSME Registered
                          </span>
                          <p className="text-sm text-gray-900">
                            {society.is_msme === 1 || society.is_msme === true
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                        {(society.is_msme === 1 || society.is_msme === true) && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Udyam Number
                            </span>
                            <p className="text-sm font-mono text-gray-900">
                              {displayOrNotFound(society.udyam_no)}
                            </p>
                          </div>
                        )}
                        {/* <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            PAN Number
                          </span>
                          <p className="text-sm font-mono text-gray-900">
                            {society.pan_no}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            GST Number
                          </span>
                          <p className="text-sm font-mono text-gray-900">
                            {society.gst_no}
                          </p>
                        </div> */}
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Bank Type
                          </span>
                          <p className="text-sm text-gray-900 capitalize">
                            {displayOrNotFound(society.bank_type)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Bank Name
                          </span>
                          <p className="text-sm text-gray-900 capitalize">
                            {displayOrNotFound(
                              society.cooperative_society_bank?.name ||
                                society.other_bank?.name,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Number of Branches
                          </span>
                          <p className="text-sm text-gray-900">
                            {displayOrNotFound(society.how_many_branches)}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Administrative Info */}
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-red-600" />
                        Administrative
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Full-time Secretary
                          </span>
                          <span
                            className={`text-sm font-semibold ${society.full_time_secretary === "yes" ? "text-green-600" : "text-gray-600"}`}
                          >
                            {society.full_time_secretary === "yes"
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Secretary's Mobile Number
                          </span>
                          <span className="text-sm font-semibold text-gray-600">
                            {displayOrNotFound(
                              society.mobile_number_of_secretary,
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Created
                          </span>
                          <p className="text-sm text-gray-900">
                            {new Date(society.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Last Updated
                          </span>
                          <p className="text-sm text-gray-900">
                            {new Date(society.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {society?.additional_data && (
                  <AdditionalDetails
                    additionalData={society.additional_data}
                    title="Sector of Operation Details"
                    useConversionLabels
                  />
                )}
                {society?.id && (
                  <ProcessingHistoryPanel
                    resourcePath="societies"
                    resourceId={society.id}
                    embeddedHistory={history}
                    title="Processing History"
                  />
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <h1 className="text-2xl font-bold">No society found</h1>
                  <h3>Register your society first</h3>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Challan Upload Modal */}
      {society?.id && (
        <ChallanUploadModal
          isOpen={isChallanModalOpen}
          onClose={() => setIsChallanModalOpen(false)}
          societyId={society.id}
          onSuccess={async () => {
            setCurrentStatus(
              statuses.find((status: any) => status.key === "challan_uploaded"),
            );
            reload?.();
            setIsChallanModalOpen(false);
          }}
        />
      )}
      {society?.id && (
        <RenewalChallanUploadModal
          isOpen={isRenewalChallanModalOpen}
          onClose={() => setIsRenewalChallanModalOpen(false)}
          societyId={society.id}
          onSuccess={async () => {
            setCurrentStatus(
              statuses.find((status: any) => status.key === "challan_uploaded"),
            );
            reload?.();
            setIsRenewalChallanModalOpen(false);
          }}
        />
      )}
      <ConfirmationModal
        isOpen={showRemoveRenewalChallanModal}
        onClose={() => setShowRemoveRenewalChallanModal(false)}
        onConfirm={handleRemoveRenewalChallan}
        title="Remove Renewal Challan"
        message="Are you sure you want to remove the uploaded renewal challan? You can upload a new one after removing."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        loading={removingRenewalChallan}
      />
    </>
  );
};
