import { api } from '@/lib/api-client'
import type {
  ConsultationRequest,
  CreateConsultationRequestInput,
  UpdateConsultationRequestInput,
} from '../types'

export async function listConsultationRequests() {
  return api<ConsultationRequest[]>('/api/consultation-requests')
}

export async function fetchNewConsultationRequestsCount() {
  return api<{ count: number }>('/api/consultation-requests?count=new')
}

export async function createConsultationRequest(
  input: CreateConsultationRequestInput
) {
  return api<ConsultationRequest>('/api/consultation-requests', {
    method: 'POST',
    body: input,
  })
}

export async function updateConsultationRequest(
  id: string,
  input: UpdateConsultationRequestInput
) {
  return api<ConsultationRequest>(`/api/consultation-requests/${id}`, {
    method: 'PATCH',
    body: input,
  })
}
