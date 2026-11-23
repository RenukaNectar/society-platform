import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import themeSlice from "./slices/themeSlice";
import notificationSlice from "./slices/notificationSlice";
import applicationSlice from "./slices/applicationSlice";
import userSlice from "./slices/userSlice";
import resgistrationSlice from "./slices/registrationSlice";
import permissionSlice from "./slices/permissionSlice";
import statusSlice from "./slices/statusSlice";
import conversionSlice from "./slices/conversionSlice";
import societyReducer from "./slices/societySlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    notifications: notificationSlice,
    applications: applicationSlice,
    users: userSlice,
    registrations: resgistrationSlice,
    conversionSocieties: conversionSlice,
    permissions: permissionSlice,
    statuses: statusSlice,
    society: societyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
