import React from "react";
import { AlertCircle, Download, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { handleViewPdf } from "../../utils/viewpdf";
import type { DeletedAmendmentMember } from "../../types";

type DeletedShareholdersSectionProps = {
  deletedMembers?: DeletedAmendmentMember[] | null;
  handleDownloadPdf: (url: string, filename: string) => void;
};

export const DeletedShareholdersSection: React.FC<DeletedShareholdersSectionProps> = ({
  deletedMembers,
  handleDownloadPdf,
}) => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { token } = useSelector((state: RootState) => state.auth);
  const list = Array.isArray(deletedMembers) ? deletedMembers : [];

  if (list.length === 0) return null;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <h3
            className={`text-lg font-semibold ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Deleted Shareholders
          </h3>
          <span className="text-sm text-gray-500 ml-2">({list.length})</span>
        </div>
        <div className="space-y-3">
          {list.map((member, index) => (
            <div
              key={member.member_id || index}
              className="p-3 border border-red-100 rounded-lg bg-red-50"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {member?.name || "-"}
                    {member?.mobile ? ` (${member.mobile})` : ""}
                  </p>
                  <p className="text-xs text-gray-600">
                    {[member?.designation, member?.gender, member?.category]
                      .filter(Boolean)
                      .join(" • ") || "-"}
                  </p>
                  <p className="text-sm text-gray-800 mt-2">
                    <span className="font-medium">Reason:</span>{" "}
                    {member?.deletion_reason || "-"}
                  </p>
                </div>
                {member?.supportingDocumentMedia?.url && (
                  <div className="flex items-center gap-2">
                    {member.supportingDocumentMedia.url
                      ?.split(".")
                      .pop()
                      ?.toLowerCase() === "pdf" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleViewPdf(
                            member.supportingDocumentMedia!.url,
                            token || "",
                          )
                        }
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
                          member.supportingDocumentMedia!.url,
                          member.supportingDocumentMedia?.original_name ||
                            member.supportingDocumentMedia?.file_name ||
                            "deletion-document.pdf",
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
      </div>
    </Card>
  );
};
