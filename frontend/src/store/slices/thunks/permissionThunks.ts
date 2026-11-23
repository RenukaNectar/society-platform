import { store } from "../../index"; 
import { api } from "../../../lib/api";
import { getRolePermissions } from "../../../lib/data/rbac/api";
import {
  setPermissions,
  setLoading,
  setError,
} from "../../slices/permissionSlice";

export const fetchPermissionsByRole = async (roleId: string) => {
  const dispatch = store.dispatch; 

  try {
    dispatch(setLoading(true));

    let list: any[] = [];

    try {
      const res = await getRolePermissions(roleId);
      if (Array.isArray(res)) {
        list = res;
      }
    } catch {
      const res = await api.get(`/rbac/${roleId}/permissions`);
      const payload =
        res?.data?.permissions ??
        res?.data?.data ??
        res?.data;

      if (Array.isArray(payload)) {
        list = payload;
      }
    }

    dispatch(setPermissions(list));
    return { success: true, data: list };
  } catch (err) {
    dispatch(setError("Failed to load permissions"));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};