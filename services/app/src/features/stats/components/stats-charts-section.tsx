'use client'

import type { StatisticsPayload } from '../types'
import {
  StatsCaseAreaChart,
  StatsCaseStatusChart,
  StatsCasesChart,
  StatsClientsChart,
  StatsEventTypeChart,
  StatsEventsChart,
  StatsRevenueChart,
} from './stats-charts'

type StatsChartsSectionProps = {
  statistics: StatisticsPayload
}

export function StatsChartsSection({ statistics }: StatsChartsSectionProps) {
  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <StatsRevenueChart timeline={statistics.timeline} />
        <StatsCasesChart timeline={statistics.timeline} />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <StatsClientsChart timeline={statistics.timeline} />
        <StatsEventsChart timeline={statistics.timeline} />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <StatsCaseStatusChart items={statistics.caseStatusBreakdown} />
        <StatsCaseAreaChart items={statistics.caseAreaBreakdown} />
      </div>

      <StatsEventTypeChart items={statistics.eventTypeBreakdown} />
    </div>
  )
}
