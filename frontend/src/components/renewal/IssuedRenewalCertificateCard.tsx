import { FileText } from "lucide-react";
import { Card } from "../ui/Card";
import { IssuedAgmProceedingsDocumentActions } from "../meeting/IssuedAgmProceedingsDocumentActions";

type IssuedRenewalCertificateCardProps = {
  url?: string | null;
  issuedOn?: string | null;
  subtitle?: string;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
};

export const IssuedRenewalCertificateCard = ({
  url,
  issuedOn,
  subtitle = "Official renewal certificate issued with verification QR code and SD-RCS Authorized Signatory upon DRCS/ARCS final approval.",
  onView,
  onDownload,
}: IssuedRenewalCertificateCardProps) => {
  if (!url) return null;

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
        <FileText className="w-5 h-5 mr-2 text-emerald-600" />
        Issued Renewal Certificate
      </h3>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Renewal Certificate</p>
          <p className="text-xs text-gray-500">
            QR verified · SD-RCS Authorized Signatory
          </p>
          {issuedOn && (
            <p className="text-xs text-gray-500 mt-1">
              Issued on: {new Date(issuedOn).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <IssuedAgmProceedingsDocumentActions
          url={url}
          onView={onView}
          onDownload={onDownload}
        />
      </div>
    </Card>
  );
};
