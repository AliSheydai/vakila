'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCasesStore } from './stores/cases-store'
import { useCasesHydration } from './hooks/use-cases-hydration'
import { useEventsHydration } from '@/features/events/hooks/use-events-hydration'
import { useEventsStore } from '@/features/events/stores/events-store'
import { CasesProvider, useCasesDialogs } from './components/cases-provider'
import { CasesMutateDrawer } from './components/cases-mutate-drawer'
import { CaseDetailHeader } from './components/case-detail-header'
import { CaseInfoTab } from './components/case-info-tab'
import { CaseClientTab } from './components/case-client-tab'
import { CaseAttachmentsTab } from './components/case-attachments-tab'
import { CaseCommentsTab } from './components/case-comments-tab'
import { CaseFinanceTab } from './components/case-finance-tab'
import { useUnseenCommentsCount } from './hooks/use-unseen-comments-count'
import { useUnseenDocumentsCount } from './hooks/use-unseen-documents-count'
import { RelatedEventsSection } from '@/features/events/components/related-events-section'

const ADMIN_CASE_TABS = [
  'info',
  'comments',
  'attachments',
  'finance',
  'client',
  'events',
] as const

type AdminCaseTab = (typeof ADMIN_CASE_TABS)[number]

function parseAdminCaseTab(value: string | null): AdminCaseTab {
  if (value && ADMIN_CASE_TABS.includes(value as AdminCaseTab)) {
    return value as AdminCaseTab
  }
  return 'info'
}

type CaseDetailPageProps = {
  caseId: string
}

