import { HardhatUpgrades } from '@openzeppelin/hardhat-upgrades'
import { ContractFactory } from 'ethers'
import { task } from 'hardhat/config'
import { ConfigProperty, get } from '../../../configManager'
import { Network } from '../../utils/config'
import { verifyAddress } from './utils'

/**
 * @notice This task is used to upgrade for one of the proxy contracts. Use it only locally for your own testnet
 * @usage npx hardhat upgrade-proxy --contract-name "ServiceRegistryV2" --proxy-name "ServiceRegistry" --verify --network goerli
 */
task('upgrade-proxy', 'Upgrade a proxy to a new implementation')
  .addParam('contractName', 'The name of the new contract implemntation')
  .addParam('proxyName', 'The name of the original proxy')
  .addFlag('verify', 'verify contracts on etherscan')
  .setAction(async (args, { ethers, network }) => {
    const { proxyName, contractName, verify } = args
    const [deployer] = await ethers.getSigners()

    console.log('network', network.name)
    console.log(
      'Upgrade by:',
      deployer.address,
      'for proxy contract:',
      proxyName,
      'with new implementation:',
      contractName,
    )

    const proxyAddress = get(
      network.name as any as Network,
      ConfigProperty[proxyName as keyof typeof ConfigProperty],
    )
    if (!proxyAddress) {
      throw new Error(`Proxy address not found for ${proxyName}`)
    }

    const NewImplementation = await ethers.getContractFactory(contractName)
    // @ts-ignore: upgrades is imported in hardhat.config.ts
    const proxy = await (upgrades as HardhatUpgrades).upgradeProxy(
      proxyAddress,
      NewImplementation as ContractFactory,
      {
        timeout: 0,
        pollingInterval: 10000,
      },
    )

    if (verify) {
      await verifyAddress(proxy.address)
    }

    const implementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(proxy.address)
    console.log(`${proxyName} addresses:`, {
      proxy: proxyAddress,
      implementation: implementationAddress,
    })
  })
