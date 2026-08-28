'use client'

import { cn } from '@/lib/utils'
import { plainTextToHtml } from '@/lib/html'

type RichTextContentProps = {
  html?: string
  plainFallback?: string
  className?: string
  emptyLabel?: string
}

/**
 * نمایش HTML ادیتور با جهت RTL.
 * محتوای نمونهٔ داخلی قابل‌اعتماد است؛ برای ورودی کاربر sanitize سبک انجام می‌شود.
 */
export function RichTextContent({
  html,
  plainFallback,
  className,
  emptyLabel = 'متنی ثبت نشده است.',
}: RichTextContentProps) {
  const raw =
    (html && html.trim()) ||
    (plainFallback ? plainTextToHtml(plainFallback) : '')

  if (!raw || isVisuallyEmpty(raw)) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {emptyLabel}
      </p>
    )
  }

  const safe = sanitizeBasicHtml(raw)

  return (
    <div
      dir='rtl'
      className={cn(
        'text-sm leading-7 text-foreground',
        '[&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5',
        '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5',
        '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_strong]:font-semibold',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}

function isVisuallyEmpty(html: string): boolean {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
}

/** حذف تگ‌ها و attributeهای خطرناک رایج (prototype). */
function sanitizeBasicHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
}
