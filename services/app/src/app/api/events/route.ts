import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'
import type { EventStatus, EventType } from '@/features/events/types'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    return ok(await eventsRepo.listEvents(user.id))
  })
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const body = await readJson<{
      title?: string
      type?: EventType
      date?: string
      startTime?: string
      endTime?: string
      location?: string
      description?: string
      clientId?: string | null
      caseId?: string | null
      status?: EventStatus
    }>(request)

    if (
      !body?.title?.trim() ||
      !body?.type ||
      !body?.date ||
      !body?.startTime ||
      !body?.endTime
    ) {
      return fail('title, type, date, startTime and endTime are required')
    }

    const event = await eventsRepo.createEvent(user.id, {
      title: body.title,
      type: body.type,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      description: body.description,
      clientId: body.clientId,
      caseId: body.caseId,
      status: body.status,
    }).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'ایجاد رویداد ناموفق بود.'
      throw new Error(message)
    })
    return ok(event, { status: 201 })
  })
}
