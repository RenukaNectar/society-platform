import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversionSociety } from "../../types/index.ts";

interface ConversionState {
  conversions: ConversionSociety[];
  loading: boolean;
}

const initialState: ConversionState = {
  conversions: [],
  loading: false,
};

const conversionSlice = createSlice({
  name: "conversionSocieties",
  initialState,
  reducers: {
    setConversions: (state, action: PayloadAction<ConversionSociety[]>) => {
      state.conversions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setConversions, setLoading } = conversionSlice.actions;
export default conversionSlice.reducer;
