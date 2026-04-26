// Sensor.jsx — Clean light SaaS design
import React, { useState } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x3e9dC908aC6fe66d312de94eD5f543449aC74b69';
const ABI = [
  'function updateStatus(uint256 shipmentId, uint256 temp) public',
  'function shipmentTemperatures(uint256) public view returns (uint256)',
];

const validate = (v) => {
  const n = parseFloat(v);
  if (isNaN(n))  return { valid: false, msg: 'Enter a valid number' };
  if (n < -50)   return { valid: false, msg: 'Below −50°C is unrealistic' };
  if (n > 100)   return { valid: false, msg: 'Above 100°C is unrealistic' };
  return { valid: true, n };
};

const getHint = (v) => {
  const r = validate(v);
  if (!r.valid)   return { msg: r.msg, type: 'error' };
  if (r.n > 25)   return { msg: '⚠ Will FAIL — exceeds 25°C threshold. Useful for generating a Tenderly revert trace.', type: 'warning' };
  if (r.n >= 0)   return { msg: '✓ Within safe range — transaction will succeed.', type: 'success' };
  return            { msg: 'ℹ Temperature within acceptable range.', type: 'info' };
};

const hintColor = { error: '#dc2626', warning: '#d97706', success: '#16a34a', info: '#2563eb' };
const hintBg    = { error: '#fef2f2', warning: '#fffbeb', success: '#f0fdf4', info: '#eff6ff' };

const Sensor = ({ setAccount }) => {
  const [tempInput, setTempInput] = useState('');
  const [loading, setLoading]     = useState(false);
  const [txHash, setTxHash]       = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [txStatus, setTxStatus]   = useState('idle');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setTxHash(''); setSuccess(false); setTxStatus('pending');

    const v = validate(tempInput);
    if (!v.valid) { setError(v.msg); setTxStatus('error'); return; }

    if (!window.ethereum) {
      setError('MetaMask not detected. Please install it to submit transactions.');
      setTxStatus('error');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);

      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx       = await contract.updateStatus(1, tempInput);
      setTxHash(tx.hash);

      await tx.wait();
      setSuccess(true);
      setTxStatus('success');
      setLoading(false);
      setTempInput('');
      setTimeout(() => { setSuccess(false); setTxStatus('idle'); }, 6000);
    } catch (err) {
      setLoading(false);
      setTxStatus('error');
      const n = parseFloat(tempInput);
      if (n > 25) {
        setError(
          `Transaction reverted: temperature exceeds the 25°C safety threshold.\n` +
          `This is expected behaviour — use Tenderly to inspect the revert trace.\n\n` +
          `Raw error: ${err.message || 'Contract require() failed'}`
        );
      } else {
        setError(`Transaction failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const hint = tempInput ? getHint(tempInput) : null;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Sensor Simulation</h1>
        <p className="page-subtitle">Push a signed temperature reading to the Sepolia blockchain as an IoT sensor.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* ── Form card ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Submit Temperature Reading</span>
            <span className="badge-info">IoT Simulator</span>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="input-group">
              <label className="input-label">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                placeholder="e.g. 18.5"
                className="input-field"
                required
                disabled={loading}
                style={{
                  borderColor: hint
                    ? hint.type === 'warning' ? '#fbbf24'
                    : hint.type === 'success' ? '#86efac'
                    : hint.type === 'error'   ? '#fca5a5'
                    : undefined
                    : undefined,
                }}
              />
              {hint && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: hintBg[hint.type],
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  color: hintColor[hint.type],
                  fontWeight: 500,
                }}>
                  {hint.msg}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {loading ? '⏳  Processing…' : '→  Update Blockchain'}
            </button>
          </form>

          {/* Pending */}
          {txStatus === 'pending' && !success && !error && (
            <div className="alert-success" style={{ background: '#fffbeb', borderLeftColor: '#f59e0b', color: '#92400e' }}>
              <p style={{ fontWeight: 600 }}>⏳ Waiting for confirmation…</p>
              {txHash && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                  style={{ color: '#6366f1', fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}>
                  View on Etherscan →
                </a>
              )}
            </div>
          )}

          {success && (
            <div className="alert-success">
              <p style={{ fontWeight: 600 }}>✓ Blockchain updated successfully!</p>
              {txHash && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                  style={{ color: '#16a34a', fontSize: '0.78rem', marginTop: '0.4rem', display: 'inline-block' }}>
                  View transaction →
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="alert-error">
              <p style={{ whiteSpace: 'pre-line', marginBottom: '0.5rem' }}>{error}</p>
              {error.includes('threshold') && (
                <button className="btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}
                  onClick={() => window.open('https://dashboard.tenderly.co/', '_blank')}>
                  Open Tenderly →
                </button>
              )}
            </div>
          )}

          {window.ethereum && (
            <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
              MetaMask detected ·{' '}
              {window.ethereum.networkVersion === '11155111'
                ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Sepolia ✓</span>
                : <span style={{ color: '#d97706', fontWeight: 600 }}>Switch to Sepolia</span>}
            </p>
          )}
        </div>

        {/* ── Guide card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Success case */}
          <div className="card" style={{ borderLeft: '3px solid #22c55e' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
              }}>✓</div>
              <div>
                <p style={{ fontWeight: 700, color: '#15803d', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                  Success Case
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  Enter <strong>0–25°C</strong> (e.g. 18). Transaction mines successfully and the
                  Dashboard temperature updates within seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Failure case */}
          <div className="card" style={{ borderLeft: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: '#fef2f2', border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
              }}>✕</div>
              <div>
                <p style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                  Failure Case — Audit Requirement
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  Enter <strong>&gt;25°C</strong> (e.g. 30). The contract reverts with{' '}
                  <code>"Temperature exceeds safety threshold!"</code>. Use the Tenderly trace
                  for Category 4 forensic debugging.
                </p>
              </div>
            </div>
          </div>

          {/* Contract info */}
          <div className="card" style={{ background: '#f8fafc' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Contract
            </p>
            <code style={{ fontSize: '0.72rem', wordBreak: 'break-all', display: 'block' }}>
              {CONTRACT_ADDRESS}
            </code>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
              Sepolia Testnet · ShipmentTracker V1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sensor;
