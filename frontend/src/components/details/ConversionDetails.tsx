import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import { Eye, Download, FileText, AlertCircle } from "lucide-react";

import { RootState } from "../../store";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { getConversionById } from "../../lib/data/conversionSociety/api";
import { handleViewPdf } from "../../utils/viewpdf";
import { download } from "../../utils/download";
import { getWorkflowMovementStatusLabel } from "../../utils/workflowMovementStatusLabel";
import { AdditionalDetails } from "./AdditionalDetails";
import {
  hasConversionFormData,
  normalizeConversionFormData,
} from "../../utils/conversionFormData";

/* ================= DOCUMENT CONFIG ================= */

const conversionDocumentConfig = [
  { key: "noticeSgbmMedia", label: "Notice of SGBM" },
  { key: "minutesMeetingMedia", label: "Minutes of Meeting" },
  { key: "attendanceSheetMedia", label: "Attendance Sheet" },
  { key: "formGMedia", label: "Form G" },
  { key: "byeLawsMedia", label: "New Byelaws" },
  { key: "auditReportMedia", label: "Audit Report" },
];

/* ================= STATUS BADGE ================= */

const getStatusBadge = (key?: string) => {
  switch (key) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "forwarded":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "resubmitted":
      return "bg-blue-100 text-blue-800 border border-blue-300";
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

/* ================= SOCIETY CERT / BYE-LAW CARDS ================= */

type DocActionCardProps = {
  title: string;
  subtitle?: string;
  metaRight?: string;
  url?: string | null;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
};

const DocActionCard: React.FC<DocActionCardProps> = ({
  title,
  subtitle,
  metaRight,
  url,
  onView,
  onDownload,
}) => {
  if (!url) return null;

  return (
    <Card className="p-4 border border-gray-200 bg-white shadow-sm rounded-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="w-7 h-7 shrink-0 text-green-600" aria-hidden />
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {subtitle ? (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 shrink-0">
          {metaRight ? (
            <p className="text-sm text-gray-500 sm:text-right whitespace-nowrap">
              {metaRight}
            </p>
          ) : null}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-label="View document"
              onClick={() => onView(url)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-label="Download document"
              onClick={() => onDownload(url)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

/* ================= COMPONENT ================= */

export const ConversionDetails: React.FC<{ conversion?: any }> = ({
  conversion: initialConversion,
}) => {
  const { societyId } = useParams<{ societyId: string }>();
  const { token } = useSelector((s: RootState) => s.auth);

  const [conversion, setConversion] = useState<any>(initialConversion || null);
  const [loading, setLoading] = useState<boolean>(!initialConversion);

  useEffect(() => {
    if (initialConversion) {
      setConversion(initialConversion);
      setLoading(false);
    }
  }, [initialConversion]);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (initialConversion) return;
    if (!societyId) {
      setLoading(false);
      return;
    }

    const fetchConversion = async () => {
      try {
        const res: any = await getConversionById(societyId);

        setConversion(res?.data || null);
      } catch {
        toast.error("Failed to load conversion details");
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();
  }, [societyId, initialConversion]);

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || "");
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string) => {
    download(url, token || "");
  };

  if (loading) return <Card className="p-6 text-center">Loading…</Card>;
  if (!conversion)
    return <Card className="p-6 text-center">No conversion found</Card>;

  const society = conversion.society;
  const certificateMedia =
    conversion.certificateMedia || society?.certificateMedia;
  const certUrl = certificateMedia?.url as string | undefined;

  const notificationMedia =
    conversion.notificationMedia ||
    conversion.notification_media ||
    society?.notificationMedia ||
    society?.notification_media ||
    null;
  const notificationUrl = notificationMedia?.url as string | undefined;

  const issuedByName = [
    society?.catificateIssuedByUser?.first_name,
    society?.catificateIssuedByUser?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const issuedOnRaw =
    society?.certificate_issue_date ||
    society?.certicficate_date ||
    certificateMedia?.created_at ||
    society?.updated_at;

  const issuedOnLabel =
    issuedOnRaw != null && issuedOnRaw !== ""
      ? `Issued on: ${moment(issuedOnRaw).format("DD MMM, YYYY hh:mm a")}`
      : undefined;

  const byeLawMedia = society?.byeLawsMedia || conversion.byeLawsMedia;
  const byeLawUrl = byeLawMedia?.url as string | undefined;

  return (
    <div className="space-y-4 mt-4">
      {/* ================= HEADER ================= */}
      <Card className="p-4">
        <div className="flex justify-between items-start">
          {/* LEFT SIDE */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {conversion.society?.cooperative_society_name}
              </h1>

              {conversion.statusDetails && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-normal max-w-xl ${getStatusBadge(
                    conversion.statusDetails.key,
                  )}`}
                >
                  {getWorkflowMovementStatusLabel(conversion)}
                </span>
              )}
            </div>

            <p className="text-gray-600 mt-1">
              Registration No: {conversion.society?.registration_number}
            </p>
            <p className="text-gray-600 mt-1">
              Address: {conversion.societyAddress
                ?.address || "—"}
            </p>
          </div>

          {/* RIGHT SIDE */}
          {/* <div className="text-right flex flex-col items-end gap-2">
            <div>
              <p className="text-sm text-gray-500">Society ID</p>
              <p className="font-semibold">{conversion.society?.society_id}</p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(`/history/conversion-society/${conversion.id}`, {
                  state: {
                    societyName: conversion.society?.cooperative_society_name,
                  },
                })
              }
            >
              View Full History
            </Button>
          </div> */}
        </div>
      </Card>

      {/* ================= NOTIFICATION / CERTIFICATE / BYE-LAW ================= */}
      <Card className="p-4 border border-gray-200 bg-white shadow-sm rounded-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <FileText className="w-7 h-7 shrink-0 text-green-600" aria-hidden />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Notification
              </h3>
              {notificationMedia?.updated_at ? (
                <p className="text-sm text-gray-500 mt-0.5">
                  Issued on:{" "}
                  {moment(notificationMedia.updated_at).format(
                    "DD MMM, YYYY hh:mm a",
                  )}
                </p>
              ) : null}
              {/* // : (
              //   // <p className="text-sm text-gray-500 mt-0.5">Not available</p>
              // )} */}
            </div>
          </div>
          <div className="flex gap-2 justify-end shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-label="View notification"
              disabled={!notificationUrl}
              onClick={() => notificationUrl && viewPdf(notificationUrl)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-label="Download notification"
              disabled={!notificationUrl}
              onClick={() => notificationUrl && handleDownloadPdf(notificationUrl)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {(certUrl || byeLawUrl) && (
        <div className="space-y-3">
          <DocActionCard
            title="Certificate Issued"
            subtitle={
              issuedByName ? `Certificate issued by: ${issuedByName}` : undefined
            }
            metaRight={issuedOnLabel}
            url={certUrl}
            onView={viewPdf}
            onDownload={handleDownloadPdf}
          />
          <DocActionCard
            title="New Byelaws"
            url={byeLawUrl}
            onView={viewPdf}
            onDownload={handleDownloadPdf}
          />
        </div>
      )}

      {/* ================= CONVERSION DETAILS ================= */}
      <Card className="p-4 bg-white">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
          Conversion Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Conversion From</span>
            <p className="font-medium">{conversion.conversionFrom?.name}</p>
          </div>

          <div>
            <span className="text-gray-500">Conversion To</span>
            <p className="font-medium">{conversion.conversionTo?.name}</p>
          </div>

          <div>
            <span className="text-gray-500">Status</span>
            <p className="font-medium">
              {getWorkflowMovementStatusLabel(conversion)}
            </p>
          </div>

          <div>
            <span className="text-gray-500">Submitted On</span>
            <p className="font-medium">
              {moment(conversion.created_at).format("DD MMM YYYY, hh:mm A")}
            </p>
          </div>
        </div>

        {hasConversionFormData(conversion.data) && (
          <div className="mt-4">
            <AdditionalDetails
              additionalData={normalizeConversionFormData(conversion.data)}
              title="Conversion Form Details"
              useConversionLabels
            />
          </div>
        )}

        {/* ================= DOCUMENTS ================= */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
