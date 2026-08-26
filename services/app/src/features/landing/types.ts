export type LawyerCredential = {
  id: string
  label: string
}

export type LawyerSpecialty = {
  id: string
  title: string
  description?: string
  featured?: boolean
}

export type LawyerService = {
  id: string
  title: string
  description: string
  icon: string
}

export type LawyerStatistic = {
  id: string
  label: string
  value: string
  hint?: string
}

export type LawyerCaseStudy = {
  id: string
  domain: string
  subject: string
  serviceType: string
  outcome: string
}

export type WhyPoint = {
  id: string
  title: string
  description: string
  icon: string
}

export type ProcessStep = {
  id: string
  step: number
  title: string
  description: string
}

export type ConsultationInfo = {
  available: boolean
  statusLabel: string
  onlineAvailable: boolean
  note: string
}

export type PricingInfo = {
  consultationFeeLabel: string | null
  feePolicy: string
  installmentAvailable: boolean
  paymentNotes: string[]
}

export type LocationInfo = {
  cities: string[]
  officeAddress: string | null
  onlineConsultation: boolean
  otherCitiesSupported: boolean
  otherCitiesNote?: string
}

export type AvailabilityInfo = {
  responseHint: string
  workingHours: string
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export type LawyerProfile = {
  lawyer: {
    id: string
    fullName: string
    title: string
    headline: string
    avatarUrl: string | null
    initials: string
    yearsOfExperience: number
    verified: boolean
    licenseLabel: string
  }
  credentials: LawyerCredential[]
  specialties: LawyerSpecialty[]
  services: LawyerService[]
  statistics: LawyerStatistic[]
  whyPoints: WhyPoint[]
  caseStudies: LawyerCaseStudy[]
  processSteps: ProcessStep[]
  consultation: ConsultationInfo
  pricing: PricingInfo
  locations: LocationInfo
  availability: AvailabilityInfo
  faq: FaqItem[]
}
