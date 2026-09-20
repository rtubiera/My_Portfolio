import type { ReactNode } from 'react'
import { useReveal } from '../lib/hooks'

type Props = {
  id: string
  index: string
  title: string
  children: ReactNode
}

export default function Section({ id, index, title, children }: Props) {
  const ref = useReveal<HTMLElement>()

  return (
    <section id={id} ref={ref} className="section reveal">
      <div className="shell">
        <div className="section__head">
          <span className="section__index">{index}</span>
          <h2 className="section__title">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  )
}
