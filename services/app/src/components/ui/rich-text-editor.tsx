'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  Heading2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeightClassName?: string
  'aria-invalid'?: boolean
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant={active ? 'secondary' : 'ghost'}
          size='icon'
          className='size-8'
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  )
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('آدرس لینک را وارد کنید:', previous ?? 'https://')
    if (url === null) return
    const trimmed = url.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed })
      .run()
  }

  return (
    <div
      className='flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1'
      dir='rtl'
    >
      <ToolbarButton
        label='پررنگ'
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        label='کج'
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        label='عنوان'
        active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className='size-4' />
      </ToolbarButton>
      <Separator orientation='vertical' className='mx-1 h-6' />
      <ToolbarButton
        label='فهرست گلوله‌ای'
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        label='فهرست شماره‌دار'
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className='size-4' />
      </ToolbarButton>
      <ToolbarButton
        label='لینک'
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <Link2 className='size-4' />
      </ToolbarButton>
      <Separator orientation='vertical' className='mx-1 h-6' />
      <ToolbarButton
        label='بازگردانی'
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className='size-4 rtl:-scale-x-100' />
      </ToolbarButton>
      <ToolbarButton
        label='انجام مجدد'
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className='size-4 rtl:-scale-x-100' />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'متن خود را بنویسید…',
  disabled = false,
  className,
  minHeightClassName = 'min-h-28',
  'aria-invalid': ariaInvalid,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
          dir: 'auto',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: cn(
          'prose-editor max-w-none px-3 py-2 text-sm leading-7 outline-none',
          minHeightClassName,
          '[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5',
          '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold',
          '[&_p]:my-1 [&_a]:text-primary'
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md border bg-background',
          minHeightClassName,
          className
        )}
        aria-busy
      />
    )
  }

  return (
    <div
      dir='rtl'
      className={cn(
        'overflow-hidden rounded-md border bg-background shadow-xs',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        ariaInvalid &&
          'border-destructive ring-destructive/20 dark:ring-destructive/40',
        disabled && 'opacity-60',
        className
      )}
    >
      {!disabled ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}
