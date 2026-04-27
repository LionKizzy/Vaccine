// Dashboard.jsx — Wagmi v2 real-time events + red overlay on TemperatureAlert
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWatchContractEvent, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../wagmi.config.js';

const CONTRACT_ADDRESS_LOCAL = CONTRACT_ADDRESS;
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/6gMRVFxN5-nYXGgS1z3ew';
const ABI_READ = ['function shipmentTemperatures(uint256) public view returns (uint256)'];

/* ── status config — driven by live temp ── */
const getStatus = (t, loading, error) => {
  if (error)   return { label: 'CONNECTION ERROR', icon: '✕', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', msgColor: '#991b1b' };
  if (loading) return { label: 'FETCHING DATA',   icon: '…', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', msgColor: '#4338ca' };
  if (t > 39)  return { label: 'CRITICAL BREACH', icon: '!', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', msgColor: '#991b1b',
    message: 'Temperature exceeds 39°C — immediate action required. Data reverted at contract level.' };
  if (t > 25)  return { label: 'MODERATE WARNING', icon: '⚠', color: '#d97706', bg: '#fffbeb', border: '#fde68a', msgColor: '#92400e',
    message: 'Temperature above 25°C threshold. Review sensor calibration and logistics route.' };
  return         { label: 'OPTIMAL',          icon: '✓', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', msgColor: '#15803d',
    message: 'All parameters within safe range. Cold chain integrity maintained.' };
};

const fmtTime = (d) =>
  d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

/* ── small stat card ── */
const StatCard = ({ label, value, sub, accent = '#6366f1', icon }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className="stat-label">{label}</span>
      {icon && (
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${accent}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', flexShrink: 0,
        }}>{icon}</span>
      )}
    </div>
    <span className="stat-value" style={{ color: accent }}>{value}</span>
    {sub && <span className="stat-sub">{sub}</span>}
  </div>
);

