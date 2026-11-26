import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ScrollToTop from "./components/ScrollToTop";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admission = lazy(() => import("./pages/Admission"));
const Students = lazy(() => import("./pages/Students"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const DailyAttendanceReport = lazy(() => import("./pages/DailyAttendanceReport"));
const RevenueAnalysisReport = lazy(() => import("./pages/RevenueAnalysisReport"));
const Seats = lazy(() => import("./pages/Seats"));
const Shifts = lazy(() => import("./pages/Shifts"));
const FeePlans = lazy(() => import("./pages/FeePlans"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PublicAdmission = lazy(() => import("./pages/PublicAdmission"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionInvoice = lazy(() => import("./pages/SubscriptionInvoice"));
const Expenses = lazy(() => import("./pages/Expenses"));
const CollectFee = lazy(() => import("./pages/CollectFee"));
const PublicAttendance = lazy(() => import("./pages/PublicAttendance"));
const Support = lazy(() => import("./pages/Support"));

const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "260px", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
    Loading...
  </div>
);

const isAuthenticated = () => !!localStorage.getItem("lms_token");

const mustChangePassword = () => {
  try {
    const user = JSON.parse(localStorage.getItem("lms_user") || "{}");
    return !!user.mustChangePassword && user.role === "OWNER";
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (mustChangePassword()) {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); }
    catch { return {}; }
  })();
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }
  const roleSegment = user.role.toLowerCase();
  const nameSegment = (user.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <Navigate to={`/${roleSegment}/${nameSegment}/dashboard`} replace />;
};

const App = () => {
  // Prefetch frequently visited dashboard chunks during browser idle time
  useEffect(() => {
    if (!isAuthenticated()) return;
    const prefetch = () => {
      import("./pages/Dashboard");
      import("./pages/Students");
      import("./pages/Admission");
      import("./pages/Attendance");
      import("./pages/CollectFee");
      import("./pages/Payments");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated() ? (
              mustChangePassword() ? <Navigate to="/change-password" replace /> : <Navigate to="/dashboard" replace />
            ) : <Login />
          } />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/change-password" element={
            isAuthenticated() ? (
              mustChangePassword() ? <ChangePassword /> : <Navigate to="/dashboard" replace />
            ) : <Navigate to="/login" replace />
          } />

          {/* Public unauthenticated admission registration & attendance check-in pages */}
          <Route path="/public-admission" element={<PublicAdmission />} />
          <Route path="/public-attendance" element={<PublicAttendance />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RoleRedirect />} />
            <Route path="dashboard" element={<RoleRedirect />} />

            {/* Dynamic Nested Paths */}
            <Route path=":role/:name/dashboard" element={<Dashboard />} />
            <Route path=":role/:name/admission" element={<Admission />} />
            <Route path=":role/:name/students" element={<Students />} />
            <Route path=":role/:name/attendance" element={<Attendance />} />
            <Route path=":role/:name/payments" element={<Payments />} />
            <Route path=":role/:name/reports" element={<Reports />} />
            <Route path=":role/:name/reports/daily-attendance" element={<DailyAttendanceReport />} />
            <Route path=":role/:name/reports/revenue" element={<RevenueAnalysisReport />} />
            <Route path=":role/:name/seats" element={<Seats />} />
            <Route path=":role/:name/shifts" element={<Shifts />} />
            <Route path=":role/:name/fee-plans" element={<FeePlans />} />
            <Route path=":role/:name/settings" element={<Settings />} />
            <Route path=":role/:name/profile" element={<Profile />} />
            <Route path=":role/:name/subscription" element={<Subscription />} />
            <Route path=":role/:name/subscription/invoice" element={<SubscriptionInvoice />} />
            <Route path=":role/:name/invoice" element={<SubscriptionInvoice />} />
            <Route path=":role/:name/expenses" element={<Expenses />} />
            <Route path=":role/:name/collect-fee" element={<CollectFee />} />
            <Route path=":role/:name/support" element={<Support />} />

            {/* Legacy Fallback Paths for compatibility */}
            <Route path="admission" element={<Admission />} />
            <Route path="students" element={<Students />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payments" element={<Payments />} />
            <Route path="collect-fee" element={<CollectFee />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/daily-attendance" element={<DailyAttendanceReport />} />
            <Route path="reports/revenue" element={<RevenueAnalysisReport />} />
            <Route path="seats" element={<Seats />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="fee-plans" element={<FeePlans />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="subscription/invoice" element={<SubscriptionInvoice />} />
            <Route path="invoice" element={<SubscriptionInvoice />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="support" element={<Support />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
