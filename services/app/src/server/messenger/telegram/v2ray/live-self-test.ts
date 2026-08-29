/**
 * Extended runtime checks including Xray binary bootstrap and unreachable probe.
 * Run: pnpm exec tsx src/server/messenger/telegram/v2ray/live-self-test.ts
 */
import {
  ensureXrayBinary,
  parseVlessUri,
  testVlessProxy,
} from './index'

async function main() {
  console.log('1) reject placeholder')
  const bad = await testVlessProxy('vless://idjisajdioj')
  if (bad.ok) throw new Error('placeholder should fail')
  console.log('   ', bad.error)

  console.log('2) ensure Xray binary')
  const bin = await ensureXrayBinary()
  console.log('   ', bin)

  console.log('3) unreachable local endpoint (expect fail after xray start/probe)')
  const fake = await testVlessProxy(
    'vless://11111111-1111-4111-8111-111111111111@127.0.0.1:1?encryption=none&security=none&type=tcp#local-fail'
  )
  if (fake.ok) throw new Error('unreachable should fail')
  console.log('   ', fake.error?.slice(0, 300))

  console.log('4) parse sanity')
  const p = parseVlessUri(
    'vless://11111111-1111-4111-8111-111111111111@example.com:443?type=ws&security=tls&sni=example.com&path=%2Fws#n'
  )
  if (!p.ok) throw new Error(p.error)
  console.log('   ', p.config.network, p.config.security, p.config.path)

  console.log('ALL CHECKS PASSED')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
