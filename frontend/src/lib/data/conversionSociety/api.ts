import { api } from "../../api";

export const createSocietyConversion = (data: any) => {
  return api.post("/society-conversions", data).then((response: any) => {
    if (!response?.success) {
      throw new Error(response?.message || "Failed to create conversion");
    }
    return response;
  });
};

export const getConversionById = async (societyId: string) => {
  return api.get(`/society-conversions/${societyId}`);
};
interface GetConversionSocietiesParams {
  registration_number?: string;
  status?: string;
  reference_year?: string;
  from?: string;
  to?: string;
  page?: number;
}

export const getConversionSocieties = async (
  params: GetConversionSocietiesParams,
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );

  return api.get("/society-conversions", cleanParams);
};

export const resubmitSocietyConversion = (id: string, data: any) => {
  return api.post(`/society-conversions/${id}/resubmit`, data).then((res) => {
    if (!res?.success) {
      throw new Error(res?.message || "Failed to resubmit conversion");
    }
    return res;
  });
};
