import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/dashboard", label: "MARKET" },
  { to: "/chart", label: "CHART" },
  { to: "/trade", label: "TRADE" },
  { to: "/portfolio", label: "PORTFOLIO" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      style={{ borderBottom: "1px solid #1a2428", background: "#080c0e" }}
      className="flex items-center justify-between px-6 h-12 sticky top-0 z-50"
    >
      <span
        onClick={() => navigate("/dashboard")}
        style={{
          fontFamily: "Syne, sans-serif",
          color: "#ffb800",
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        STOCKSIM
      </span>

      <div className="flex gap-1">
        {NAV.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              padding: "4px 12px",
              borderRadius: "2px",
              color: pathname === to ? "#ffb800" : "#4a6370",
              background:
                pathname === to ? "rgba(255,184,0,0.08)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span style={{ fontSize: "0.7rem", color: "#4a6370" }}>
            <span style={{ color: "#00d68f" }}>₹</span>{" "}
            {Number(user.balance ?? 0).toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            fontSize: "0.65rem",
            color: "#ff4757",
            letterSpacing: "0.1em",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          LOGOUT
        </button>
      </div>
    </nav>
  );
}
