'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type UnseenActivityBadgeProps = {
  count: number
  comments?: number
  documents?: number
  className?: string
}

export function UnseenActivityBadge({
  count,
  comments = 0,
  documents = 0,
  className,
}: UnseenActivityBadgeProps) {
  if (count <= 0) return null

  const tooltipParts: string[] = []
  if (comments > 0) {
    tooltipParts.push(`${comments.toLocaleString('fa-IR')} پیام`)
  }
  if (documents > 0) {
    tooltipParts.push(`${documents.toLocaleString('fa-IR')} فایل`)
  }
  const tooltip =
    tooltipParts.length > 0
      ? `${tooltipParts.join(' و ')} جدید`
      : `${count.toLocaleString('fa-IR')} مورد جدید`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums',
            className
          )}
        >
          {count.toLocaleString('fa-IR')}
        </span>
      </TooltipTrigger>
      <TooltipContent side='top'>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
