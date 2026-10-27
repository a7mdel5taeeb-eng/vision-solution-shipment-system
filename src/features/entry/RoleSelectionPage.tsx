import { ArrowRight, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../app/demo/demo-context'
import { Brand } from '../../app/layout/Brand'
import { AppearanceControls } from '../../app/layout/AppearanceControls'
import { useLocale } from '../../shared/i18n/locale-context'
import { BrandMark } from '../../shared/ui/BrandMark'
import { UserAvatar } from '../../shared/ui/UserAvatar'
import { userName, type DemoUser } from '../shipments/model'

export function RoleSelectionPage() {
  const { state, enterDemo } = useDemo()
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const users = state.users.filter((user) => user.active)
  function enter(user: DemoUser) {
    if (enterDemo(user.id)) navigate('/dashboard')
  }
  function account(user: DemoUser) {
    return (
      <button
        type="button"
        key={user.id}
        className="account-option"
        onClick={() => enter(user)}
        aria-label={`${user.role === 'admin' ? t.enterAdmin : t.enterAccount} ${userName(user, locale)}`}
      >
        <UserAvatar name={userName(user, locale)} />
        <span className="account-copy">
          <strong>{userName(user, locale)}</strong>
          <small>{user.role === 'admin' ? t.adminPortal : t.employeePortal}</small>
        </span>
        <span className="account-enter">
          {user.role === 'admin' ? t.enterAdmin : t.enterAccount}
          <ArrowRight size={15} className="direction-icon" aria-hidden="true" />
        </span>
      </button>
    )
  }
  return (
    <div className="entry-page">
      <header className="entry-header">
        <Brand />
        <AppearanceControls />
      </header>
      <main className="entry-main">
        <aside className="entry-identity" aria-label={t.appName}>
          <div className="identity-top">
            <span className="identity-mark">
              <BrandMark />
            </span>
            <span>{t.identityCaption}</span>
          </div>
          <div className="identity-copy">
            <h2>{t.identityStatement}</h2>
            <p>{t.identityDescription}</p>
          </div>
          <div className="identity-route" aria-hidden="true">
            <svg viewBox="0 0 300 180" fill="none">
              <path
                d="M12 126H80C115 126 100 45 143 45H202C232 45 215 126 255 126H290"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
              <path
                d="M12 126H80C115 126 100 45 143 45H202"
                stroke="var(--brand-primary)"
                strokeWidth="3"
              />
              <circle cx="12" cy="126" r="6" fill="var(--brand-primary)" />
              <circle cx="143" cy="45" r="5" fill="var(--brand-secondary)" />
              <circle
                cx="202"
                cy="45"
                r="9"
                fill="var(--brand-dark)"
                stroke="var(--brand-secondary)"
                strokeWidth="2"
              />
              <circle
                cx="290"
                cy="126"
                r="5"
                fill="var(--brand-dark)"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M194 45H210M202 37V53" stroke="var(--brand-secondary)" strokeWidth="1.5" />
            </svg>
            <span>
              VISION <i /> SOLUTION
            </span>
          </div>
          <p className="identity-domain">system.vsolutions.co</p>
        </aside>
        <div className="entry-workspace">
          <div className="entry-intro">
            <span className="entry-eyebrow">{t.appDescriptor}</span>
            <h1>{t.chooseAccount}</h1>
            <p>{t.chooseAccountDescription}</p>
          </div>
          <div className="entry-role-grid">
            <section
              className="role-entry-card employee-entry"
              aria-labelledby="employee-entry-title"
            >
              <div className="role-entry-heading">
                <span className="role-icon">
                  <UserRoundCheck size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="employee-entry-title">{t.employeeEntry}</h2>
                  <p>{t.employeeEntryDescription}</p>
                </div>
                <small>{t.simplePortal}</small>
              </div>
              <div className="account-options">
                {users.filter((user) => user.role === 'employee').map(account)}
              </div>
            </section>
            <section className="role-entry-card admin-entry" aria-labelledby="admin-entry-title">
              <div className="role-entry-heading">
                <span className="role-icon">
                  <ShieldCheck size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="admin-entry-title">{t.adminEntry}</h2>
                  <p>{t.adminEntryDescription}</p>
                </div>
                <small>{t.fullControl}</small>
              </div>
              <div className="account-options">
                {users.filter((user) => user.role === 'admin').map(account)}
              </div>
            </section>
          </div>
          <p className="entry-demo-note">{t.demoEntryNote}</p>
        </div>
      </main>
      <footer className="entry-footer">
        <span>{t.appName}</span>
        <span>system.vsolutions.co</span>
        <span>{t.foundation}</span>
      </footer>
    </div>
  )
}
