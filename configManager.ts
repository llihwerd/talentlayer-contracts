import { Network } from './scripts/utils/config'
import * as fs from 'fs'

export enum ConfigProperty {
  MockProofOfHumanity = 'proofOfHumanityAddress',
  TalentLayerID = 'talentLayerIdAddress',
  ServiceRegistry = 'serviceRegistryAddress',
  Reviewscontract = 'talentLayerReviewAddress',
  TalentLayerArbitrator = 'talentLayerArbitratorAddress',
  TalentLayerEscrow = 'talentLayerEscrowAddress',
  SimpleERC20 = 'simpleERC20Address',
  TalentLayerPlatformID = 'talentLayerPlatformIdAddress',
}

const loadJSON = (network: Network) => {
  const filename = getFilename(network)
  return fs.existsSync(filename) ? fs.readFileSync(filename).toString() : '{}'
}

const saveJSON = (network: Network, json = '') => {
  const filename = getFilename(network)
  return fs.writeFileSync(filename, JSON.stringify(json, null, 2))
}

export const get = (network: Network, property: ConfigProperty) => {
  const obj = JSON.parse(loadJSON(network))
  return obj[property] || 'Not found'
}

export const getConfig = (network: Network) => {
  const obj = JSON.parse(loadJSON(network))
  return obj || 'Not found'
}

export const set = (network: Network, property: ConfigProperty, value: string) => {
  const obj = JSON.parse(loadJSON(network) || '{}')
  obj[property] = value
  saveJSON(network, obj)
}

export const remove = (network: Network, property: ConfigProperty) => {
  const obj = JSON.parse(loadJSON(network) || '{}')
  delete obj[property]
  saveJSON(network, obj)
}

const getFilename = (network: Network) => `${__dirname}/talent.config_${network}.json`
