import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { AnnualReturnModule } from './pages/modules/AnnualReturnModule';
import { AmendmentModule } from './pages/modules/AmendmentModule';
import { PlaceholderModule } from './pages/modules/PlaceholderModule';
import { OtpVerification } from './pages/auth/OtpVerification';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { RegistrationModule } from './pages/modules/RegistrationModule';
import { AuditTrailModule } from './pages/modules/AuditTrailModule';
import { ElectionrequestModule } from './pages/modules/ElectionrequestModule';
import { LiquidationModule } from './pages/modules/LiquidationModule';
import { EnquiryInspectionModule } from './pages/modules/EnquiryInspectionModule';
import { AppealModule } from './pages/modules/AppealModule';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { RegistrationDetails } from './pages/details/RegistrationDetails';
import { AnnualFilingDetails } from './pages/details/AnnualFilingDetails';
import { AnnualFilingForm } from './pages/forms/AnnualFilingForm';
import { AmendmentDetails } from './pages/details/AmendmentDetails';
import { AuditRequestDetails } from './pages/details/AuditRequestDetails';
import { ElectionRequestDetails } from './pages/details/ElectionRequestDetails';
import { LiquidationDetails } from './pages/details/LiquidationDetails';
import { EnquiryInspectionDetails } from './pages/details/EnquiryInspectionDetails';
import { AppealDetails } from './pages/details/AppealDetails';
import { PublicRoute } from './routes/PublicRoute';
import { CheckMail } from './pages/auth/CheckMail';
import { ResetPassword } from './pages/auth/ResetPassword';
const SocietyRegistrationForm = lazy(() =>
  import('./components/forms/SocietyRegistrationForm').then((m) => ({
    default: m.SocietyRegistrationForm,
  }))
);
import { MySociety } from './pages/MySociety';
import { BusinessActivityModule } from './pages/modules/BusinessActivityModule';
import { BusinessActivityDetails } from './pages/details/BusinessActivityDetails';
import { AuditRequestForm } from './pages/forms/AuditRequestForm';
import { ElectionRequestForm } from './pages/forms/ElectionRequestForm';
import { EnquiryInspectionForm } from './pages/forms/EnquiryInspectionForm';
import { BoardOfDirectorsModule } from './pages/modules/BoardOfDirectorsModule';
import { SpecialAnnualGeneralMeetingModule } from './pages/modules/SpecialAnnualGeneralMeetingModule';
import { SpecialAnnualGeneralMeetingDetails } from './pages/details/SpecialAnnualGeneralMeetingDetails';
import { SpecialAnnualGeneralMeetingFormPage } from './pages/forms/SpecialAnnualGeneralMeetingFormPage';
import { AnnualGeneralMeetingModule } from './pages/modules/AnnualGeneralMeetingModule';
import { AnnualGeneralMeetingFormPage } from './pages/forms/AnnualGeneralMeetingFormPage';
import { AppealForm } from './pages/forms/AppealForm';
import { Auditors } from './pages/modules/Auditors';
import { Permissions } from './pages/Permissions';
import { Roles } from './pages/Roles';
import { Modules } from './pages/modules/Modules';
import { RenewalsModule } from './pages/modules/RenewalsModule';
import { RenewalDetail } from './pages/details/RenewalDetail';
import { ConversionApprovalDetails } from './pages/details/ConversionSocietyDetails';
import { ConversionSocietyModule } from './pages/modules/ConversionModule';
import { ConversionForm } from './pages/forms/ConversionForm';
import { AnnualGeneralMeetingDetail } from './pages/details/AnnualGeneralMeetingDetail';
import { BodMeetingModule } from './pages/modules/BodMeetingModule';
import { BodMeetingFormPage } from './pages/forms/BodMeetingFormPage';
import { BodMeetingDetail } from './pages/details/BodMeetingDetail';

