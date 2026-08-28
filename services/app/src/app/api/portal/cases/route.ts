import { fail, ok, readJson, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { createPortalCase } from '@/server/repositories/portal-repo'
import type { LegalArea } from '@/features/client-portal/types'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])

    const body = await readJson<{
      title?: string
      legalArea?: LegalArea
      descriptionHtml?: string
      lawyerId?: string
      documentIds?: string[]
    }>(request)

    if (!body?.title?.trim() || !body?.legalArea) {
      return fail('title and legalArea are required')
    }

    try {
      const caseItem = await createPortalCase(user, {
        title: body.title,
        legalArea: body.legalArea,
        descriptionHtml: body.descriptionHtml,
        lawyerId: body.lawyerId,
        documentIds: body.documentIds,
      })
      return ok(caseItem, { status: 201 })
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to create case'), 400)
    }
  })
}
