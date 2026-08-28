'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { usePortalStore } from '../stores/portal-store'
import { LEGAL_AREAS, LEGAL_AREA_LABELS } from '../types'
import { isEmptyHtml } from '../utils/html'
import { formatFileSize } from '../utils/format'
import { setDocumentSessionUrl } from '../utils/document-session'

const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

const formSchema = z.object({
  title: z.string().min(1, 'عنوان پرونده الزامی است.'),
  legalArea: z.enum(LEGAL_AREAS, {
    required_error: 'حوزه حقوقی را انتخاب کنید.',
  }),
  descriptionHtml: z.string(),
})

type FormValues = z.infer<typeof formSchema>

type PendingFile = {
  key: string
  file: File
}

type ClientCreateCaseDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientCreateCaseDrawer({
  open,
  onOpenChange,
}: ClientCreateCaseDrawerProps) {
  const router = useRouter()
  const createCase = usePortalStore((s) => s.createCase)
  const lawyers = usePortalStore((s) => s.lawyers)
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<PendingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      legalArea: 'civil',
      descriptionHtml: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        legalArea: 'civil',
        descriptionHtml: '',
      })
      setFiles([])
    }
  }, [open, form])

  const onPickFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next: PendingFile[] = []
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`حجم فایل «${file.name}» بیشتر از ۱۰ مگابایت است.`)
        continue
      }
      const lower = file.name.toLowerCase()
      const ok = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
      if (!ok) {
        toast.error(`نوع فایل «${file.name}» پشتیبانی نمی‌شود.`)
        continue
      }
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file })
    }
    setFiles((prev) => {
      const keys = new Set(prev.map((p) => p.key))
      return [...prev, ...next.filter((f) => !keys.has(f.key))]
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const result = await createCase({
        title: values.title.trim(),
        legalArea: values.legalArea,
        descriptionHtml: isEmptyHtml(values.descriptionHtml)
          ? ''
          : values.descriptionHtml,
        lawyerId: lawyers[0]?.id,
        documents: files.map(({ file }) => ({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        })),
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      // نگه‌داشتن Object URL برای دانلود در همین جلسه
      result.data.documents.forEach((doc, index) => {
        const pending = files[index]
        if (pending) setDocumentSessionUrl(doc.id, pending.file)
      })

      toast.success('پرونده ثبت شد و در انتظار بررسی وکیل است.')
      onOpenChange(false)
      router.push(`/cases/${result.data.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg'>
        <SheetHeader className='border-b p-4 text-start'>
          <SheetTitle>ثبت پرونده جدید</SheetTitle>
          <SheetDescription>
            پس از ثبت، جزئیات پرونده قابل ویرایش نیست. می‌توانید از طریق گفتگو
            و مدارک با وکیل در ارتباط باشید.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='client-create-case-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان پرونده</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='مثلاً اختلاف قرارداد اجاره'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='legalArea'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حوزه حقوقی</FormLabel>
                  <Select
                    dir='rtl'
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='انتخاب حوزه' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEGAL_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {LEGAL_AREA_LABELS[area]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='descriptionHtml'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='شرح مختصر موضوع، طرفین و خواسته خود را بنویسید…'
                      minHeightClassName='min-h-36'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <FormLabel>مدارک اولیه (اختیاری)</FormLabel>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                className='hidden'
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className='size-4' />
                انتخاب فایل
              </Button>
              {files.length > 0 ? (
                <ul className='space-y-2'>
                  {files.map((item) => (
                    <li
                      key={item.key}
                      className='flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm'
                    >
                      <div className='min-w-0'>
                        <p className='truncate font-medium'>{item.file.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 shrink-0'
                        aria-label='حذف فایل'
                        onClick={() =>
                          setFiles((prev) =>
                            prev.filter((f) => f.key !== item.key)
                          )
                        }
                      >
                        <X className='size-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </form>
        </Form>

        <SheetFooter className='gap-2 border-t sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            type='submit'
            form='client-create-case-form'
            disabled={submitting}
          >
            {submitting ? 'در حال ثبت…' : 'ثبت پرونده'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
