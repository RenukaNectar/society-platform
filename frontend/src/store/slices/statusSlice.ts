import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Status {
  id: string;
  key: string;
  title: string;
}

interface StatusState {
  statuses: Status[];
  loading: boolean;
}

const initialState: StatusState = {
  statuses: [],
  loading: false,
};

const statusSlice = createSlice({
  name: 'statuses',
  initialState,
  reducers: {
    setStatuses: (state, action: PayloadAction<Status[]>) => {
      state.statuses = action.payload;
    },
    setStatusLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setStatuses, setStatusLoading } = statusSlice.actions;
export default statusSlice.reducer;
