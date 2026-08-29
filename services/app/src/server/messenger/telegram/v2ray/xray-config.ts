import type { ParsedVlessConfig } from './parse-vless'

type XrayStreamSettings = Record<string, unknown>

function buildStreamSettings(config: ParsedVlessConfig): XrayStreamSettings {
  const stream: XrayStreamSettings = {
    network: config.network === 'h2' ? 'http' : config.network,
  }

  if (config.network === 'ws') {
    stream.wsSettings = {
      path: config.path || '/',
      headers: config.host ? { Host: config.host } : undefined,
    }
  } else if (config.network === 'grpc') {
    stream.grpcSettings = {
      serviceName: config.serviceName || '',
      multiMode: config.mode === 'multi',
    }
  } else if (config.network === 'httpupgrade') {
    stream.httpupgradeSettings = {
      path: config.path || '/',
      host: config.host || '',
    }
  } else if (config.network === 'xhttp') {
    stream.xhttpSettings = {
      path: config.path || '/',
      host: config.host || '',
      mode: config.mode || undefined,
    }
  } else if (config.network === 'tcp' && config.headerType === 'http') {
    stream.tcpSettings = {
      header: {
        type: 'http',
        request: {
          path: [config.path || '/'],
          headers: config.host
            ? { Host: [config.host] }
            : undefined,
        },
      },
    }
  }

  if (config.security === 'tls') {
    stream.security = 'tls'
    stream.tlsSettings = {
      serverName: config.sni || config.host || config.address,
      fingerprint: config.fingerprint || 'chrome',
      alpn: config.alpn.length > 0 ? config.alpn : undefined,
      allowInsecure: false,
    }
  } else if (config.security === 'reality') {
    stream.security = 'reality'
    stream.realitySettings = {
      serverName: config.sni || config.address,
      fingerprint: config.fingerprint || 'chrome',
      publicKey: config.publicKey,
      shortId: config.shortId || '',
      spiderX: config.spiderX || '',
    }
  } else {
    stream.security = 'none'
  }

  return stream
}

/** Build an Xray JSON config that exposes local SOCKS5 and dials out via VLESS. */
export function buildXrayConfig(
  config: ParsedVlessConfig,
  socksPort: number
): Record<string, unknown> {
  const user: Record<string, unknown> = {
    id: config.id,
    encryption: config.encryption || 'none',
  }
  if (config.flow) {
    user.flow = config.flow
  }

  return {
    log: {
      loglevel: 'warning',
    },
    inbounds: [
      {
        tag: 'socks-in',
        listen: '127.0.0.1',
        port: socksPort,
        protocol: 'socks',
        settings: {
          udp: false,
          auth: 'noauth',
        },
        sniffing: {
          enabled: true,
          destOverride: ['http', 'tls'],
        },
      },
    ],
    outbounds: [
      {
        tag: 'proxy',
        protocol: 'vless',
        settings: {
          vnext: [
            {
              address: config.address,
              port: config.port,
              users: [user],
            },
          ],
        },
        streamSettings: buildStreamSettings(config),
      },
      {
        tag: 'direct',
        protocol: 'freedom',
      },
      {
        tag: 'block',
        protocol: 'blackhole',
      },
    ],
    routing: {
      domainStrategy: 'AsIs',
      rules: [
        {
          type: 'field',
          outboundTag: 'proxy',
          port: '0-65535',
        },
      ],
    },
  }
}
