import Section from '../components/Section'
import { useDocumentMeta } from '../lib/hooks'
import type { PortfolioContent } from '../lib/types'
import AboutSection from './AboutSection'
import CertificationsSection from './CertificationsSection'
import ContactSection from './ContactSection'
import ExperienceList from './ExperienceList'
import Hero from './Hero'
import SkillsSection from './SkillsSection'
import WorkList from './WorkList'

export default function Home({ content }: { content: PortfolioContent }) {
  const { settings, projects, experiences, skills, certifications } = content

  useDocumentMeta(
    settings.seo_title || `${settings.name} — ${settings.role}`,
    settings.seo_description || settings.hero_intro,
  )

  return (
    <main id="main">
      <Hero settings={settings} />

      <Section id="work" index="01" title="Selected work">
        <WorkList projects={projects} layout={settings.work_layout} />
      </Section>

      <Section id="experience" index="02" title="Experience">
        <ExperienceList
          items={experiences}
          layout={settings.experience_layout}
        />
      </Section>

      <Section id="about" index="03" title="About">
        <AboutSection settings={settings} />
      </Section>

      <Section id="skills" index="04" title="Skills">
        <SkillsSection groups={skills} layout={settings.skills_layout} />
      </Section>

      {certifications.length > 0 && (
        <Section id="certifications" index="05" title="Certifications & awards">
          <CertificationsSection
            items={certifications}
            layout={settings.certs_layout}
          />
        </Section>
      )}

      <Section id="contact" index="06" title="Contact">
        <ContactSection settings={settings} />
      </Section>
    </main>
  )
}
