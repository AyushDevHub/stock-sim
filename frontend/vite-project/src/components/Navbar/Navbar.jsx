import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Navbar.module.css";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const LINKS = [
    { label: "Markets", action: () => scrollTo("home") },
    { label: "Features", action: () => scrollTo("features") },
    { label: "How it works", action: () => scrollTo("how") },
    { label: "Pricing", action: () => scrollTo("pricing") },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>
        <div className={styles.centerLinks}>
          {LINKS.map(({ label, action }) => (
            <button key={label} className={styles.navLink} onClick={action}>
              {label}
            </button>
          ))}
        </div>
        <div className={styles.ctas}>
          <button
            className={styles.btnLogin}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
          <button
            className={styles.btnStart}
            onClick={() => navigate("/register")}
          >
            Start free →
          </button>
        </div>
        <button className={styles.hamburger} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className={styles.mobileMenu}>
          {LINKS.map(({ label, action }) => (
            <button
              key={label}
              className={styles.mobileLink}
              onClick={() => {
                action();
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
          <div className={styles.mobileDivider} />
          <button
            className={styles.mobileBtnLogin}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
          <button
            className={styles.mobileBtnStart}
            onClick={() => navigate("/register")}
          >
            Start free →
          </button>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const NAV = [
    { to: "/dashboard", label: "Market" },
    { to: "/chart", label: "Charts" },
    { to: "/trade", label: "Trade" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/scenarios", label: "Scenarios", special: true },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/dashboard" className={styles.logo}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>
        <div className={styles.appNav}>
          {NAV.map(({ to, label, special }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  styles.appNavLink,
                  isActive ? styles.active : "",
                  special ? styles.scenarioLink : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {special && <span className={styles.scenarioIcon}>🎯</span>}
              {label}
            </NavLink>
          ))}
        </div>
        <div className={styles.ctas}>
          {user && (
            <span className={styles.balance}>
              ₹
              {Number(user.balance ?? 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
          <button
            className={styles.btnLogout}
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
        <button className={styles.hamburger} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className={styles.mobileMenu}>
          {NAV.map(({ to, label, special }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.mobileLink} ${
                  isActive ? styles.mobileLinkActive : ""
                } ${special ? styles.mobileLinkSpecial : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {special && "🎯 "}
              {label}
            </NavLink>
          ))}
          <div className={styles.mobileDivider} />
          {user && (
            <div className={styles.mobileBalance}>
              ₹
              {Number(user.balance ?? 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
          )}
          <button
            className={styles.mobileBtnLogout}
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
