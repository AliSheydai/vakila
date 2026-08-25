'use client'

import { FileText, FolderOpen, UserRound, Wallet } from 'lucide-react'

type CaseTabPlaceholderProps = {
  title: string
  description: string
  icon: 'client' | 'attachments' | 'finance'
}

const icons = {
  client: UserRound,
  attachments: FolderOpen,
  finance: Wallet,
}

export function CaseTabPlaceholder({
  title,
  description,
  icon,
}: CaseTabPlaceholderProps) {
  const Icon = icons[icon]

  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Icon className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-base font-semibold tracking-tight'>{title}</h3>
      <p className='mt-2 max-w-sm text-sm text-muted-foreground'>{description}</p>
      <p className='mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
        <FileText className='size-3.5' />
        این بخش در مرحله بعد تکمیل می‌شود
      </p>
    </div>
  )
}
