'use client'

import { useRouter } from 'next/navigation'
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
import { CaseFinanceTab } from './components/case-finance-tab'
import { RelatedEventsSection } from '@/features/events/components/related-events-section'

type CaseDetailPageProps = {
  caseId: string
}

function CaseDetailDialogs({ caseId }: { caseId: string }) {
  const router = useRouter()
  const { open, setOpen, currentRow, setCurrentRow } = useCasesDialogs()
  const deleteCase = useCasesStore((state) => state.deleteCase)
  const getCase = useCasesStore((state) => state.getCase)

  // همگام‌سازی currentRow با آخرین نسخه پرونده در store
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
            const result = deleteCase(activeCase.id)
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
  const { hydrated } = useCasesHydration()
  useEventsHydration({ seedIfEmpty: false })
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
            <h2 className='text-xl font-semibold tracking-tight'>
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

        <Tabs defaultValue='info' className='flex flex-1 flex-col gap-4'>
          <div className='-mx-1 overflow-x-auto px-1'>
            <TabsList className='h-auto w-max min-w-full justify-start gap-1 sm:w-fit'>
              <TabsTrigger value='info' className='px-3'>
                اطلاعات
              </TabsTrigger>
              <TabsTrigger value='attachments' className='px-3'>
                مدارک
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
            <CaseInfoTab caseItem={caseItem} />
          </TabsContent>

          <TabsContent value='attachments' className='outline-none'>
            <CaseAttachmentsTab caseItem={caseItem} />
          </TabsContent>

          <TabsContent value='finance' className='outline-none'>
            <CaseFinanceTab caseItem={caseItem} />
          </TabsContent>

          <TabsContent value='client' className='outline-none'>
            <CaseClientTab caseItem={caseItem} client={client} />
          </TabsContent>

          <TabsContent value='events' className='outline-none'>
            <RelatedEventsSection
              caseId={caseItem.id}
              defaultClientId={caseItem.clientId}
              description='جلسات، دادگاه‌ها و مهلت‌های مرتبط با این پرونده.'
            />
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
