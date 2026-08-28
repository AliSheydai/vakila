import { formatDistanceToNow } from 'date-fns'
import { faIR } from 'date-fns/locale'

export function formatRelativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: faIR,
    })
  } catch {
    return iso
  }
}

export function formatAbsoluteDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
