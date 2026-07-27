import { Suspense, lazy } from 'react'
import { resolveSkillsLayout } from '../lib/theme'
import type { SkillGroup } from '../lib/types'

// Brand logos are ~68 kB. Only fetch them if an icon layout is actually chosen.
const SkillsWithIcons = lazy(() => import('./SkillsWithIcons'))

type Props = {
  groups: SkillGroup[]
  layout?: string
}

export default function SkillsSection({ groups, layout }: Props) {
  const mode = resolveSkillsLayout(layout)

  if (!groups.length) {
    return <p className="empty">No skills added yet.</p>
  }

  if (mode === 'icons' || mode === 'tiles') {
    return (
      <Suspense fallback={<SkillGroups groups={groups} />}>
        <SkillsWithIcons groups={groups} variant={mode} />
      </Suspense>
    )
  }

  return <SkillGroups groups={groups} />
}

/* -- grouped: label on the left, tags on the right ------------------------- */

function SkillGroups({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="skills">
      {groups.map((group) => (
        <div className="skill-group" key={group.id}>
          <h3 className="skill-group__label">{group.label}</h3>
          <ul className="tag-row">
            {group.items.map((item) => (
              <li key={item} className="tag">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
