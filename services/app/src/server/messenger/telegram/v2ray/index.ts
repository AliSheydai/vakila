export { parseVlessUri, proxyConfigHint } from './parse-vless'
export type { ParsedVlessConfig, ParseVlessResult } from './parse-vless'
export { buildXrayConfig } from './xray-config'
export { ensureXrayBinary, XRAY_VERSION } from './xray-binary'
export { ensureTelegramProxyFromDb } from './ensure-from-db'
export {
  createSocksAgent,
  ensureTelegramProxy,
  getActiveProxyRemark,
  getActiveSocksEndpoint,
  httpsGetViaSocks,
  isProxyRunning,
  stopTelegramProxy,
  testAndActivateVlessProxy,
  testVlessProxy,
} from './proxy-manager'
export type { ProxyTestResult, SocksEndpoint } from './proxy-manager'
