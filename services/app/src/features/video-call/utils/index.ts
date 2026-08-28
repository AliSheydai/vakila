export function sessionToCallTimes(session: {
  startsAt: string
  durationMinutes: number
}): { date: string; startTime: string; endTime: string } {
  const start = new Date(session.startsAt)
  const end = new Date(start.getTime() + session.durationMinutes * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  }
}

export function isOnlineVideoSession(session: {
  type: string
  meetingUrl?: string | null
}): boolean {
  return session.type === 'online' && Boolean(session.meetingUrl)
}

export function getLobbyHref(eventId: string): string {
  return `/call/${eventId}/lobby`
}
