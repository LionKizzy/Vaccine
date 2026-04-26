const { ethers, upgrades } = require("hardhat");

async function main() {
  // ✅ NEW CORRECT PROXY FROM YOUR DEPLOYMENT
  const PROXY_ADDRESS = "0x37911395Fb783b15321Ac45cB0cE84cAdB73f9D9";

  console.log("==================================");
  console.log("ShipmentTracker V2 Upgrade");
  console.log("Proxy:", PROXY_ADDRESS);
  console.log("==================================");

  const ShipmentTrackerV2 = await ethers.getContractFactory("ShipmentTrackerV2");

  // Optional safety: register proxy
  console.log("Registering proxy...");
  await upgrades.forceImport(PROXY_ADDRESS, ShipmentTrackerV2);

  console.log("Upgrading...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ShipmentTrackerV2);

  if (upgraded.deploymentTransaction) {
    await upgraded.deploymentTransaction().wait();
  } else if (upgraded.deployTransaction) {
    await upgraded.deployTransaction.wait();
  }

  const finalAddress =
    upgraded.getAddress ? await upgraded.getAddress() : upgraded.address;

  const impl = await upgrades.erc1967.getImplementationAddress(finalAddress);

  console.log("==================================");
  console.log("✅ UPGRADE SUCCESSFUL");
  console.log("Proxy:", finalAddress);
  console.log("Implementation:", impl);
  console.log("==================================");
}

main().catch((error) => {
  console.error("❌ Upgrade failed:", error);
  process.exitCode = 1;
});