import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Navbar.module.css";

// Landing navbar (no auth)
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>

        <div className={styles.centerLinks}>
          {["Markets", "Features", "Pricing", "Blog"].map((item) => (
            <button key={item} className={styles.navLink}>
              {item}
            </button>
          ))}
        </div>

        <div className={styles.ctas}>
          <button
            className={styles.btnLogin}
            onClick={() => navigate("/login")}
          >
            Login
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
          {["Markets", "Features", "Pricing", "Blog"].map((item) => (
            <button key={item} className={styles.mobileLink}>
              {item}
            </button>
          ))}
          <div className={styles.mobileDivider} />
          <button
            className={styles.mobileBtnLogin}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className={styles.mobileBtnStart}
            onClick={() => navigate("/register")}
          >
            Start free trial →
          </button>
        </div>
      )}
    </nav>
  );
}

// App navbar (post-login)
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NAV = [
    { to: "/dashboard", label: "MARKET" },
    { to: "/chart", label: "CHART" },
    { to: "/trade", label: "TRADE" },
    { to: "/portfolio", label: "PORTFOLIO" },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/dashboard" className={styles.logo}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>

        <div className={styles.appNav}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.appNavLink} ${isActive ? styles.active : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className={styles.ctas}>
          {user && (
            <span className={styles.balance}>
              <span className={styles.balanceAmt}>₹</span>{" "}
              {Number(user.balance ?? 0).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
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
            LOGOUT
          </button>
        </div>
      </div>
    </nav>
  );
}
