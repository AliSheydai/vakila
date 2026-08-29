/**
 * Manual / CI-friendly checks for VLESS parse + (optional) live proxy.
 * Run: pnpm exec tsx --env-file=.env src/server/messenger/telegram/v2ray/self-test.ts
 */
import {
  buildXrayConfig,
  parseVlessUri,
  testVlessProxy,
} from './index'

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

async function main() {
  console.log('--- parse: invalid placeholder vless://idjisajdioj ---')
  const bad = parseVlessUri('vless://idjisajdioj')
  assert(!bad.ok, 'expected invalid parse')
  console.log('OK reject:', bad.error)

  console.log('--- parse: valid-shaped VLESS (fake endpoint) ---')
  const sample =
    'vless://11111111-1111-4111-8111-111111111111@example.com:443?encryption=none&security=reality&sni=example.com&fp=chrome&pbk=aaaaaaaa&sid=bbbb&type=tcp&flow=xtls-rprx-vision#test'
  const good = parseVlessUri(sample)
  assert(good.ok, 'expected valid parse')
  console.log('OK parse:', good.config.address, good.config.port, good.config.security)

  const xrayJson = buildXrayConfig(good.config, 10808)
  assert(
    Array.isArray(xrayJson.inbounds) &&
      (xrayJson.inbounds as unknown[])[0] &&
      ((xrayJson.inbounds as { port: number }[])[0].port === 10808),
    'socks inbound port'
  )
  console.log('OK xray config inbound socks on 10808')

  const live = process.env.VLESS_TEST_URI?.trim()
  if (!live) {
    console.log(
      '--- skip live SOCKS probe (set VLESS_TEST_URI to exercise Xray download + Telegram reachability) ---'
    )
    return
  }

  console.log('--- live test via Xray SOCKS5 ---')
  const result = await testVlessProxy(live, { keepAlive: false })
  if (!result.ok) {
    console.error('LIVE FAIL:', result.error)
    process.exitCode = 1
    return
  }
  console.log(
    'LIVE OK socks=',
    result.socks?.url,
    'latencyMs=',
    result.latencyMs
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
