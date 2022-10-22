import { ethers } from "hardhat";
import { get, ConfigProperty } from "../../configManager";
import { Network } from "../config";
import postToIPFS from "../ipfs";

const hre = require("hardhat");

// Then Alice create a service, and others add proposals
async function main() {
  const network = await hre.network.name;
  console.log(network);

  const [alice, bob, carol, dave] = await ethers.getSigners();
  const serviceRegistry = await ethers.getContractAt(
    "ServiceRegistry",
    get(network as Network, ConfigProperty.ServiceRegistry)
  );

  const simpleERC20 = await ethers.getContractAt(
    "SimpleERC20",
    get(network as Network, ConfigProperty.SimpleERC20)
  );

  let serviceId = await serviceRegistry.nextServiceId();
  serviceId = serviceId.sub(1);
  console.log("serviceId", serviceId.toString());

  //Bob make a proposal

  const bobUri = await postToIPFS(
    JSON.stringify({
      proposalTitle: "Javascript Developer",
      proposalAbout: "We looking for Javascript Developer",
      rateType: 3,
      expectedHours: 50,
    })
  );

  const carolUri = await postToIPFS(
    JSON.stringify({
      proposalTitle: "C++ developer",
      proposalAbout: "We are looking for a C++ developer",
      rateType: 4,
      expectedHours: 20,
    })
  );

  console.log("uri", bobUri);

  const rateTokenBob = simpleERC20.address;
  await serviceRegistry
    .connect(bob)
    .createProposal(serviceId, rateTokenBob, 10, bobUri);

  // Carol make a proposal
  // const rateTokenCarol = "0xba401cdac1a3b6aeede21c9c4a483be6c29f88c5";
  const rateTokenCarol = "0x0000000000000000000000000000000000000000";
  await serviceRegistry
    .connect(carol)
    .createProposal(serviceId, rateTokenCarol, 200, carolUri);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
