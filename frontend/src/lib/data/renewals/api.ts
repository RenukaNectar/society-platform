import { api } from "../../api";

/** GET ALL RENEWALS */
export const getAllRenewals = async () => {
  const res = await api.get("/society-renewals");
  return res?.data;
};

/** GET RENEWALS BY SOCIETY */
export const getRenewalsBySocietyId = async (societyId: string) => {
  const res = await api.get(`/society-renewals/society/${societyId}`);
  return res?.data;
};

export const getSocietyRenewals = async (): Promise<any> => {
  const response = await api.get(`/society-renewals`);
  return response;
};

/** CREATE RENEWAL */

export const createRenewal = async (societyId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("society_id", societyId);
  formData.append("challan_url", file); // IMPORTANT: file key is challan_url

  const response = await api.post("/society-renewals", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response?.data;
};


/** UPDATE RENEWAL */
export const updateRenewal = async (id: string, payload: any) => {
  const res = await api.put(`/society-renewals/${id}`, payload);
  return res?.data;
};

/** DELETE RENEWAL (remove challan before workflow starts) */
export const deleteRenewal = async (id: string) => {
  const res = await api.delete(`/society-renewals/${id}`);
  return res?.data;
};