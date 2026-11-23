import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Application, DashboardStats } from '../../types';

interface ApplicationState {
  applications: Application[];
  stats: DashboardStats;
  loading: boolean;
}

const initialState: ApplicationState = {
  applications: [],
  stats: {
    totalApplications: 0,
    pendingApprovals: 0,
    upcomingElections: 0,
    auditDue: 0,
  },
  loading: false,
};

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setApplications: (state, action: PayloadAction<Application[]>) => {
      state.applications = action.payload;
    },
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setApplications, setStats, setLoading } = applicationSlice.actions;
export default applicationSlice.reducer;