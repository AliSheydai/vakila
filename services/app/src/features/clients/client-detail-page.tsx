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
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useCasesHydration } from '@/features/cases/hooks/use-cases-hydration'
import { useEventsHydration } from '@/features/events/hooks/use-events-hydration'
import { useEventsStore } from '@/features/events/stores/events-store'
import {
  clientHasActiveCase,
  getCasesForClient,
} from '@/features/cases/utils/clients'
import {
  ClientsProvider,
  useClientsDialogs,
} from './components/clients-provider'
import { ClientsMutateDrawer } from './components/clients-mutate-drawer'
import { ClientDetailHeader } from './components/client-detail-header'
import { ClientInfoSection } from './components/client-info-section'
import { ClientCasesSection } from './components/client-cases-section'
import { ClientAttachmentsSection } from './components/client-attachments-section'
import { RelatedEventsSection } from '@/features/events/components/related-events-section'

type ClientDetailPageProps = {
  clientId: string
}

function ClientDetailDialogs({ clientId }: { clientId: string }) {
  const router = useRouter()
  const { open, setOpen, currentRow, setCurrentRow } = useClientsDialogs()
  const deleteClient = useCasesStore((state) => state.deleteClient)
  const getClient = useCasesStore((state) => state.getClient)
  const getClientCases = useCasesStore((state) => state.getClientCases)

  const liveClient = currentRow ? getClient(currentRow.id) : null
  const activeClient = liveClient ?? currentRow

  const linkedCount = activeClient
    ? getClientCases(activeClient.id).length
    : 0
  const isBlocked = linkedCount > 0

  const closeDelete = () => {
    setOpen(null)
    setTimeout(() => setCurrentRow(null), 500)
  }

  return (
    <>
      {activeClient && (
        <ClientsMutateDrawer
          key={`client-update-${activeClient.id}`}
          open={open === 'update'}
          onOpenChange={() => {
            setOpen('update')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          currentRow={activeClient}
        />
      )}

      {activeClient && (
        <ConfirmDialog
          destructive={!isBlocked}
          open={open === 'delete'}
          onOpenChange={() => {
            setOpen('delete')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          handleConfirm={() => {
            if (isBlocked) {
              closeDelete()
              return
            }

            const result = deleteClient(activeClient.id)
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success('موکل حذف شد.')
            closeDelete()
            if (activeClient.id === clientId) {
              router.push('/admin/clients')
            }
          }}
          className='max-w-md'
          title={isBlocked ? 'حذف امکان‌پذیر نیست' : 'حذف موکل'}
          cancelBtnText={isBlocked ? 'بستن' : 'انصراف'}
          desc={
            isBlocked ? (
              <>
                موکل «<strong>{activeClient.name}</strong>» به{' '}
                <strong>{linkedCount.toLocaleString('fa-IR')}</strong> پرونده
                متصل است. برای حذف، ابتدا ارتباط پرونده‌ها را قطع کنید.
              </>
            ) : (
              <>
                موکل «<strong>{activeClient.name}</strong>» حذف خواهد شد. این عمل
                قابل بازگشت نیست.
              </>
            )
          }
          confirmText={isBlocked ? 'متوجه شدم' : 'حذف موکل'}
        />
      )}
    </>
  )
}

function ClientDetailContent({ clientId }: ClientDetailPageProps) {
  const { hydrated } = useCasesHydration()
  useEventsHydration({ seedIfEmpty: false })
  const client = useCasesStore((state) =>
    state.clients.find((item) => item.id === clientId)
  )
  const cases = useCasesStore((state) => state.cases)
  const relatedCases = client ? getCasesForClient(cases, client.id) : []
  const hasActiveCase = client
    ? clientHasActiveCase(cases, client.id)
    : false
  const relatedEventsCount = useEventsStore(
    (state) =>
      state.events.filter((item) => item.clientId === clientId).length
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

  if (!client) {
    return (
      <>
        <Header fixed>
          <Search className='me-auto' />
          <ThemeSwitch />
        </Header>
        <Main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>
              موکل یافت نشد
            </h2>
            <p className='mt-2 text-sm text-muted-foreground'>
              این موکل وجود ندارد یا به حساب شما تعلق ندارد.
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/admin/clients'>بازگشت به فهرست موکل‌ها</Link>
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
        <ClientDetailHeader
          client={client}
          caseCount={relatedCases.length}
          hasActiveCase={hasActiveCase}
        />

        <Tabs defaultValue='info' className='flex flex-1 flex-col gap-4'>
          <div className='-mx-1 overflow-x-auto px-1'>
            <TabsList className='h-auto w-max min-w-full justify-start gap-1 sm:w-fit'>
              <TabsTrigger value='info' className='px-3'>
                اطلاعات تماس
              </TabsTrigger>
              <TabsTrigger value='cases' className='px-3'>
                پرونده‌ها
                {relatedCases.length > 0 && (
                  <span className='ms-1.5 tabular-nums text-muted-foreground'>
                    ({relatedCases.length.toLocaleString('fa-IR')})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='attachments' className='px-3'>
                ضمائم
                {(client.attachments?.length ?? 0) > 0 && (
                  <span className='ms-1.5 tabular-nums text-muted-foreground'>
                    ({(client.attachments?.length ?? 0).toLocaleString('fa-IR')})
                  </span>
                )}
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
            <ClientInfoSection client={client} />
          </TabsContent>

          <TabsContent value='cases' className='outline-none'>
            <ClientCasesSection cases={relatedCases} />
          </TabsContent>

          <TabsContent value='attachments' className='outline-none'>
            <ClientAttachmentsSection client={client} />
          </TabsContent>

          <TabsContent value='events' className='outline-none'>
            <RelatedEventsSection
              clientId={client.id}
              defaultClientId={client.id}
              description='جلسات و یادآوری‌های مرتبط با این موکل.'
            />
          </TabsContent>
        </Tabs>
      </Main>

      <ClientDetailDialogs clientId={clientId} />
    </>
  )
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  return (
    <ClientsProvider>
      <ClientDetailContent clientId={clientId} />
    </ClientsProvider>
  )
}
