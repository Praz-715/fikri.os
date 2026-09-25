'use client'

/**
 * The system shell.
 *
 * Holds the boot gate, lazily mounts the 3D world, and lays the DOM
 * content over it. The scene is a dynamic import with `ssr: false`: three
 * and its dependencies are the heaviest thing here by a wide margin, and
 * nobody should download them before deciding to enter, or at all if
 * their device cannot use them.
 */

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { profile } from '@/data/profile'
import { useKeyboardNav, useScrollSections } from '@/lib/hooks'
import { useSystem } from '@/lib/system'
import { clearHovers } from '@/lib/store'
import { BootScreen } from './sections/BootScreen'
import { Contact } from './sections/Contact'
import { Journey } from './sections/Journey'
import { Knowledge } from './sections/Knowledge'
import { Profile } from './sections/Profile'
import { Projects } from './sections/Projects'
import { Research } from './sections/Research'
import { Navigation } from './ui/Navigation'
import { ProjectModal } from './ui/ProjectModal'
import { SystemStatus } from './ui/SystemStatus'

const Scene = dynamic(() => import('./3d/Scene'), { ssr: false })

export function Shell() {
  const { booted, activeSection, webgl } = useSystem()

  useScrollSections(booted)
  useKeyboardNav(booted)

  // Lock the page behind the boot screen — scrolling a page you have not
  // entered yet is the kind of small wrongness that reads as broken.
  useEffect(() => {
    document.body.dataset.booting = booted ? 'false' : 'true'
    return () => {
      delete document.body.dataset.booting
    }
  }, [booted])

  // A hover left behind in one section should not still be lit when the
  // camera has moved on to another.
  useEffect(() => {
    clearHovers()
  }, [activeSection])

  return (
    <>
      <a href="#section-profile" className="u-skip u-panel u-mono px-4 py-3">
        Skip to content
      </a>

      {/* The scene only mounts after entry: the boot screen stays instant
          and the 3D bundle is never on the critical path. */}
      {booted && webgl && <Scene />}

      {booted && (
        <>
          <Header />
          <Navigation />
          <SystemStatus />
        </>
      )}

      {/* Bottom padding clears the mobile nav bar, which is fixed over the
          content; the desktop rail is a side column and needs none. */}
      <main id="main" className="relative z-10 pb-24 lg:pb-0">
        <Profile />
        <Journey />
        <Research />
        <Knowledge />
        <Projects />
        <Contact />
      </main>

      <ProjectModal />

      {!booted && <BootScreen />}
    </>
  )
}

function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between px-6 py-5 sm:px-10">
      {/* The header floats over scrolling content with nothing behind it,
          so body text used to run straight through the wordmark on the way
          past. A short fade gives it ground to stand on without boxing it
          in. */}
      {/* Painted first, so the wordmark and the name beside it draw over
          it. A negative z-index would be the obvious way to say that, but
          it lands the scrim behind the whole header's stacking context and
          the page scrolls through it regardless. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{
          background:
            'linear-gradient(to bottom, rgb(7,8,10) 0%, rgb(7,8,10) 38%, rgba(7,8,10,0.55) 72%, rgba(7,8,10,0) 100%)',
        }}
      />
      <a
        href="#section-profile"
        className="pointer-events-auto relative"
        aria-label="FIKRI.OS — back to the start"
      >
        <span className="u-mono text-[var(--color-ink)]">
          FIKRI<span className="text-[var(--color-accent)]">.OS</span>
        </span>
      </a>

      <p className="u-label relative hidden text-right sm:block">
        {profile.name}
        <span className="mt-1 block">{profile.location}</span>
      </p>
    </header>
  )
}
