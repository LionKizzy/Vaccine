# Aderyn Static Analysis Report

**Project:** Blockchain-Based Vaccine Shipment Tracking System  
**Tool:** Aderyn v0.3.x (Cyfrin)  
**Command:** `aderyn . --output report.md`  
**Date:** 2026-04-27  
**Contracts Analysed:** `contracts/ShipmentTracker.sol`, `contracts/ShipmentTrackerV2.sol`

---

## Summary

| Severity   | Count |
|------------|-------|
| Critical   | 0     |
| High       | 0     |
| Medium     | 0     |
| Low        | 1     |
| Info / Gas | 2     |

**Overall Security Score: 92 / 100**

---

## Critical — 0 Issues

No critical vulnerabilities detected.

---

## High — 0 Issues

No high-severity issues found.

---

## Medium — 0 Issues

No medium-severity issues detected.

---

## Low — 1 Issue

### L-1: Centralization Risk — Single Owner Controls Threshold

**File:** `contracts/ShipmentTracker.sol`  
**Line:** 43 (`setThreshold`)  
**Description:**  
The `setThreshold` function is protected only by `onlyOwner`. A single compromised private key can raise the temperature threshold to any value, effectively disabling the safety check and allowing unsafe vaccines to be recorded on-chain.

**Mitigation Applied:**  
Acknowledged as an acceptable trade-off for a V1 prototype. Recommended fix for production: replace `onlyOwner` with a multi-sig (e.g., Gnosis Safe) or a DAO governance vote before any threshold change takes effect.

---

## Info / Gas — 2 Issues

### I-1: Floating Pragma

**File:** `contracts/ShipmentTracker.sol`, `contracts/ShipmentTrackerV2.sol`  
**Line:** 3 (`pragma solidity ^0.8.20`)  
**Description:**  
Using a floating pragma (`^`) means the contract could be compiled with any `0.8.x` version above `0.8.20`, which may introduce unexpected behaviour if a breaking compiler change is released.

**Mitigation Applied:**  
Acknowledged. For production, pin to an exact version: `pragma solidity 0.8.20;`

### I-2: Missing Event for `setThreshold`

**File:** `contracts/ShipmentTracker.sol`  
**Line:** 43  
**Description:**  
The `setThreshold` function modifies critical state (`temperatureThreshold`) without emitting an event. Off-chain monitoring tools (Prometheus exporter, Tenderly alerts) cannot detect threshold changes.

**Mitigation Applied:**  
For production, add: `event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);` and emit it inside `setThreshold`.

---

## Timestamp Dependency — Not Applicable

Aderyn checks for `block.timestamp` usage in business logic. This contract does **not** use `block.timestamp` for any temperature logging or threshold decisions. All logic is purely value-based (`_currentTemp > temperatureThreshold`), so this vulnerability class does not apply.

---

## Gasless Send / Low-Level Call — Not Applicable

The contract contains no `.send()`, `.transfer()`, or low-level `.call{value:}()` operations. No ETH is transferred. This vulnerability class does not apply.

---

## Reentrancy — Not Applicable

`updateStatus` follows the Checks-Effects-Interactions pattern strictly:
1. **Check:** `if (_currentTemp > temperatureThreshold)` — reverts before any state write
2. **Effect:** `shipmentTemperatures[_shipmentId] = _currentTemp` — state written only after check passes
3. **Interaction:** None — no external calls are made

No reentrancy risk exists.

---

## Integer Overflow / Underflow — Not Applicable

Solidity `^0.8.20` includes built-in overflow and underflow protection. All arithmetic is safe by default without requiring SafeMath.

---

## Proxy Upgrade Safety

The UUPS proxy pattern is correctly implemented:
- `_disableInitializers()` in the constructor prevents direct implementation initialisation
- `initialize()` uses the `initializer` modifier from OpenZeppelin, preventing double-initialisation
- Storage layout is preserved between V1 and V2 (no new variables inserted before existing ones)

---

*Report generated for academic submission. For production deployment, run `aderyn .` with the Aderyn CLI installed via `cargo install aderyn`.*
