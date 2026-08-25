'use client'

import { useEffect, useState } from 'react'

export interface SubnavSection {
  id: string
  label: string
}

/**
 * The in-page nav on a model page.
 *
 * A vehicle page that carries price, key specs, two calculators, a full spec
 * table, rivals and an FAQ is long — long enough that without this you scroll
 * past what you came for. The portals all run one, and it does two jobs: it
 * gets you to a section, and it tells you the section exists at all.
 *
 * IntersectionObserver rather than a scroll listener: it reports which section
 * is on screen without running JavaScript on every scroll frame. The rootMargin
 * discounts the area under the sticky header, so a heading counts as "current"
 * when it reaches the top of the readable area rather than the top of the
 * window.
 *
 * Sections that never render — a vehicle with no offers, say — are filtered out
 * by the caller, so this never links to an anchor that is not there.
 */
export function StickySubnav({ sections }: { sections: SubnavSection[] }) {
  const [current, setCurrent] = useState(sections[0]?.id)

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null)

    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setCurrent(visible[0].target.id)
      },
      // Top offset clears the two-tier header plus this bar; the bottom keeps a
      // section from staying "current" while it is only just leaving.
      { rootMargin: '-160px 0px -65% 0px', threshold: 0 },
    )

    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 2) return null

  return (
    <div className="under-header sticky z-30 -mx-4 border-b border-hairline bg-surface/95 backdrop-blur sm:-mx-6 lg:mx-0">
      <nav
        aria-label="On this page"
        className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-0"
      >
        {sections.map((section) => {
          const active = section.id === current
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? 'true' : undefined}
              className={`relative whitespace-nowrap rounded-chip px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-ink'
                  : 'text-ink-subtle hover:bg-surface-alt hover:text-ink'
              }`}
            >
              {section.label}
              {active && (
                <span className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-signal" />
              )}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
