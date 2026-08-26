'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function getClientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const value = parts[0].slice(0, 2)
    return /[A-Za-z]/.test(value) ? value.toUpperCase() : value
  }
  const initials = `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`
  return /[A-Za-z]/.test(initials) ? initials.toUpperCase() : initials
}

type ClientAvatarProps = {
  name: string
  avatarDataUrl?: string | null
  className?: string
  fallbackClassName?: string
}

export function ClientAvatar({
  name,
  avatarDataUrl,
  className,
  fallbackClassName,
}: ClientAvatarProps) {
  return (
    <Avatar className={cn(className)}>
      {avatarDataUrl ? (
        <AvatarImage src={avatarDataUrl} alt={name} className='object-cover' />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {getClientInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
