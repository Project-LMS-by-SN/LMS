import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Overview from "./pages/Overview";
import Libraries from "./pages/Libraries";
import StudentQuota from "./pages/StudentQuota";
import StudentsDirectory from "./pages/StudentsDirectory";
import FeePlans from "./pages/FeePlans";
import Coupons from "./pages/Coupons";
import Notifications from "./pages/Notifications";
import LibraryProfile from "./pages/LibraryProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="overview" element={<Overview />} />
          <Route path="libraries" element={<Libraries />} />
          <Route path="libraries/:id" element={<LibraryProfile />} />
          <Route path="subscriptions" element={<Navigate to="/libraries" replace />} />
          <Route path="quota" element={<StudentQuota />} />
          <Route path="students" element={<StudentsDirectory />} />
          <Route path="fee-plans" element={<FeePlans />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
