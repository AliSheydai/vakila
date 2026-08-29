export type UserRole = 'super_admin' | 'lawyer' | 'client'

export type User = {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  title: string | null
  specialty: string | null
  bar_number: string | null
  is_active: boolean
  totp_enabled?: boolean
  totp_secret_encrypted?: string | null
  totp_pending_secret_encrypted?: string | null
  totp_confirmed_at?: Date | null
  created_at: Date
  updated_at: Date
}

export type AuthSessionRow = {
  id: string
  user_id: string
  token_hash: string
  user_agent: string | null
  ip_address: string | null
  expires_at: Date
  revoked_at: Date | null
  created_at: Date
}

export type OtpChallengeRow = {
  id: string
  phone: string
  code_hash: string
  attempts: number
  max_attempts: number
  expires_at: Date
  consumed_at: Date | null
  ip_address: string | null
  created_at: Date
}

export type DbChangePayload = {
  table: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  id: string
  row: Record<string, unknown>
  ts: string
}

export type ClientRow = {
  id: string
  owner_id: string
  linked_user_id: string | null
  name: string
  phone: string
  email: string | null
  citizenship: 'iranian' | 'foreign' | null
  national_id: string | null
  avatar_data_url: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export type CaseRow = {
  id: string
  case_number: string
  title: string
  description: string
  description_html: string
  legal_area: string
  status: string
  owner_id: string
  client_id: string | null
  client_user_id: string | null
  created_by: 'lawyer' | 'client'
  lawyer_synced: boolean
  created_at: Date
  updated_at: Date
}
