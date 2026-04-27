// wagmi.config.js — Wagmi v2 + Viem configuration for Sepolia
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export const CONTRACT_ADDRESS = '0x3e9dC908aC6fe66d312de94eD5f543449aC74b69';

// Full ABI — includes the TemperatureAlert event required by useWatchContractEvent
export const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'shipmentTemperatures',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'updateStatus',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_shipmentId', type: 'uint256' },
      { name: '_currentTemp',  type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'temperatureThreshold',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    // TemperatureAlert event — watched by useWatchContractEvent in Dashboard
    type: 'event',
    name: 'TemperatureAlert',
    inputs: [
      { name: 'shipmentId', type: 'uint256', indexed: true },
      { name: 'temperature', type: 'uint256', indexed: false },
    ],
  },
];

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/6gMRVFxN5-nYXGgS1z3ew'),
  },
});
