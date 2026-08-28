import * as eventsRepo from '../repositories/events-repo'
import * as notificationService from './notification-service'

const REMINDER_INTERVALS = [
  { minutes: 15, type: '15m' },
  { minutes: 5, type: '5m' },
] as const

export async function processEventReminders(): Promise<void> {
  for (const { minutes, type } of REMINDER_INTERVALS) {
    try {
      const events = await eventsRepo.listUpcomingEventsForReminders(minutes)
      for (const row of events) {
        await notificationService.notifyEventReminder({
          clientUserId: row.client_user_id,
          lawyerId: row.owner_id,
          eventId: row.id,
          caseId: row.case_id,
          clientId: row.client_id,
          title: row.title,
          minutesUntil: minutes,
        })
        await eventsRepo.logReminderSent(row.id, type)
      }
    } catch (error) {
      console.error(`[event-reminder] failed for ${type}`, error)
    }
  }
}

export function startEventReminderScheduler(intervalMs = 60_000): () => void {
  const tick = () => {
    void processEventReminders()
  }
  tick()
  const timer = setInterval(tick, intervalMs)
  return () => clearInterval(timer)
}