function App() {
  const theme = localStorage.getItem('theme') || 'light';
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className={`min-h-screen bg-gray-200`}>
          <div className={`bg-white ${theme}:bg-gray-900 rounded-xl h-[100vh]`}>
            <Routes>
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />

              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />

              <Route path="/otp-verification" element={
                <PublicRoute>
                  <OtpVerification />
                </PublicRoute>
              } />

              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />

              <Route path="/check-mail" element={
                <PublicRoute>
                  <CheckMail />
                </PublicRoute>
              } />

              <Route path="/reset-password" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />

              <Route
                path="registrations/new"
                element={
                  <Suspense
                    fallback={
                      <div className="flex min-h-[40vh] items-center justify-center text-gray-600 text-sm">
                        Loading registration form…
                      </div>
                    }
                  >
                    <SocietyRegistrationForm />
                  </Suspense>
                }
              />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="modules" element={<Modules />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="roles" element={<Roles />} />
                <Route path="society/:societyId/conversion" element={<ConversionForm />} />
                <Route path="society/:societyId/conversion/:conversionId" element={<ConversionForm />} />
                <Route path="conversion-society" element={<ConversionSocietyModule />} />
                <Route path="conversion-society/:societyId" element={<ConversionApprovalDetails />} />
                <Route path="registrations" element={<RegistrationModule />} />
                <Route path="registrations/:id" element={<RegistrationDetails />} />
                <Route path="annual-filings" element={<AnnualReturnModule />} />
                <Route path="annual-filings/new" element={<AnnualFilingForm />} />
                <Route path="annual-filings/:id" element={<AnnualFilingDetails />} />
                <Route path="annual-filings/:id/edit" element={<AnnualFilingForm />} />
                <Route path="amendments" element={<AmendmentModule />} />
                <Route path="amendments/:id" element={<AmendmentDetails />} />
                <Route path="audit-requests" element={<AuditTrailModule />} />
                <Route path="audit-requests/:id" element={<AuditRequestDetails />} />
                <Route path="audit-requests/new" element={<AuditRequestForm />} />
                <Route path="audit-requests/:id/edit" element={<AuditRequestForm />} />
                <Route path="election-requests" element={<ElectionrequestModule />} />
                <Route path="election-requests/new" element={<ElectionRequestForm />} />
                <Route path="election-requests/:id" element={<ElectionRequestDetails />} />
                <Route path="election-requests/:id/edit" element={<ElectionRequestForm />} />
                <Route path="liquidation" element={<LiquidationModule />} />
                <Route path="liquidations/:id" element={<LiquidationDetails />} />
                <Route path="inquiries" element={<EnquiryInspectionModule />} />
                <Route path="inquiries/new" element={<EnquiryInspectionForm />} />
                <Route path="inquiries/:id" element={<EnquiryInspectionDetails />} />
                <Route path="inquiries/:id/edit" element={<EnquiryInspectionForm />} />
                <Route path="auditors" element={<Auditors />} />
                <Route path="appeals" element={<AppealModule />} />
                <Route path="appeals/new" element={<AppealForm />} />
                <Route path="appeals/:id" element={<AppealDetails />} />
                <Route path="appeals/:id/edit" element={<AppealForm />} />
                <Route path="profile" element={<Profile />} />
                <Route path="my-society" element={<MySociety />} />
                <Route path="sector-of-operation" element={<BusinessActivityModule />} />
                <Route path="sector-of-operation/:id" element={<BusinessActivityDetails />} />
                <Route path="annual-general-meeting" element={<AnnualGeneralMeetingModule />} />
                <Route path="annual-general-meeting/new" element={<AnnualGeneralMeetingFormPage />} />
                <Route path="annual-general-meeting/:id" element={<AnnualGeneralMeetingDetail />} />
                <Route path="annual-general-meeting/:id/edit" element={<AnnualGeneralMeetingFormPage />} />
                <Route path="renewals" element={<RenewalsModule />} />
                <Route path="renewals/:societyId" element={<RenewalDetail />} />
                <Route path="board-of-directors" element={<BoardOfDirectorsModule />} />
                <Route path="board-of-directors/meetings" element={<BodMeetingModule />} />
                <Route path="board-of-directors/meetings/new" element={<BodMeetingFormPage />} />
                <Route path="board-of-directors/meetings/:id" element={<BodMeetingDetail />} />
                {/* Notification deep links use this path (see backend notifications config). */}
                <Route path="board-of-directors-meeting/:id" element={<BodMeetingDetail />} />
                <Route path="special-annual-general-meeting" element={<SpecialAnnualGeneralMeetingModule />} />
                <Route path="special-annual-general-meeting/new" element={<SpecialAnnualGeneralMeetingFormPage />} />
                <Route path="special-annual-general-meeting/:id" element={<SpecialAnnualGeneralMeetingDetails />} />
                <Route path="notifications" element={
                  <PlaceholderModule
                    title="Notifications"
                    description="View and manage your notifications"
                  />
                }
                />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
                duration: 4000,
              }}
            />
          </div>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
