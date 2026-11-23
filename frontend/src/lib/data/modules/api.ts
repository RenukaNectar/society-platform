import { api } from "../../api";

// 1️⃣ Get All Modules
export const getAllModules = (params?: any) => {
  return api.get("/master-data/modules", { params });
};

// 2️⃣ Get All Workflows
export const getModuleWorkflows = (params?: any) => {
  return api.get("/module-workflows", { params });
};

// 3️⃣ Get Workflow By ID
export const getWorkflowById = (id: string) => {
  return api.get(`/module-workflows/${id}`);
};

// 4️⃣ Get Workflow By Module
export const getWorkflowsByModule = (moduleId: string) => {
  return api.get(`/module-workflows/module/${moduleId}`);
};

// 5️⃣ Create Workflow
export const createWorkflow = (payload: any) => {
  return api.post("/module-workflows", payload);
};

// 6️⃣ Update Workflow
export const updateWorkflow = (id: string, payload: any) => {
  return api.put(`/module-workflows/${id}`, payload);
};

// 7️⃣ Toggle Status
export const toggleWorkflowStatus = (id: string, active: boolean) => {
  return api.patch(`/module-workflows/${id}/status`, { active });
};

// 8️⃣ Delete Workflow
export const deleteWorkflow = (id: string) => {
  return api.delete(`/module-workflows/${id}`);
};
