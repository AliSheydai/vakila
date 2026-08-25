const currencyFormatter = new Intl.NumberFormat('fa-IR')

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export function formatMoney(amount: number): string {
  return `${currencyFormatter.format(amount)} ریال`
}

export function formatMoneyCompact(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso))
  } catch {
    return '—'
  }
}
