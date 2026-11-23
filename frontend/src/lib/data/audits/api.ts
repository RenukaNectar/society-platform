import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

// Get all audit requests with pagination
export const getAuditRequests = (params: any): Promise<any> => {
    return api.get<any>('/audit-requests', params).then((response: any) => {
        if (response.success) {
            return response.data;
        }
        return false
    });
};

// Get single audit request by ID
export const getAuditRequestById = (id: string): Promise<any> => {
    return api.get<any>(`/audit-requests/${id}`).then((response: any) => {
        if (response.success) {
            return response.data;
        }
        return false;
    });
};

// Create new audit request
export const createAuditRequest = (data: any): Promise<any> => {
    return api.post<any>('/audit-requests', data).then((response: any) => {
        return response;
    });
};

// Update audit request
export const updateAuditRequest = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/audit-requests/${id}`, data).then((response: any) => {
        if (!response.data) {
            throw new Error('Audit request not found');
        }
        return response.data;
    });
};

// Delete audit request
export const deleteAuditRequest = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/audit-requests/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete audit request');
        }
        return response.data;
    });
};

// Update audit request status
export const updateAuditRequestStatus = (id: string, status_id: any, comments: any): Promise<any> => {
    return api.put<any>(`/audit-requests/${id}/status`, { status_id, comments }).then((response: any) => {
        if (response?.success) {
            toast.success(response?.message)
          } else {
            toast.error(response?.message)
          }
        return response.data;
    });
};

// Legacy functions for backward compatibility
export const getAudits = getAuditRequests;
export const getAuditById = getAuditRequestById;
export const createAudit = createAuditRequest;
export const updateAudit = updateAuditRequest;
export const deleteAudit = deleteAuditRequest;
export const updateAuditStatus = updateAuditRequestStatus;
export const allAudits = getAuditRequests;

/** Rejected and taken out of the workflow: returned from step 2, or rejected on the final step. */
export const isAuditReturnedToApplicant = (audit: any): boolean => {
  const statusKey = audit?.statusDetails?.key || audit?.status?.key;
  if (statusKey !== 'rejected') return false;
  if (audit?.workflowStatus) {
    return !audit.workflowStatus.current && !audit.workflowStatus.next;
  }
  return audit?.workflow_status == null || audit?.workflow_status === '';
};