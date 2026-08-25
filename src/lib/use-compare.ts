'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  COMPARE_EVENT,
  COMPARE_KEY,
  COMPARE_MAX,
  readCompare,
  toggleCompare,
} from './compare'

/**
 * Reads the compare shortlist as React state.
 *
 * `useSyncExternalStore` rather than `useState` + an effect, because the
 * shortlist has readers in unrelated trees — a toggle on every card, the tray
 * in the layout, the picker on /compare — and they must never disagree about
 * what is selected. The store is localStorage; this is the subscription to it.
 */

const EMPTY: number[] = []

/**
 * getSnapshot must return the same reference until the value actually changes,
 * or React re-renders forever. The raw JSON string is the cheap identity check;
 * the parsed array is only rebuilt when that string moves.
 */
let cachedRaw: string | null = null
let cachedIds: number[] = EMPTY

function getSnapshot(): number[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(COMPARE_KEY)
  } catch {
    return EMPTY
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedIds = readCompare()
  }
  return cachedIds
}

/**
 * The server has no shortlist, and neither does the first client render — it
 * has to match the HTML that was sent. The tray and the toggles therefore paint
 * their empty state first and fill in on hydration, which is correct: a
 * shortlist rendered into a cached document would be someone else's.
 */
function getServerSnapshot(): number[] {
  return EMPTY
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(COMPARE_EVENT, onChange)
  // Fires only in *other* tabs, which is exactly the gap the custom event
  // above does not cover.
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(COMPARE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export interface CompareState {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => number[] | 'full'
  isFull: boolean
  max: number
}

export function useCompare(): CompareState {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const has = useCallback((id: number) => ids.includes(id), [ids])

  return {
    ids,
    has,
    toggle: toggleCompare,
    isFull: ids.length >= COMPARE_MAX,
    max: COMPARE_MAX,
  }
}
