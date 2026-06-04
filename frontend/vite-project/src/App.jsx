import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import RateLimitBanner from "./components/RateLimitBanner/RateLimitBanner.jsx";
import { usePrices } from "./hooks/UsePrices.js";
import Landing from "./pages/Landing/Landing.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Chart from "./pages/Chart.jsx";
import Trade from "./pages/Trade.jsx";
import Portfolio from "./pages/Portfolio/Portfolio.jsx";
import Scenarios from "./pages/Scenarios/Scenarios.jsx";
import ScenarioArena from "./pages/Scenarios/ScenarioArena.jsx";

const PublicRoute = ({ children }) => {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
};

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

function AppInner() {
  const { rateLimit, clearRateLimit } = usePrices();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
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
        <Route
          path="/scenarios"
          element={
            <Protected>
              <AppLayout>
                <Scenarios />
              </AppLayout>
            </Protected>
          }
        />
        <Route
          path="/scenarios/:id"
          element={
            <Protected>
              <ScenarioArena />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <RateLimitBanner rateLimit={rateLimit} onClear={clearRateLimit} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
