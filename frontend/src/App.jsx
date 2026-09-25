import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Admission from "./pages/Admission";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import DailyAttendanceReport from "./pages/DailyAttendanceReport";
import RevenueAnalysisReport from "./pages/RevenueAnalysisReport";
import Seats from "./pages/Seats";
import Shifts from "./pages/Shifts";
import FeePlans from "./pages/FeePlans";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Login from "./pages/Login";
import PublicAdmission from "./pages/PublicAdmission";
import Subscription from "./pages/Subscription";
import SubscriptionInvoice from "./pages/SubscriptionInvoice";
import Expenses from "./pages/Expenses";
import CollectFee from "./pages/CollectFee";
import PublicAttendance from "./pages/PublicAttendance";

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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated() ? (
            mustChangePassword() ? <Navigate to="/change-password" replace /> : <Navigate to="/dashboard" replace />
          ) : <Login />
        } />

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
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;