function CaseDetailDialogs({ caseId }: { caseId: string }) {
  const router = useRouter()
  const { open, setOpen, currentRow, setCurrentRow } = useCasesDialogs()
  const deleteCase = useCasesStore((state) => state.deleteCase)
  const getCase = useCasesStore((state) => state.getCase)

  const liveCase = currentRow ? getCase(currentRow.id) : null
  const activeCase = liveCase ?? currentRow

  return (
    <>
      {activeCase && (
        <CasesMutateDrawer
          key={`case-update-${activeCase.id}`}
          open={open === 'update'}
          onOpenChange={() => {
            setOpen('update')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          currentRow={activeCase}
        />
      )}

      {activeCase && (
        <ConfirmDialog
          destructive
          open={open === 'delete'}
          onOpenChange={() => {
            setOpen('delete')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          handleConfirm={() => {
            void (async () => {
              const result = await deleteCase(activeCase.id)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              toast.success('پرونده حذف شد.')
              setOpen(null)
              setCurrentRow(null)
              if (activeCase.id === caseId) {
                router.push('/admin/cases')
              }
            })()
          }}
          className='max-w-md'
          title='حذف پرونده'
          desc={
            <>
              پرونده «<strong>{activeCase.title}</strong>» با شماره{' '}
              <strong>{activeCase.caseNumber}</strong> حذف خواهد شد. این عمل قابل
              بازگشت نیست.
            </>
          }
          confirmText='حذف پرونده'
        />
      )}
    </>
  )
}

function CaseDetailContent({ caseId }: CaseDetailPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hydrated } = useCasesHydration()
  useEventsHydration()

  const initialTab = useMemo(
    () => parseAdminCaseTab(searchParams.get('tab')),
    [searchParams]
  )
  const [activeTab, setActiveTab] = useState<AdminCaseTab>(initialTab)

  useEffect(() => {
    setActiveTab(parseAdminCaseTab(searchParams.get('tab')))
  }, [searchParams])

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseAdminCaseTab(value)
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'info') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.replace(
        qs ? `/admin/cases/${caseId}?${qs}` : `/admin/cases/${caseId}`,
        { scroll: false }
      )
    },
    [caseId, router, searchParams]
  )

  const { count: unseenComments, reload: reloadUnseenCount } =
    useUnseenCommentsCount(caseId, hydrated && activeTab === 'comments')
  const { count: unseenDocuments, reload: reloadUnseenDocuments } =
    useUnseenDocumentsCount(caseId, hydrated && activeTab === 'attachments')

  const caseItem = useCasesStore((state) =>
    state.cases.find((item) => item.id === caseId)
  )
  const client = useCasesStore((state) =>
    caseItem?.clientId
      ? (state.clients.find((item) => item.id === caseItem.clientId) ?? null)
      : null
  )
  const relatedEventsCount = useEventsStore(
    (state) => state.events.filter((item) => item.caseId === caseId).length
  )

  if (!hydrated) {
    return (
      <>
        <Header fixed>
          <Search className='me-auto' />
          <ThemeSwitch />
        </Header>
        <Main className='flex flex-1 flex-col gap-6'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-10 w-80' />
          <Skeleton className='h-64 w-full' />
        </Main>
      </>
    )
  }

  if (!caseItem) {
    return (
      <>
        <Header fixed>
          <Search className='me-auto' />
          <ThemeSwitch />
        </Header>
        <Main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
          <div>
            <h2 className='font-display text-xl font-semibold tracking-tight'>
              پرونده یافت نشد
            </h2>
            <p className='mt-2 text-sm text-muted-foreground'>
              این پرونده وجود ندارد یا به حساب شما تعلق ندارد.
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/admin/cases'>بازگشت به فهرست پرونده‌ها</Link>
          </Button>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <CaseDetailHeader caseItem={caseItem} client={client} />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='flex flex-1 flex-col gap-4'
        >
          <div className='-mx-1 overflow-x-auto px-1'>
            <TabsList className='h-auto w-max min-w-full justify-start gap-1 sm:w-fit'>
              <TabsTrigger value='info' className='px-3'>
                اطلاعات
              </TabsTrigger>
              <TabsTrigger value='comments' className='px-3'>
                گفتگو
                {unseenComments > 0 && (
                  <span className='ms-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums'>
                    {unseenComments.toLocaleString('fa-IR')}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='attachments' className='px-3'>
                مدارک
                {unseenDocuments > 0 && (
                  <span className='ms-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums'>
                    {unseenDocuments.toLocaleString('fa-IR')}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='finance' className='px-3'>
                مالی
              </TabsTrigger>
              <TabsTrigger value='client' className='px-3'>
                موکل
              </TabsTrigger>
              <TabsTrigger value='events' className='px-3'>
                رویدادها
                {relatedEventsCount > 0 && (
                  <span className='ms-1.5 tabular-nums text-muted-foreground'>
                    ({relatedEventsCount.toLocaleString('fa-IR')})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='info' className='flex-1 outline-none'>
            {activeTab === 'info' ? <CaseInfoTab caseItem={caseItem} /> : null}
          </TabsContent>

          <TabsContent value='comments' className='outline-none'>
            {activeTab === 'comments' ? (
              <CaseCommentsTab
                caseItem={caseItem}
                onSeen={() => void reloadUnseenCount()}
              />
            ) : null}
          </TabsContent>

          <TabsContent value='attachments' className='outline-none'>
            {activeTab === 'attachments' ? (
              <CaseAttachmentsTab
                caseItem={caseItem}
                onSeen={() => void reloadUnseenDocuments()}
              />
            ) : null}
          </TabsContent>

          <TabsContent value='finance' className='outline-none'>
            {activeTab === 'finance' ? (
              <CaseFinanceTab caseItem={caseItem} />
            ) : null}
          </TabsContent>

          <TabsContent value='client' className='outline-none'>
            {activeTab === 'client' ? (
              <CaseClientTab caseItem={caseItem} client={client} />
            ) : null}
          </TabsContent>

          <TabsContent value='events' className='outline-none'>
            {activeTab === 'events' ? (
              <RelatedEventsSection
                caseId={caseItem.id}
                defaultClientId={caseItem.clientId}
                description='جلسات، دادگاه‌ها و مهلت‌های مرتبط با این پرونده.'
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </Main>

      <CaseDetailDialogs caseId={caseId} />
    </>
  )
}

export function CaseDetailPage({ caseId }: CaseDetailPageProps) {
  return (
    <CasesProvider>
      <CaseDetailContent caseId={caseId} />
    </CasesProvider>
  )
}
