'use client'

import type { FinancialPayload } from '../types'
import {
  FinancialCashflowChart,
  FinancialCompositionChart,
} from './financial-charts'

type FinancialChartsSectionProps = {
  financial: FinancialPayload
}

export function FinancialChartsSection({
  financial,
}: FinancialChartsSectionProps) {
  return (
    <section aria-label='نمودارهای مالی' className='space-y-4 sm:space-y-6'>
      <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
        <FinancialCashflowChart timeline={financial.timeline} />
        <FinancialCompositionChart summary={financial.summary} />
      </div>
    </section>
  )
}
