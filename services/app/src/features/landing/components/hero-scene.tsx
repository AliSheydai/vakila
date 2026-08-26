'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type HeroSceneProps = {
  className?: string
}

/**
 * Abstract balance sculpture + floating dust for the lawyer landing hero.
 * Full-bleed WebGL plane — not an inset media card.
 */
export function HeroScene({ className }: HeroSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x06141c, 0.045)

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100
    )
    camera.position.set(0, 0.35, 7.2)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const brass = new THREE.MeshStandardMaterial({
      color: 0xc9a25a,
      metalness: 0.92,
      roughness: 0.28,
      emissive: 0x3a2a10,
      emissiveIntensity: 0.35,
    })
    const inkMetal = new THREE.MeshStandardMaterial({
      color: 0x1a4654,
      metalness: 0.75,
      roughness: 0.42,
      emissive: 0x06141c,
      emissiveIntensity: 0.2,
    })

    // Central pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 2.6, 24),
      inkMetal
    )
    pillar.position.y = -0.2
    group.add(pillar)

    // Balance beam
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.07, 0.12),
      brass
    )
    beam.position.y = 1.05
    group.add(beam)

    // Fulcrum diamond
    const fulcrum = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      brass
    )
    fulcrum.position.y = 1.05
    fulcrum.rotation.z = Math.PI / 4
    group.add(fulcrum)

    const makePan = (x: number) => {
      const panGroup = new THREE.Group()
      panGroup.position.set(x, 0.55, 0)

      const chainGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8)
      ;[-0.28, 0.28].forEach((cx) => {
        const chain = new THREE.Mesh(chainGeo, brass)
        chain.position.set(cx, 0.35, 0)
        panGroup.add(chain)
      })

      const dish = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.36, 0.06, 32, 1, true),
        brass
      )
      dish.position.y = 0.05
      panGroup.add(dish)

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.39, 0.02, 8, 48),
        brass
      )
      rim.rotation.x = Math.PI / 2
      rim.position.y = 0.08
      panGroup.add(rim)

      return panGroup
    }

    const leftPan = makePan(-1.45)
    const rightPan = makePan(1.45)
    group.add(leftPan, rightPan)

    // Orbiting brass rings (abstract jurisdiction / continuity)
    const rings = new THREE.Group()
    ;[1.8, 2.35, 2.9].forEach((radius, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.008, 8, 96),
        new THREE.MeshStandardMaterial({
          color: 0xc9a25a,
          metalness: 0.9,
          roughness: 0.35,
          transparent: true,
          opacity: 0.35 - i * 0.08,
          emissive: 0xc9a25a,
          emissiveIntensity: 0.15,
        })
      )
      ring.rotation.x = Math.PI / 2.4 + i * 0.18
      ring.rotation.y = i * 0.4
      rings.add(ring)
    })
    group.add(rings)

    // Soft dust particles
    const dustCount = reduceMotion ? 80 : 220
    const dustPositions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 12
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xe8c87a,
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    scene.add(dust)

    // Lights
    scene.add(new THREE.AmbientLight(0x6a8a95, 0.55))
    const key = new THREE.DirectionalLight(0xffe2a8, 1.35)
    key.position.set(3.5, 5, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x4a8fa0, 0.55)
    fill.position.set(-4, 1, -2)
    scene.add(fill)
    const rimLight = new THREE.PointLight(0xc9a25a, 18, 12, 2)
    rimLight.position.set(0, 1.2, 2.5)
    scene.add(rimLight)

    // Soft ground glow plane
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc9a25a,
        transparent: true,
        opacity: 0.07,
      })
    )
    glow.rotation.x = -Math.PI / 2
    glow.position.y = -1.55
    scene.add(glow)

    const pointer = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    let frame = 0
    let raf = 0
    const clock = new THREE.Clock()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      frame++

      if (!reduceMotion) {
        group.rotation.y = t * 0.12 + pointer.x * 0.18
        group.rotation.x = pointer.y * 0.08
        group.position.y = Math.sin(t * 0.55) * 0.05

        const sway = Math.sin(t * 0.7) * 0.08
        beam.rotation.z = sway
        leftPan.position.y = 0.55 + sway * 1.6
        rightPan.position.y = 0.55 - sway * 1.6
        rings.rotation.z = t * 0.05
        rings.rotation.y = t * 0.08

        dust.rotation.y = t * 0.03
        if (frame % 2 === 0) {
          rimLight.intensity = 16 + Math.sin(t * 1.4) * 4
        }
      } else {
        group.rotation.y = 0.35
      }

      camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.04
      camera.lookAt(0, 0.2, 0)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = mount.clientWidth
      const h = Math.max(mount.clientHeight, 1)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      brass.dispose()
      inkMetal.dispose()
      dustGeo.dispose()
      ;(dust.material as THREE.Material).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const mat = obj.material
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat.dispose()
        }
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden
      style={{ touchAction: 'none' }}
    />
  )
}
