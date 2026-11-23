import { FileText } from "lucide-react";
import { Card } from "../ui/Card";
import { IssuedAgmProceedingsDocumentActions } from "./IssuedAgmProceedingsDocumentActions";

type IssuedAgmProceedingsCardProps = {
  url?: string | null;
  hasDocumentReference?: boolean;
  subtitle?: string;
  darkMode?: boolean;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
};

export const IssuedAgmProceedingsCard = ({
  url,
  hasDocumentReference = false,
  subtitle = "Official proceedings document issued with verification QR code and SD-RCS Authorized Signatory upon RCS approval.",
  darkMode = false,
  onView,
  onDownload,
}: IssuedAgmProceedingsCardProps) => {
  if (!url && !hasDocumentReference) {
    return null;
  }

  return (
    <Card>
      <div className="p-6">
        <h3
          className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-2 flex items-center`}
        >
          <FileText className="h-5 w-5 mr-2 text-emerald-600" />
          Issued AGM Proceedings
        </h3>
        <p
          className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {subtitle}
        </p>
        {url ? (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-600" />
              <div>
                <p
                  className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  AGM Proceedings (Issued)
                </p>
                <p
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  QR verified · SD-RCS Authorized Signatory
                </p>
              </div>
            </div>
            <IssuedAgmProceedingsDocumentActions
              url={url}
              onView={onView}
              onDownload={onDownload}
            />
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Issued proceedings document reference recorded.
          </p>
        )}
      </div>
    </Card>
  );
};
