'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FinancialSummary, FinancialTimePoint } from '../types'
import {
  formatFinancialMoney,
  formatFinancialNumber,
} from '../utils/format'
import {
  FinancialChartCard,
  FinancialChartEmpty,
  FinancialChartFrame,
} from './financial-chart-card'

type TooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: {
    fullName?: string
    name?: string
  }
}

type PersianTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  valueFormatter?: (value: number) => string
  labelFormatter?: (
    label: string | number | undefined,
    payload?: TooltipPayloadItem[]
  ) => string
}

function PersianTooltip({
  active,
  payload,
  label,
  valueFormatter = formatFinancialMoney,
  labelFormatter,
}: PersianTooltipProps) {
  if (!active || !payload?.length) return null

  const title = labelFormatter
    ? labelFormatter(label, payload)
    : label != null
      ? String(label)
      : null

  return (
    <div
      dir='rtl'
      className='rounded-lg border bg-background px-3 py-2 text-xs shadow-sm'
    >
      {title ? (
        <p className='mb-1 font-medium text-foreground'>{title}</p>
      ) : null}
      {payload.map((item, index) => {
        const raw = item.value
        const value = typeof raw === 'number' ? raw : Number(raw ?? 0)
        return (
          <p
            key={`${String(item.dataKey ?? item.name)}-${index}`}
            className='text-muted-foreground'
          >
            <span
              className='ms-1 inline-block size-2 rounded-full'
              style={{ background: item.color }}
              aria-hidden
            />
            {item.name ?? 'مقدار'}:{' '}
            <span className='font-medium tabular-nums text-foreground'>
              {valueFormatter(Number.isFinite(value) ? value : 0)}
            </span>
          </p>
        )
      })}
    </div>
  )
}

function hasCashflowData(timeline: FinancialTimePoint[]): boolean {
  return timeline.some((point) => point.inflow > 0 || point.outflow > 0)
}

export function FinancialCashflowChart({
  timeline,
}: {
  timeline: FinancialTimePoint[]
}) {
  const data = timeline.map((point) => ({
    label: point.label,
    inflow: point.inflow,
    outflow: point.outflow,
  }))

  return (
    <FinancialChartCard
      title='جریان نقدی'
      description='دریافت‌های موفق و هزینه‌ها در طول بازه انتخاب‌شده.'
    >
      {!hasCashflowData(timeline) ? (
        <FinancialChartEmpty />
      ) : (
        <FinancialChartFrame ariaLabel='نمودار جریان نقدی دریافت و هزینه'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatFinancialNumber(value)}
              />
              <Tooltip content={<PersianTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, direction: 'rtl' }}
                formatter={(value) => (
                  <span className='text-muted-foreground'>{value}</span>
                )}
              />
              <Line
                type='monotone'
                dataKey='inflow'
                name='دریافت'
                stroke='var(--chart-1)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type='monotone'
                dataKey='outflow'
                name='هزینه'
                stroke='var(--chart-4)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </FinancialChartFrame>
      )}
    </FinancialChartCard>
  )
}

export function FinancialCompositionChart({
  summary,
}: {
  summary: FinancialSummary
}) {
  const data = [
    { key: 'gross', name: 'ناخالص', fullName: 'درآمد ناخالص', value: summary.grossRevenue },
    { key: 'tax', name: 'مالیات', fullName: 'مالیات محاسبه‌شده', value: summary.taxTotal },
    { key: 'expenses', name: 'هزینه', fullName: 'هزینه', value: summary.expensesTotal },
    { key: 'profit', name: 'سود', fullName: 'سود', value: summary.profit },
  ]

  const hasData = data.some((item) => item.value !== 0)

  return (
    <FinancialChartCard
      title='ترکیب مالی بازه'
      description='مقایسه درآمد ناخالص، مالیات محاسبه‌شده، هزینه و سود.'
    >
      {!hasData ? (
        <FinancialChartEmpty />
      ) : (
        <FinancialChartFrame ariaLabel='نمودار ترکیب مالی بازه'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='name'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatFinancialNumber(value)}
              />
              <Tooltip
                content={
                  <PersianTooltip
                    labelFormatter={(_label, items) =>
                      items?.[0]?.payload?.fullName ??
                      items?.[0]?.payload?.name ??
                      String(_label ?? '')
                    }
                  />
                }
              />
              <Bar
                dataKey='value'
                name='مبلغ'
                fill='var(--chart-2)'
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </FinancialChartFrame>
      )}
    </FinancialChartCard>
  )
}
