import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'
import type { EventStatus, EventType } from '@/features/events/types'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const event = await eventsRepo.getEvent(user.id, id)
    if (!event) return fail('Event not found', 404)
    return ok(event)
  })
}

export async function PATCH(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
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
    if (!body) return fail('Invalid JSON body')

    const event = await eventsRepo.updateEvent(user.id, id, body)
    if (!event) return fail('Event not found', 404)
    return ok(event)
  })
}

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const deleted = await eventsRepo.deleteEvent(user.id, id)
    if (!deleted) return fail('Event not found', 404)
    return ok({ deleted: true })
  })
}
