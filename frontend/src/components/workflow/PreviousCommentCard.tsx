import React from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, Paperclip, Eye, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { isApplicantWorkflowRole } from '../../lib/workflow/assigneeUsers';
import { RootState } from '../../store';

interface PreviousCommentDocument {
  key: string;
  label: string;
  mediaId: string;
  url: string;
}

interface PreviousCommentCardProps {
  commentText?: string;
  commentByName?: string;
  commentByRole?: string;
  commentAtText?: string;
  documents?: PreviousCommentDocument[];
  visible?: boolean;
  onViewDocument?: (url: string) => void;
  onDownloadDocument?: (url: string) => void;
}

const formatRoleLabel = (role?: string) =>
  role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

export const PreviousCommentCard: React.FC<PreviousCommentCardProps> = ({
  commentText,
  commentByName,
  commentByRole,
  commentAtText,
  documents = [],
  visible = true,
  onViewDocument,
  onDownloadDocument,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;

  if (isApplicantWorkflowRole(userRoleName)) {
    return null;
  }

  if (!visible || !commentText?.trim()) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 border-l-4 border-l-blue-500 shadow-sm">
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold text-blue-900">Previous Role Comment</h4>
            {commentAtText && (
              <span className="text-xs text-blue-700">{commentAtText}</span>
            )}
          </div>

          {(commentByName || commentByRole) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {commentByName && (
                <span className="text-xs font-medium text-gray-700">by {commentByName}</span>
              )}
              {commentByRole && (
                <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800">
                  {formatRoleLabel(commentByRole)}
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">
            {commentText}
          </p>

          {documents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                Attached Documents
              </p>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={`${doc.mediaId}-${doc.key}`}
                    className="flex items-center justify-between gap-2 bg-white/80 border border-blue-100 rounded-md px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 truncate">
                        {doc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => onViewDocument?.(doc.url)}
                        title="View in new tab"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => onDownloadDocument?.(doc.url)}
                        title="Download in new tab"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
