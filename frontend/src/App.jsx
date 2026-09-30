import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rooms from "./pages/Rooms.jsx";
import Residents from "./pages/Residents.jsx";
import ResidentDetail from "./pages/ResidentDetail.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Billing from "./pages/Billing.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";

const withLayout = (element) => <Layout>{element}</Layout>;

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute>{withLayout(<Dashboard />)}</ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute>{withLayout(<Rooms />)}</ProtectedRoute>} />
      <Route
        path="/residents"
        element={<ProtectedRoute roles={["admin", "staff"]}>{withLayout(<Residents />)}</ProtectedRoute>}
      />
      <Route
        path="/residents/:id"
        element={<ProtectedRoute roles={["admin", "staff"]}>{withLayout(<ResidentDetail />)}</ProtectedRoute>}
      />
      <Route path="/maintenance" element={<ProtectedRoute>{withLayout(<Maintenance />)}</ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute>{withLayout(<Billing />)}</ProtectedRoute>} />
      <Route
        path="/reports"
        element={<ProtectedRoute roles={["admin", "staff"]}>{withLayout(<Reports />)}</ProtectedRoute>}
      />
      <Route
        path="/users"
        element={<ProtectedRoute roles={["admin"]}>{withLayout(<Users />)}</ProtectedRoute>}
      />
      <Route path="/notifications" element={<ProtectedRoute>{withLayout(<Notifications />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={["resident"]}>{withLayout(<Profile />)}</ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
