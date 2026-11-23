import { api } from "../../api";

/** ============================
 * GET WORKFLOW STATUS
============================ */
export const getWorkflowStatus = async (
  resourceId: string,
  moduleName: string
) => {
  const res = await api.get(
    `/workflows/${resourceId}/status`,
    { moduleName }
  );

  return res?.data;
};

/** ============================
 * UPDATE WORKFLOW
============================ */
export const updateWorkflow = async (payload: any) => {
  const res = await api.post(`/workflows/update`, payload);
  return res;
};

/** ============================
 * REASSIGN (when current assignee unavailable)
============================ */
export interface ReassignWorkflowPayload {
  resourceId: string;
  moduleName: string;
  newAssigneeUserId: string;
  reason: string;
}

export const reassignWorkflow = async (payload: ReassignWorkflowPayload) => {
  return api.post(`/workflows/reassign`, payload);
};

/** ============================
 * ASSIGNMENT HISTORY
============================ */
export const getAssignmentHistory = async (
  resourceId: string,
  moduleName: string
) => {
  const res = await api.get(
    `/workflows/${resourceId}/assignment-history`,
    { moduleName }
  );
  return res?.data ?? [];
};
