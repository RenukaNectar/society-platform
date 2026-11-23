import { FileText, Eye, Download } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { download } from "../../utils/download";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";

export const RenewalDetails = ({
  renewal,
  onViewDocument,
}: {
  renewal: any;
  onViewDocument?: (url: string) => void;
}) => {
  const { token, user } = useSelector((state: RootState) => state.auth);

  if (!renewal) return null;

  const society = renewal?.society;

  const handleDownloadPdf = (url: string) => {
    download(url, token || "");
  };

  const renewalStatusKey = renewal?.statusDetails?.key;
  const isRenewalWorkflowComplete =
    renewalStatusKey === "renewal_certificate_issued";
  const isApplicantUser = user?.role === "applicant";
  const canShowRenewalChallanCard =
    !!renewal?.challan_url &&
    (isApplicantUser
      ? isRenewalWorkflowComplete
      : !isRenewalWorkflowComplete);

  const renewalCertificateUrl =
    renewal?.renewal_certificate_url ||
    renewal?.certificateMedia?.url ||
    renewal?.renewalCertificateMedia?.url ||
    renewal?.renewal_certificate?.url ||
    null;

  const isCertificateIssued = isRenewalWorkflowComplete;
  const certificateUrl = renewal?.previousCommentDocuments[0]?.url || null;

  const canShowCertificate =
    !!certificateUrl &&
    (isCertificateIssued ||
      renewal?.workflowStatus?.next?.allowedRole?.id === user?.role_id);

  const STATUS_BADGE_CLASS: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800 border border-blue-300",
    forwarded: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    rejected: "bg-red-100 text-red-800 border border-red-300",
    reverted: "bg-red-100 text-red-800 border border-red-300",

    renewal_challan_uploaded:
      "bg-purple-100 text-purple-800 border border-purple-300",

    renewal_certificate_issued:
      "bg-green-100 text-green-800 border border-green-300",
  };

  const renewalStatusLabel = getWorkflowMovementStatusLabel(renewal);

  return (
    <div className="my-4 space-y-4">
      {/* ================= HEADER CARD ================= */}
      <Card className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          {/* LEFT SIDE */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {society?.cooperative_society_name || "—"}
              </h1>

              {renewal?.statusDetails && (
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full whitespace-normal max-w-xl ${STATUS_BADGE_CLASS[renewal.statusDetails.key] ||
                    "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                >
                  {renewalStatusLabel}
                </span>
              )}
            </div>

            <p className="text-gray-600">
              Registration No:{" "}
              <span className="font-medium">
                {society?.registration_number || "—"}
              </span>
            </p>
            <p className="text-gray-600">
              Address:{" "}
              <span className="font-medium">{renewal?.societyAddress?.address || "—"}</span>
            </p>
          </div>

          {/* RIGHT SIDE */}
          {/* <div className="text-right flex flex-col items-end gap-2">
            <div>
              <p className="text-sm text-gray-500">Society ID</p>
              <p className="font-semibold">{society?.society_id || "—"}</p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/history/renewals/${renewal.id}`, {
                  state: {
                    societyName: renewal.society?.cooperative_society_name,
                  },
                })
              }
            >
              View Full History
            </Button>
          </div> */}
        </div>
      </Card>

      {/* ================= CHALLAN CARD ================= */}
      {canShowRenewalChallanCard && (
          <Card className="p-4 flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Challan Uploaded
              </h3>
              <p className="text-sm text-gray-500">
                Challan has been uploaded successfully
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDocument?.(renewal?.challan_url)}
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(renewal.challan_url)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      {/* {isCertificateIssued && renewalCertificateUrl && (
        <Card className="p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Issued Renewal Certificate
            </h3>
            <p className="text-sm text-gray-500">
              QR verified · SD-RCS Authorized Signatory
            </p>
            {renewal?.certificate_issue_date && (
              <p className="text-sm text-gray-500">
                Issued on:{" "}
                {new Date(renewal.certificate_issue_date).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" },
                )}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewPdf(renewalCertificateUrl)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPdf(renewalCertificateUrl)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )} */}

      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="flex items-center font-semibold">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Renewal
          </h3>

          {canShowCertificate && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => certificateUrl && onViewDocument?.(certificateUrl)}
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  certificateUrl && handleDownloadPdf(certificateUrl)
                }
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Status & Date row */}
        <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-2">
          <span>
            <strong>Status:</strong>{" "}
            {renewalStatusLabel || "—"}
          </span>

          <span>
            <strong>Submitted on:</strong>{" "}
            {renewal?.submit_date
              ? new Date(renewal.submit_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "—"}
          </span>
        </div>
      </Card>
    </div>
  );
};
