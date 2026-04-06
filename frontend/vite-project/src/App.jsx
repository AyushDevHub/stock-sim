import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chart from "./pages/Chart.jsx";
import Trade from "./pages/Trade.jsx";
import Portfolio from "./pages/Portfolio.jsx";

const Protected = ({ children }) => {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — with navbar */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/chart"
          element={
            <Protected>
              <AppLayout>
                <Chart />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/trade"
          element={
            <Protected>
              <AppLayout>
                <Trade />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/portfolio"
          element={
            <Protected>
              <AppLayout>
                <Portfolio />
              </AppLayout>
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
