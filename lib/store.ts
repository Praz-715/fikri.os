'use client'

/**
 * Selection bus between the 3D world and the DOM.
 *
 * Hovering a node in the canvas must light up its panel in the DOM, and
 * hovering the panel must light the node — in both directions, without
 * either side re-rendering the other's tree.
 *
 * A context would push an update through every consumer on every hover.
 * This is a 40-line external store instead: components subscribe to just
 * the slice they read, via useSyncExternalStore.
 */

import { useCallback, useSyncExternalStore } from 'react'

export interface SelectionState {
  /** Milestone id currently hovered, from either surface. */
  journeyHover: string | null
  /** Milestone id the camera has been sent to. */
  journeyFocus: string | null
  /** Knowledge node or cluster id hovered. */
  skillHover: string | null
  /** Knowledge node or cluster id selected — highlights its neighbours. */
  skillSelected: string | null
  /** Project id hovered; activates that project's 3D world. */
  projectHover: string | null
  /** Project id open in the detail dialog. */
  projectOpen: string | null
}

const initial: SelectionState = {
  journeyHover: null,
  journeyFocus: null,
  skillHover: null,
  skillSelected: null,
  projectHover: null,
  projectOpen: null,
}

let state: SelectionState = initial
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function setSelection(patch: Partial<SelectionState>) {
  let changed = false
  for (const key of Object.keys(patch) as Array<keyof SelectionState>) {
    if (state[key] !== patch[key]) {
      changed = true
      break
    }
  }
  if (!changed) return
  state = { ...state, ...patch }
  emit()
}

export function getSelection() {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Subscribe to one field. Returns the same value identity between
 * unrelated updates, so a project hover never re-renders the timeline.
 */
export function useSelection<K extends keyof SelectionState>(key: K): SelectionState[K] {
  const get = useCallback(() => state[key], [key])
  return useSyncExternalStore(subscribe, get, get)
}

/** Reads the whole object. Use sparingly — it re-renders on any change. */
export function useSelectionAll(): SelectionState {
  return useSyncExternalStore(subscribe, getSelection, getSelection)
}

/** Clears transient hovers — called when a section loses the viewport. */
export function clearHovers() {
  setSelection({ journeyHover: null, skillHover: null, projectHover: null })
}
