import type {
  AboutLayout,
  BackgroundEffect,
  CertsLayout,
  ContactLayout,
  CustomPalette,
  EffectIntensity,
  ExperienceLayout,
  FontPairId,
  HeroLayout,
  PresetId,
  SkillsLayout,
  WorkLayout,
} from './theme'

import type { EffectSchedule, RotationMode } from './schedule'

export type { CustomPalette, EffectSchedule, RotationMode }

export type SocialLink = { label: string; url: string }
export type Metric = { value: string; label: string }

export type SiteSettings = {
  id: number
  name: string
  role: string
  tagline: string
  hero_intro: string
  about: string
  location: string
  email: string
  phone: string
  available: boolean
  available_note: string
  avatar_url: string | null
  resume_url: string | null
  socials: SocialLink[]
  metrics: Metric[]
  seo_title: string
  seo_description: string
  og_image_url: string | null

  // Appearance — set from the CMS "Theme" tab.
  logo_url: string | null
  favicon_url: string | null
  logo_text: string
  hero_layout: HeroLayout
  hero_image_url: string | null
  theme_preset: PresetId
  accent_color: string
  font_pair: FontPairId
  work_layout: WorkLayout
  skills_layout: SkillsLayout
  experience_layout: ExperienceLayout
  about_layout: AboutLayout
  certs_layout: CertsLayout
  contact_layout: ContactLayout
  background_effect: BackgroundEffect
  effect_intensity: EffectIntensity
  effect_rotation: RotationMode
  rotation_pool: string[]
}

export type Project = {
  id: string
  slug: string
  title: string
  blurb: string
  description: string
  role: string
  year: string
  tech: string[]
  highlights: string[]
  repo_url: string | null
  live_url: string | null
  cover_url: string | null
  featured: boolean
  published: boolean
  sort_order: number
}

export type Experience = {
  id: string
  company: string
  client: string
  role: string
  period: string
  location: string
  summary: string
  bullets: string[]
  tech: string[]
  published: boolean
  sort_order: number
}

export type SkillGroup = {
  id: string
  label: string
  items: string[]
  sort_order: number
}

export type Certification = {
  id: string
  title: string
  issuer: string
  date_label: string
  url: string | null
  sort_order: number
}

export type Message = {
  id: string
  name: string
  email: string
  subject: string
  body: string
  read: boolean
  created_at: string
}

export type PortfolioContent = {
  settings: SiteSettings
  projects: Project[]
  experiences: Experience[]
  skills: SkillGroup[]
  certifications: Certification[]
  palettes: CustomPalette[]
  schedules: EffectSchedule[]
}

/** Which table a given editor writes to. */
export type ContentTable =
  | 'site_settings'
  | 'projects'
  | 'experiences'
  | 'skill_groups'
  | 'certifications'
  | 'theme_palettes'
  | 'effect_schedules'
