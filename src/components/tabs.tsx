'use client'

import { useId, useState } from 'react'

export interface TabDefinition {
  key: string
  label: string
  /** Server-rendered content, passed through as an element. */
  panel: React.ReactNode
  /** Shown beside the label — a result count, usually. */
  badge?: string | number
}

/**
 * The tabbed rail the portals build their home pages out of.
 *
 * Every panel is rendered into the document and the inactive ones are hidden
 * with the `hidden` attribute rather than removed. That costs a little markup
 * and buys two things: switching tabs is instant with no request, and a crawler
 * reading the page finds every link in every tab instead of only the one that
 * happened to be open. On a page whose job is to funnel search traffic into
 * model pages, that second point is most of why the module exists.
 *
 * The panels themselves are server components. This file only owns which one is
 * visible, so no catalog data and no formatting logic ships to the browser.
 */
export function Tabs({
  tabs,
  ariaLabel,
}: {
  tabs: TabDefinition[]
  ariaLabel: string
}) {
  const [active, setActive] = useState(tabs[0]?.key)
  const base = useId()

  if (tabs.length === 0) return null

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="seg mb-6 max-w-full overflow-x-auto"
      >
        {tabs.map((tab) => {
          const selected = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.key}`}
              data-active={selected}
              onClick={() => setActive(tab.key)}
              className="seg-item"
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="tnum ml-1.5 text-xs opacity-60">{tab.badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${base}-panel-${tab.key}`}
          aria-labelledby={`${base}-tab-${tab.key}`}
          hidden={tab.key !== active}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  )
}
