'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CASE_STATUS_LABELS,
  LEGAL_AREA_LABELS,
  type CaseStatus,
  type LegalArea,
} from '@/features/cases/types'
import {
  EVENT_TYPE_LABELS,
  type EventType,
} from '@/features/events/types'
import type {
  CaseAreaBreakdown,
  CaseStatusBreakdown,
  EventTypeBreakdown,
  StatisticsTimePoint,
} from '../types'
import { formatStatMoney, formatStatNumber } from '../utils/format'
import { StatsChartCard, StatsChartEmpty } from './stats-chart-card'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

type TooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

type PersianTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  valueFormatter?: (value: number) => string
  metricLabel?: string
}

function PersianTooltip({
  active,
  payload,
  label,
  valueFormatter = formatStatNumber,
  metricLabel,
}: PersianTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-sm'>
      {label != null ? (
        <p className='mb-1 font-medium text-foreground'>{String(label)}</p>
      ) : null}
      {payload.map((item, index) => {
        const raw = item.value
        const value = typeof raw === 'number' ? raw : Number(raw ?? 0)
        return (
          <p key={`${String(item.dataKey ?? item.name)}-${index}`} className='text-muted-foreground'>
            <span
              className='ms-1 inline-block size-2 rounded-full'
              style={{ background: item.color }}
            />
            {metricLabel ?? item.name ?? 'مقدار'}:{' '}
            <span className='font-medium tabular-nums text-foreground'>
              {valueFormatter(Number.isFinite(value) ? value : 0)}
            </span>
          </p>
        )
      })}
    </div>
  )
}

function hasSeriesData(points: StatisticsTimePoint[], key: keyof StatisticsTimePoint): boolean {
  return points.some((point) => {
    const value = point[key]
    return typeof value === 'number' && value > 0
  })
}

