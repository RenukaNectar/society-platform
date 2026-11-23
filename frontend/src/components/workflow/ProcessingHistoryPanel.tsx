import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getResourceHistory,
  HistoryResourcePath,
  parseHistoryResponse,
} from "../../lib/data/history/api";
import { isApplicantWorkflowRole } from "../../lib/workflow/assigneeUsers";
import { RootState } from "../../store";
import { SubmissionHistory } from "../submissionHistory/history";

interface ProcessingHistoryPanelProps {
  resourcePath: HistoryResourcePath;
  resourceId?: string | null;
  /** Optional history already on the entity from detail GET */
  embeddedHistory?: unknown;
  title?: string;
}

export const ProcessingHistoryPanel: React.FC<ProcessingHistoryPanelProps> = ({
  resourcePath,
  resourceId,
  embeddedHistory,
  title = "Processing History",
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isApplicant = isApplicantWorkflowRole(userRoleName);

  useEffect(() => {
    if (isApplicant) {
      setHistory([]);
      return;
    }

    if (!resourceId) {
      setHistory([]);
      return;
    }

    if (Array.isArray(embeddedHistory) && embeddedHistory.length > 0) {
      setHistory(embeddedHistory);
      return;
    }

    const embedded = parseHistoryResponse({ history: embeddedHistory });
    if (embedded.length > 0) {
      setHistory(embedded);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getResourceHistory(resourcePath, resourceId)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourcePath, resourceId, embeddedHistory, isApplicant]);

  if (isApplicant) {
    return null;
  }

  if (!resourceId && !loading && history.length === 0) {
    return null;
  }

  return (
    <SubmissionHistory
      history={history}
      loading={loading}
      title={title}
    />
  );
};
