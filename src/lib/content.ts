import { supabase } from './supabase'
import { seedContent } from './seed'
import type {
  Certification,
  CustomPalette,
  Experience,
  PortfolioContent,
  Project,
  SiteSettings,
  SkillGroup,
} from './types'

/**
 * Loads everything the public site needs in one round trip's worth of parallel
 * queries. Any individual failure degrades to the seed slice for that section
 * rather than blanking the page.
 */
export async function fetchPortfolio(): Promise<{
  content: PortfolioContent
  live: boolean
  error: string | null
}> {
  if (!supabase) {
    return { content: seedContent, live: false, error: null }
  }

  try {
    const [settings, projects, experiences, skills, certifications, palettes] =
      await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        supabase
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('experiences')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('skill_groups')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('certifications')
          .select('*')
          .order('sort_order', { ascending: true }),
        // Missing until migration 004 runs, so its error is deliberately not
        // treated as a content failure — the site just uses a built-in preset.
        supabase
          .from('theme_palettes')
          .select('*')
          .order('sort_order', { ascending: true }),
      ])

    const firstError =
      settings.error ??
      projects.error ??
      experiences.error ??
      skills.error ??
      certifications.error

    // A hard failure (bad keys, schema not run, RLS misconfigured) — show seed
    // content so a visitor never lands on an empty page, but surface why.
    if (firstError && !settings.data && !projects.data?.length) {
      return { content: seedContent, live: false, error: firstError.message }
    }

    return {
      content: {
        settings: (settings.data as SiteSettings | null) ?? seedContent.settings,
        projects: (projects.data as Project[] | null) ?? seedContent.projects,
        experiences:
          (experiences.data as Experience[] | null) ?? seedContent.experiences,
        skills: (skills.data as SkillGroup[] | null) ?? seedContent.skills,
        certifications:
          (certifications.data as Certification[] | null) ??
          seedContent.certifications,
        palettes: (palettes.data as CustomPalette[] | null) ?? [],
      },
      live: true,
      error: firstError?.message ?? null,
    }
  } catch (err) {
    return {
      content: seedContent,
      live: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/** Admin variant: includes unpublished rows so drafts are editable. */
export async function fetchPortfolioForAdmin(): Promise<PortfolioContent> {
  if (!supabase) return seedContent

  const [settings, projects, experiences, skills, certifications, palettes] =
    await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('projects').select('*').order('sort_order'),
      supabase.from('experiences').select('*').order('sort_order'),
      supabase.from('skill_groups').select('*').order('sort_order'),
      supabase.from('certifications').select('*').order('sort_order'),
      supabase.from('theme_palettes').select('*').order('sort_order'),
    ])

  return {
    settings: (settings.data as SiteSettings | null) ?? seedContent.settings,
    projects: (projects.data as Project[] | null) ?? [],
    experiences: (experiences.data as Experience[] | null) ?? [],
    skills: (skills.data as SkillGroup[] | null) ?? [],
    certifications: (certifications.data as Certification[] | null) ?? [],
    palettes: (palettes.data as CustomPalette[] | null) ?? [],
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Splits a textarea value into a clean string[] (one item per line). */
export function linesToArray(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Splits a comma-separated field into a clean string[]. */
export function commasToArray(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
