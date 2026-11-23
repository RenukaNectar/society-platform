import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card } from "../ui/Card";
import Spinner from "../spinner/Spinner";
import { getAssignmentHistory } from "../../lib/data/workflows/api";
import { isApplicantWorkflowRole } from "../../lib/workflow/assigneeUsers";
import { RootState } from "../../store";
import { formatAssigneeName } from "../../utils/workflowReassign";

interface AssignmentHistoryPanelProps {
  moduleName: string;
  resourceId: string;
}

export const AssignmentHistoryPanel: React.FC<AssignmentHistoryPanelProps> = ({
  moduleName,
  resourceId,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const isApplicant = isApplicantWorkflowRole(userRoleName);

  useEffect(() => {
    if (isApplicant || !resourceId || !moduleName) {
      setRows([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getAssignmentHistory(resourceId, moduleName);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [resourceId, moduleName, isApplicant]);

  if (isApplicant) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mb-4 p-4">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (!rows.length) {
    return null;
  }

  return (
    <Card className="mb-4 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Assignment History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">From</th>
              <th className="py-2 pr-4">To</th>
              <th className="py-2 pr-4">By</th>
              <th className="py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString()
                    : "—"}
                </td>
                <td className="py-2 pr-4 capitalize">{row.action_type?.replace(/_/g, " ") ?? "—"}</td>
                <td className="py-2 pr-4">{formatAssigneeName(row.previousAssignee)}</td>
                <td className="py-2 pr-4">{formatAssigneeName(row.newAssignee)}</td>
                <td className="py-2 pr-4">{formatAssigneeName(row.assignedByUser)}</td>
                <td className="py-2 text-gray-600 max-w-xs truncate" title={row.reason ?? ""}>
                  {row.reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
