import { Eye, Download } from "lucide-react";
import { Button } from "../ui/Button";

type IssuedAgmProceedingsDocumentActionsProps = {
  url?: string | null;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
  disabled?: boolean;
};

export const IssuedAgmProceedingsDocumentActions = ({
  url,
  onView,
  onDownload,
  disabled = false,
}: IssuedAgmProceedingsDocumentActionsProps) => {
  if (!url) {
    return (
      <span className="text-xs text-gray-500 italic">Pending issuance</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onView(url)}
        title="View issued proceedings"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onDownload(url)}
        title="Download issued proceedings"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
