import { task } from 'hardhat/config'
import { getDeploymentProperty, DeploymentProperty } from '../../../.deployment/deploymentManager'
import { Network } from '../../../networkConfig'
import postToIPFS from '../../utils/ipfs'

/**
 * @notice This task is used to create a new service
 * @usage npx hardhat create-service --network mumbai
 */
task('create-service', 'Create a new open service').setAction(async (args, { ethers, network }) => {
  const [deployer] = await ethers.getSigners()

  console.log('network', network.name)
  console.log('Create new service for:', deployer.address)

  /* ----------- Post Job data on IPFS -------------- */
  const jobDataCid = await postToIPFS(
    JSON.stringify({
      title: 'Full Stack Developer Job',
      about: 'Looking for Full Stack Developer',
      keywords: 'BlockChain',
      role: 'developer',
      rateToken: '0x0000000000000000000000000000000000000000',
      rateAmount: 1,
      recipient: '',
    }),
  )

  if (!jobDataCid) throw new Error('Job Data CID is not defined')

  console.log('Job Data CID', jobDataCid)

  /* ----------- Create an open service -------------- */
  const ServiceRegistry = await ethers.getContractFactory('ServiceRegistryV2')

  const serviceRegistryAddress = getDeploymentProperty(
    network.name,
    DeploymentProperty['ServiceRegistry'],
  )
  const serviceRegistry = await ServiceRegistry.attach(serviceRegistryAddress)
  const tx = await serviceRegistry.createOpenServiceFromBuyer(1, jobDataCid)

  console.log('Service created on tx:', tx.hash)
})
