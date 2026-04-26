// Layout.jsx — Top navbar, no sidebar
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/',       label: 'Dashboard',     icon: '▦' },
  { path: '/sensor', label: 'Sensor Control', icon: '⊕' },
  { path: '/audit',  label: 'Audit',          icon: '⊛' },
];

const Layout = ({ children, account, onConnect }) => {
  const location = useLocation();
  const isConnected = account !== 'Not Connected';

  return (
    <div className="layout-container">

      {/* ── Navbar ── */}
      <header className="app-header">

        {/* Left: Logo */}
        <div className="logo-section">
          <div className="logo-icon">❄</div>
          <div className="logo-content">
            <span className="logo-text">Blockchain-Based Vaccine Shipment</span>
            <span className="logo-text-sub">Tracking System with Real-Time Temperature Alerts</span>
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="header-nav">
          {navItems.map(({ path, label, icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className={`nav-link${active ? ' active' : ''}`}>
                <span className="nav-icon">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Network + Wallet */}
        <div className="header-controls">
          <div className="network-indicator">
            <span className="network-dot" />
            <span className="network-name">Sepolia</span>
            <span className="network-status">Live</span>
          </div>

          <button
            className={`wallet-connect-btn${isConnected ? ' connected' : ''}`}
            onClick={onConnect}
          >
            <span className="wallet-icon">{isConnected ? '●' : '○'}</span>
            {isConnected
              ? <span className="wallet-address">{account.slice(0,6)}…{account.slice(-4)}</span>
              : <span>Connect Wallet</span>
            }
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="layout-body">
        <main className="main-content-area">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <div className="footer-section">
          <span className="footer-icon">🔒</span>
          <span>Blockchain Secured</span>
        </div>
        <div className="footer-section">
          <span className="footer-icon">⚡</span>
          <span>Real-time · Auto-refresh 10s</span>
        </div>
        <div className="footer-section">
          <span className="footer-icon">🛡️</span>
          <span>Audited Smart Contract · v2.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
