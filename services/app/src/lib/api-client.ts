export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<ApiResult<T>> {
  const { body, headers, ...rest } = options

  try {
    const response = await fetch(path, {
      ...rest,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')

    if (!isJson) {
      if (!response.ok) {
        return {
          ok: false,
          error:
            response.status === 401
              ? 'نشست شما منقضی شده است. دوباره وارد شوید.'
              : 'پاسخ نامعتبر از سرور دریافت شد.',
        }
      }
      return { ok: false, error: 'پاسخ نامعتبر از سرور دریافت شد.' }
    }

    const payload = (await response.json()) as
      | { ok: true; data: T }
      | { ok: false; error?: string }
      | T

    if (
      payload &&
      typeof payload === 'object' &&
      'ok' in payload &&
      typeof (payload as { ok: unknown }).ok === 'boolean'
    ) {
      const envelope = payload as
        | { ok: true; data: T }
        | { ok: false; error?: string }

      if (envelope.ok) {
        return { ok: true, data: envelope.data }
      }

      return {
        ok: false,
        error:
          envelope.error?.trim() ||
          (response.status === 401
            ? 'نشست شما منقضی شده است. دوباره وارد شوید.'
            : 'خطایی رخ داد. دوباره تلاش کنید.'),
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error:
          response.status === 401
            ? 'نشست شما منقضی شده است. دوباره وارد شوید.'
            : 'خطایی رخ داد. دوباره تلاش کنید.',
      }
    }

    return { ok: true, data: payload as T }
  } catch {
    return {
      ok: false,
      error: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
    }
  }
}