/* ── component ── */
const Dashboard = () => {
  const [temp, setTemp]               = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]             = useState(null);

  // ── RED OVERLAY state — triggered by TemperatureAlert event ──
  const [alertOverlay, setAlertOverlay] = useState(null);
  // alertOverlay = { shipmentId, temperature } | null

  // ── useWatchContractEvent — Category 3 requirement ──
  // Fires immediately when the contract emits TemperatureAlert, no page refresh needed
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'TemperatureAlert',
    onLogs(logs) {
      const latest = logs[logs.length - 1];
      if (!latest) return;
      const { shipmentId, temperature } = latest.args;
      console.log(`[WAGMI EVENT] TemperatureAlert — Shipment #${shipmentId}, Temp: ${temperature}°C`);
      setAlertOverlay({
        shipmentId: shipmentId.toString(),
        temperature: temperature.toString(),
      });
      // Also update the displayed temp immediately from the event
      setTemp(Number(temperature));
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS_LOCAL, ABI_READ, provider);
      const raw = await contract.shipmentTemperatures(1);
      setTemp(Number(raw));
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError('Unable to reach the contract. Check RPC or network.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, []);

  const status  = getStatus(temp, isLoading, error);
  const safeT   = temp ?? 0;
  const barPct  = Math.min(100, (safeT / 50) * 100);

  /* bar color */
  const barColor = error || isLoading ? '#6366f1'
    : safeT > 39 ? '#ef4444'
    : safeT > 25 ? '#f59e0b'
    : '#22c55e';

  return (
    <div style={{ position: 'relative' }}>

      {/* ── RED OVERLAY — fires on TemperatureAlert event via useWatchContractEvent ── */}
      {alertOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(220, 38, 38, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          backdropFilter: 'blur(4px)',
          animation: 'overlayIn 0.25s ease',
        }}>
          <div style={{ fontSize: '4rem' }}>🚨</div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
              TEMPERATURE BREACH DETECTED
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Shipment #{alertOverlay.shipmentId} — {alertOverlay.temperature}°C recorded on-chain
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Contract reverted · TemperatureAlert event emitted · Wagmi listener triggered
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setAlertOverlay(null)}
              style={{
                padding: '0.75rem 2rem',
                background: '#fff',
                color: '#dc2626',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Dismiss Alert
            </button>
            <a
              href="/audit"
              style={{
                padding: '0.75rem 2rem',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              View Audit Report →
            </a>
          </div>
        </div>
      )}
      {/* ── Page header ── */}
      <div className="page-header-block">
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Live Shipment Tracking</h1>
            <p className="page-subtitle">
              Shipment #1 &nbsp;·&nbsp; Sepolia Testnet &nbsp;·&nbsp;
              {lastUpdated ? `Updated ${fmtTime(lastUpdated)}` : 'Connecting to blockchain…'}
            </p>
          </div>
          <span className={`status-chip status-chip--${error ? 'error' : isLoading ? 'loading' : temp > 39 ? 'critical' : temp > 25 ? 'warning' : 'ok'}`}>
            <span className="status-chip-dot" />
            {error ? 'Error' : isLoading ? 'Loading…' : status.label}
          </span>
        </div>
      </div>

      {/* ── Chain Status Banner — wired to live data ── */}
      <div className="status-banner" style={{
        background: status.bg,
        borderColor: status.border,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${status.color}18`,
          border: `1.5px solid ${status.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 800, color: status.color,
        }}>
          {status.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div className="status-banner-label" style={{ color: status.color }}>
            Chain Status — {status.label}
          </div>
          <div className="status-banner-msg" style={{ color: status.msgColor }}>
            {error
              ? error
              : isLoading
              ? 'Fetching latest temperature from the blockchain…'
              : status.message}
          </div>
        </div>
        {!isLoading && !error && temp !== null && temp > 25 && (
          <a href="/audit" style={{
            flexShrink: 0,
            padding: '0.45rem 1rem',
            background: status.color,
            color: '#fff',
            borderRadius: 8,
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            View Audit →
          </a>
        )}
      </div>

      {/* ── Main two-column row ── */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>

        {/* Temperature card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Current Temperature</span>
            <span className="badge-success">Real-time</span>
          </div>

          {/* Big number */}
          <div className="temp-display" style={{ color: barColor }}>
            {isLoading ? '—' : error ? 'N/A' : `${safeT}°C`}
          </div>

          {/* Progress bar */}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${barPct}%`, background: barColor }}
            />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '0.35rem', fontSize: '0.68rem', color: '#94a3b8',
          }}>
            <span>0°C</span><span>25°C</span><span>50°C</span>
          </div>

          <div className="divider" style={{ marginTop: '1rem' }} />

          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Blockchain recorded value — Shipment ID #1
          </p>
        </div>

        {/* Contract info card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <span className="card-title">Contract Details</span>
            <span className="badge-info">Sepolia</span>
          </div>

          {[
            { label: 'Contract Address', value: `${CONTRACT_ADDRESS.slice(0,10)}…${CONTRACT_ADDRESS.slice(-6)}`, mono: true },
            { label: 'Safety Threshold (V1)', value: '≤ 25°C', mono: false },
            { label: 'Safety Threshold (V2)', value: '≤ 39°C', mono: false },
            { label: 'Upgrade Pattern', value: 'UUPS Proxy', mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
              {mono
                ? <code style={{ fontSize: '0.75rem' }}>{value}</code>
                : <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{value}</span>
              }
            </div>
          ))}

          <div style={{
            marginTop: 'auto',
            padding: '0.75rem',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: '0.78rem',
            color: '#64748b',
            lineHeight: 1.5,
          }}>
            🔒 <code>require(temp &lt;= 25, "Temperature exceeds safety threshold!")</code> enforced on-chain.
          </div>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard label="Shipment ID"  value="#1"      sub="Active"          accent="#6366f1" icon="📦" />
        <StatCard label="Network"      value="Sepolia"  sub="Ethereum testnet" accent="#8b5cf6" icon="🌐" />
        <StatCard label="V1 Threshold" value="25°C"    sub="Safety limit"    accent="#0ea5e9" icon="🌡️" />
        <StatCard label="V2 Threshold" value="39°C"    sub="Extended limit"  accent="#f59e0b" icon="⚡" />
      </div>

      {/* ── Legend ── */}
      <div className="legend-container">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#22c55e' }} />
          <span>0–25°C — Optimal</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f59e0b' }} />
          <span>26–39°C — Warning</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} />
          <span>&gt;39°C — Critical Breach</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
