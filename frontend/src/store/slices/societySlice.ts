import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SocietyState {
  isCertificateIssued: boolean;
  statusKey: string | null;
}

const initialState: SocietyState = {
  isCertificateIssued: false,
  statusKey: null,
};

const societySlice = createSlice({
  name: "society",
  initialState,
  reducers: {
    setSocietyStatus: (state, action: PayloadAction<string | null>) => {
      state.statusKey = action.payload;
      state.isCertificateIssued = action.payload === "certificate_issued";
    },
    clearSocietyStatus: (state) => {
      state.statusKey = null;
      state.isCertificateIssued = false;
    },
  },
});

export const { setSocietyStatus, clearSocietyStatus } = societySlice.actions;
export default societySlice.reducer;