'use client';
/**
 * Ideas → sphere moons. Reads the owner's recommendations through RLS with the signed-in session.
 * Visitors who are not signed in receive nothing (RLS returns an empty set), so the public view
 * never reveals private ideas.
 */
import { useSyncExternalStore } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { supabaseConfigured } from '@/lib/supabase/env';
import { moonState, type MoonState, type RecStatus } from '@/lib/engine/core';

export interface Idea {
  id: string;
  title: string;
  status: RecStatus;
  sphere_id: string | null;
  demo: boolean;
  state: MoonState;
}
interface IdeasState {
  loaded: boolean;
  signedIn: boolean;
  bySphere: Record<string, Idea[]>;
}

let state: IdeasState = { loaded: false, signedIn: false, bySphere: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let started = false;

async function load() {
  if (!supabaseConfigured()) {
    state = { ...state, loaded: true };
    return emit();
  }
  try {
    const sb = supabaseBrowser();
    const { data: session } = await sb.auth.getSession();
    if (!session.session) {
      state = { loaded: true, signedIn: false, bySphere: {} };
      return emit();
    }
    const { data } = await sb.from('recommendations').select('id,title,status,sphere_id,demo').not('sphere_id', 'is', null).limit(500);
    const bySphere: Record<string, Idea[]> = {};
    for (const r of (data ?? []) as Omit<Idea, 'state'>[]) {
      const idea: Idea = { ...r, state: moonState(r.status) };
      if (idea.state === 'retired' || !r.sphere_id) continue;
      (bySphere[r.sphere_id] ??= []).push(idea);
    }
    state = { loaded: true, signedIn: true, bySphere };
  } catch {
    state = { ...state, loaded: true };
  }
  emit();
}

export function useIdeas() {
  if (typeof window !== 'undefined' && !started) {
    started = true;
    void load();
  }
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
export const getIdeas = () => state;
