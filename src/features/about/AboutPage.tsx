import { ArrowUpRight, Blocks, Flag, Laptop } from 'lucide-react'
import { useLocale } from '../../shared/i18n/locale-context'
import { Badge, PageHeading } from '../../shared/ui/Primitives'

export function AboutPage() {
  const { t } = useLocale()
  return (
    <div className="page-stack">
      <PageHeading eyebrow={t.phase} title={t.help} description={t.appDescriptor} />
      <section className="panel about-panel">
        <Badge tone="cyan">{t.foundationShort}</Badge>
        <h2>{t.aboutTitle}</h2>
        <p className="about-intro">{t.aboutDescription}</p>
        <div className="about-sections">
          {[
            { icon: Blocks, title: t.currentScope, description: t.scopeDescription },
            { icon: Flag, title: t.nextScope, description: t.nextDescription },
            { icon: Laptop, title: t.environment, description: t.environmentDescription },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <Icon size={22} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          className="text-link"
          href="https://www.vsolutions.co/"
          target="_blank"
          rel="noreferrer"
          dir="ltr"
        >
          vsolutions.co
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>
    </div>
  )
}