export function StatsRevenueChart({ timeline }: { timeline: StatisticsTimePoint[] }) {
  const data = timeline.map((point) => ({
    label: point.label,
    value: point.revenue,
  }))

  return (
    <StatsChartCard
      title='روند درآمد'
      description='مجموع پرداخت‌های موفق در طول بازه انتخاب‌شده.'
    >
      {!hasSeriesData(timeline, 'revenue') ? (
        <StatsChartEmpty />
      ) : (
        <div className='h-64 w-full' role='img' aria-label='نمودار روند درآمد'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatStatNumber(value)}
              />
              <Tooltip
                content={
                  <PersianTooltip
                    metricLabel='درآمد'
                    valueFormatter={formatStatMoney}
                  />
                }
              />
              <Line
                type='monotone'
                dataKey='value'
                name='درآمد'
                stroke='var(--chart-1)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  )
}

export function StatsCasesChart({ timeline }: { timeline: StatisticsTimePoint[] }) {
  const data = timeline.map((point) => ({
    label: point.label,
    value: point.createdCases,
  }))

  return (
    <StatsChartCard
      title='روند ایجاد پرونده'
      description='تعداد پرونده‌های جدید ثبت‌شده در بازه انتخاب‌شده.'
    >
      {!hasSeriesData(timeline, 'createdCases') ? (
        <StatsChartEmpty />
      ) : (
        <div className='h-64 w-full' role='img' aria-label='نمودار روند ایجاد پرونده'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatStatNumber(value)}
              />
              <Tooltip content={<PersianTooltip metricLabel='پرونده جدید' />} />
              <Bar dataKey='value' name='پرونده جدید' fill='var(--chart-2)' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  )
}

export function StatsClientsChart({ timeline }: { timeline: StatisticsTimePoint[] }) {
  const data = timeline.map((point) => ({
    label: point.label,
    value: point.newClients,
  }))

  return (
    <StatsChartCard
      title='روند موکلین جدید'
      description='تعداد موکلینی که در بازه انتخاب‌شده ثبت شده‌اند.'
    >
      {!hasSeriesData(timeline, 'newClients') ? (
        <StatsChartEmpty />
      ) : (
        <div className='h-64 w-full' role='img' aria-label='نمودار روند موکلین جدید'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatStatNumber(value)}
              />
              <Tooltip content={<PersianTooltip metricLabel='موکل جدید' />} />
              <Line
                type='monotone'
                dataKey='value'
                name='موکل جدید'
                stroke='var(--chart-3)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  )
}

export function StatsEventsChart({ timeline }: { timeline: StatisticsTimePoint[] }) {
  const data = timeline.map((point) => ({
    label: point.label,
    value: point.events,
  }))

  return (
    <StatsChartCard
      title='روند رویدادها'
      description='حجم فعالیت‌های ثبت‌شده (جلسه، دادگاه، مهلت و...) در بازه.'
    >
      {!hasSeriesData(timeline, 'events') ? (
        <StatsChartEmpty />
      ) : (
        <div className='h-64 w-full' role='img' aria-label='نمودار روند رویدادها'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatStatNumber(value)}
              />
              <Tooltip content={<PersianTooltip metricLabel='رویداد' />} />
              <Bar dataKey='value' name='رویداد' fill='var(--chart-4)' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  )
}

type DonutItem = { name: string; value: number }

function DonutChartView({
  data,
  ariaLabel,
}: {
  data: DonutItem[]
  ariaLabel: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
      <div className='h-56 w-full' role='img' aria-label={ariaLabel}>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={data}
              dataKey='value'
              nameKey='name'
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<PersianTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className='space-y-2 text-sm'>
        {data.map((item, index) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <li key={item.name} className='flex items-center justify-between gap-3'>
              <span className='flex min-w-0 items-center gap-2'>
                <span
                  className='size-2.5 shrink-0 rounded-full'
                  style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className='truncate'>{item.name}</span>
              </span>
              <span className='shrink-0 tabular-nums text-muted-foreground'>
                {formatStatNumber(item.value)} · {formatStatNumber(percent)}٪
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function StatsCaseStatusChart({
  items,
}: {
  items: CaseStatusBreakdown[]
}) {
  const data = items
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: CASE_STATUS_LABELS[item.status as CaseStatus] ?? item.status,
      value: item.count,
    }))

  return (
    <StatsChartCard
      title='وضعیت پرونده‌ها'
      description='توزیع فعلی پرونده‌ها بر اساس وضعیت موجود در سیستم.'
    >
      {data.length === 0 ? (
        <StatsChartEmpty />
      ) : (
        <DonutChartView data={data} ariaLabel='نمودار توزیع وضعیت پرونده‌ها' />
      )}
    </StatsChartCard>
  )
}

export function StatsCaseAreaChart({
  items,
}: {
  items: CaseAreaBreakdown[]
}) {
  const data = items
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: LEGAL_AREA_LABELS[item.legalArea as LegalArea] ?? item.legalArea,
      value: item.count,
    }))

  return (
    <StatsChartCard
      title='انواع پرونده'
      description='سهم حوزه‌های حقوقی پرونده‌های ثبت‌شده.'
    >
      {data.length === 0 ? (
        <StatsChartEmpty />
      ) : (
        <DonutChartView data={data} ariaLabel='نمودار توزیع انواع پرونده' />
      )}
    </StatsChartCard>
  )
}

export function StatsEventTypeChart({
  items,
}: {
  items: EventTypeBreakdown[]
}) {
  const data = items
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: EVENT_TYPE_LABELS[item.type as EventType] ?? item.type,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <StatsChartCard
      title='انواع رویداد'
      description='تفکیک رویدادهای بازه انتخاب‌شده بر اساس نوع.'
    >
      {data.length === 0 ? (
        <StatsChartEmpty />
      ) : (
        <div className='h-64 w-full' role='img' aria-label='نمودار انواع رویداد'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              layout='vertical'
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' horizontal={false} />
              <XAxis
                type='number'
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatStatNumber(value)}
              />
              <YAxis
                type='category'
                dataKey='name'
                width={100}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<PersianTooltip metricLabel='تعداد' />} />
              <Bar dataKey='value' name='تعداد' fill='var(--chart-5)' radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  )
}
