'use client'

import { Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ConsultationRequest } from '../types'
import { formatAbsoluteDate, formatRelativeDate } from '../utils/format'
import { RequestStatusBadge } from './request-status-badge'

type RequestsTableProps = {
  requests: ConsultationRequest[]
  onSelect: (request: ConsultationRequest) => void
}

export function RequestsTable({ requests, onSelect }: RequestsTableProps) {
  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نام</TableHead>
            <TableHead>تماس</TableHead>
            <TableHead className='hidden md:table-cell'>موضوع</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead className='hidden sm:table-cell'>زمان</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className='cursor-pointer'
              onClick={() => onSelect(request)}
            >
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <span className='font-medium'>{request.name}</span>
                  {request.requesterUserId && (
                    <Badge variant='outline' className='w-fit text-[10px]'>
                      کاربر ثبت‌نام‌شده
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={`tel:${request.phone}`}
                  className='inline-flex items-center gap-1.5 text-sm tabular-nums hover:underline'
                  dir='ltr'
                  onClick={(event) => event.stopPropagation()}
                >
                  <Phone className='size-3.5 shrink-0' />
                  {request.phone}
                </a>
              </TableCell>
              <TableCell className='hidden max-w-xs truncate md:table-cell'>
                {request.message}
              </TableCell>
              <TableCell>
                <RequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell className='hidden sm:table-cell'>
                <div className='flex flex-col gap-0.5 text-sm'>
                  <span>{formatRelativeDate(request.createdAt)}</span>
                  <span className='text-xs text-muted-foreground'>
                    {formatAbsoluteDate(request.createdAt)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
