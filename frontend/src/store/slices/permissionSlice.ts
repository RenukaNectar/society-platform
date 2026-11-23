import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Permission {
  resource: string;
  action: string;
}

interface PermissionState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    // Directly store backend permissions
    setPermissions: (
      state,
      action: PayloadAction<Permission[] | undefined | null>,
    ) => {
      state.permissions = Array.isArray(action.payload) ? action.payload : [];
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    clearPermissions: (state) => {
      state.permissions = [];
      state.lastUpdated = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setPermissions,
  clearPermissions,
  setLoading,
  setError,
  clearError,
} = permissionSlice.actions;

export default permissionSlice.reducer;
