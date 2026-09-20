import { TechIcon } from '../lib/techIcons'
import type { SkillGroup } from '../lib/types'

/**
 * The two icon-led skill layouts live here, apart from SkillsSection, because
 * they pull in the brand-logo paths — around 68 kB that visitors on the
 * default "grouped" layout should never have to download. SkillsSection
 * lazy-loads this module only when one of these is selected.
 */

/* -- icons: one flat logo wall, groups flattened --------------------------- */

export function SkillIcons({ groups }: { groups: SkillGroup[] }) {
  // A logo wall reads as one field, so the group boundaries are dropped.
  // De-duplicated because a skill can legitimately sit in two groups.
  const seen = new Set<string>()
  const items: string[] = []
  for (const group of groups) {
    for (const item of group.items) {
      const key = item.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  }

  return (
    <ul className="skill-wall">
      {items.map((item) => (
        <li className="skill-chip" key={item} title={item}>
          <TechIcon name={item} size={34} />
          <span className="skill-chip__name">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* -- tiles: bordered cards, still grouped ---------------------------------- */

export function SkillTiles({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="skill-tiles">
      {groups.map((group) => (
        <section className="skill-tiles__group" key={group.id}>
          <h3 className="skill-group__label">{group.label}</h3>
          <ul className="skill-tiles__grid">
            {group.items.map((item) => (
              <li className="skill-tile" key={item}>
                <TechIcon name={item} size={26} />
                <span className="skill-tile__name">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function SkillsWithIcons({
  groups,
  variant,
}: {
  groups: SkillGroup[]
  variant: 'icons' | 'tiles'
}) {
  return variant === 'icons' ? (
    <SkillIcons groups={groups} />
  ) : (
    <SkillTiles groups={groups} />
  )
}
