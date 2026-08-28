export function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function toIsoRequired(value: Date | string): string {
  return toIso(value) ?? new Date(0).toISOString()
}

export function num(value: string | number | null | undefined): number {
  if (value == null) return 0
  return typeof value === 'number' ? value : Number(value)
}

export function maskPhone(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, '')
  if (digits.length < 8) return '***'
  return `${digits.slice(0, 4)}***${digits.slice(-4)}`
}

export type PublicUser = {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: string
  avatarUrl: string | null
  title: string | null
  specialty: string | null
  barNumber: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function toPublicUser(user: {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
  title: string | null
  specialty: string | null
  bar_number: string | null
  is_active?: boolean
  created_at: Date | string
  updated_at: Date | string
}): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url,
    title: user.title,
    specialty: user.specialty,
    barNumber: user.bar_number,
    isActive: user.is_active ?? true,
    createdAt: toIsoRequired(user.created_at),
    updatedAt: toIsoRequired(user.updated_at),
  }
}
