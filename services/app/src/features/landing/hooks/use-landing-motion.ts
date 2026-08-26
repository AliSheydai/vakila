'use client'

import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type RevealOptions = {
  y?: number
  duration?: number
  stagger?: number
  start?: string
}

export function useLandingReveal(
  scope: RefObject<HTMLElement | null>,
  selector = '.lp-reveal',
  options: RevealOptions = {}
) {
  const {
    y = 28,
    duration = 0.9,
    stagger = 0.1,
    start = 'top 85%',
  } = options

  useGSAP(
    () => {
      if (!scope.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(selector, { clearProps: 'all', opacity: 1, y: 0, x: 0 })
        return
      }

      const targets = scope.current.querySelectorAll(selector)
      targets.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: 'play none none none',
            },
          }
        )
      })
    },
    { scope, dependencies: [selector, y, duration, stagger, start] }
  )
}

export function useHeroIntro(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!scope.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(scope.current.querySelectorAll('[data-hero]'), {
        clearProps: 'all',
        opacity: 1,
        y: 0,
      })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(
        '[data-hero="brand"]',
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.15 },
        0.15
      )
        .fromTo(
          '[data-hero="headline"]',
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9 },
          '-=0.55'
        )
        .fromTo(
          '[data-hero="lead"]',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        )
        .fromTo(
          '[data-hero="cta"]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
          '-=0.45'
        )
        .fromTo(
          '[data-hero="scene"]',
          { opacity: 0, scale: 1.06 },
          { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' },
          0
        )
    }, scope)

    return () => ctx.revert()
  }, [scope])
}
