import type { Metadata } from 'next'
import { LawyerLandingPage } from '@/features/landing'
import { lawyerProfile } from '@/features/landing/data/lawyer-profile'

export const metadata: Metadata = {
  title: `${lawyerProfile.lawyer.fullName} | وکیل پایه یک دادگستری`,
  description: `${lawyerProfile.lawyer.headline} · ${lawyerProfile.locations.cities.join(' و ')} · ${lawyerProfile.lawyer.yearsOfExperience} سال سابقه`,
}

export default function HomePage() {
  return <LawyerLandingPage />
}
