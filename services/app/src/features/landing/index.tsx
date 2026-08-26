'use client'

import { lawyerProfile } from './data/lawyer-profile'
import { CaseStudies } from './components/case-studies'
import { ContactCta } from './components/contact-cta'
import { CoverageSection } from './components/coverage-section'
import { FaqSection } from './components/faq-section'
import { FinalCta } from './components/final-cta'
import { HowItWorks } from './components/how-it-works'
import { LandingActionsProvider } from './components/landing-actions'
import { LandingFooter } from './components/landing-footer'
import { LandingHeader } from './components/landing-header'
import { LandingHero } from './components/landing-hero'
import { PricingSection } from './components/pricing-section'
import { RequestDialog } from './components/request-dialog'
import { ServicesSection } from './components/services-section'
import { Specializations } from './components/specializations'
import { StickyMobileCta } from './components/sticky-mobile-cta'
import { TrustStats } from './components/trust-stats'
import { WhyLawyer } from './components/why-lawyer'
import './styles/landing.css'

export function LawyerLandingPage() {
  const profile = lawyerProfile

  return (
    <LandingActionsProvider>
      <div className='lawyer-landing min-h-svh'>
        <LandingHeader />
        <main>
          <LandingHero profile={profile} />
          <TrustStats
            statistics={profile.statistics}
            lawyerName={profile.lawyer.fullName}
            title={profile.lawyer.title}
            years={profile.lawyer.yearsOfExperience}
            licenseLabel={profile.lawyer.licenseLabel}
          />
          <Specializations specialties={profile.specialties} />
          <ServicesSection services={profile.services} />
          <WhyLawyer points={profile.whyPoints} />
          <CaseStudies caseStudies={profile.caseStudies} />
          <HowItWorks steps={profile.processSteps} />
          <PricingSection pricing={profile.pricing} />
          <CoverageSection locations={profile.locations} />
          <ContactCta
            availability={profile.availability}
            contact={profile.contact}
          />
          <FaqSection faq={profile.faq} />
          <FinalCta />
        </main>
        <LandingFooter />
        <StickyMobileCta />
        <RequestDialog />
      </div>
    </LandingActionsProvider>
  )
}
