import { useEffect, useRef } from 'react'
import { ArrowUpRight, Clock3, LogOut, Menu, Plus, ShieldCheck, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLocale } from '../../shared/i18n/locale-context'
import { useDemo } from '../demo/demo-context'
import { statusOf, userName, visibleShipments } from '../../features/shipments/model'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { UserAvatar } from '../../shared/ui/UserAvatar'
import { getNavigation } from '../navigation'
import { AppearanceControls } from './AppearanceControls'
import { Brand } from './Brand'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, locale } = useLocale()
  const { state, user, now } = useDemo()
  const nav = getNavigation(user.role)
  const rows = visibleShipments(state, user)
  const counts: Record<string, number> = {
    '/shipments': rows.length,
    '/alerts': rows.filter((row) => statusOf(row, now) === 'overdue').length,
    '/deleted-shipments': state.shipments.filter((row) => row.deletedAt).length,
  }
  return (
    <>
      <Link to="/dashboard" className="sidebar-brand" onClick={onNavigate} aria-label={t.appName}>
        <Brand subtitle={t.appDescriptor} />
      </Link>
      <div className="sidebar-create" onClick={onNavigate}>
        <ButtonLink to="/shipments/new">
          <Plus size={17} aria-hidden="true" />
          {user.role === 'admin' ? t.addShipment : t.addLoad}
        </ButtonLink>
      </div>
      <nav aria-label={t.navigation}>
        {(['workspace', 'manage'] as const).map(
          (group) =>
            nav.some((item) => item.group === group) && (
              <div className="nav-group" key={group}>
                {group === 'manage' && <p className="nav-label">{t.managementReports}</p>}
                {nav
                  .filter((item) => item.group === group)
                  .map(({ path, icon: Icon, label }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end
                      onClick={onNavigate}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>{t[label]}</span>
                      {path in counts && (
                        <small
                          className={
                            path === '/alerts' && counts[path]
                              ? 'nav-count alert-nav-count'
                              : 'nav-count'
                          }
                        >
                          {new Intl.NumberFormat(locale).format(counts[path]!)}
                        </small>
                      )}
                      {path === '/daily-report' && <small className="nav-count">08:00</small>}
                    </NavLink>
                  ))}
              </div>
            ),
        )}
      </nav>
      <div className="sidebar-foot">
        <div className="sla-note">
          <Clock3 size={15} aria-hidden="true" />
          <span>{t.slaThreshold}</span>
          <strong>{t.hours96}</strong>
          <p>{t.slaHint}</p>
        </div>
        <Link to="/" onClick={onNavigate}>
          {t.switchAccount}
          <ArrowUpRight size={13} aria-hidden="true" className="direction-icon" />
        </Link>
      </div>
    </>
  )
}

export function AppShell() {
  const { t, locale } = useLocale()
  const { user, leaveDemo, storageIssue } = useDemo()
  const dialog = useRef<HTMLDialogElement>(null)
  const main = useRef<HTMLElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const admin = user.role === 'admin'
  const current = getNavigation(user.role).find((item) => item.path === location.pathname)
  const currentTitle = current
    ? t[current.label]
    : location.pathname.endsWith('/edit')
      ? t.editShipment
      : location.pathname === '/shipments/new'
        ? t.addShipment
        : location.pathname.startsWith('/shipments/')
          ? t.shipmentDetails
          : t.help
  function logout() {
    leaveDemo()
    navigate('/')
  }
  useEffect(() => {
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
    dialog.current?.close()
  }, [location.pathname, user.id])
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const close = () => {
      if (media.matches) dialog.current?.close()
    }
    media.addEventListener('change', close)
    return () => media.removeEventListener('change', close)
  }, [])
  return (
    <div className={`app-shell redesigned-shell ${admin ? 'admin-shell' : 'employee-shell'}`}>
      <a href="#main-content" className="skip-link">
        {t.skip}
      </a>
      {admin && (
        <aside className="sidebar">
          <SidebarContent />
        </aside>
      )}
      <dialog
        ref={dialog}
        id="mobile-navigation"
        className="mobile-drawer"
        aria-label={t.navigation}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
      >
        <div className="drawer-content">
          <Button
            autoFocus
            variant="ghost"
            className="drawer-close icon-button"
            aria-label={t.closeMenu}
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </Button>
          <SidebarContent onNavigate={() => dialog.current?.close()} />
        </div>
      </dialog>
      <div className="app-body">
        <header className="workspace-header">
          <div className="workspace-header-inner">
            <div className="workspace-header-start">
              <button
                type="button"
                className="workspace-menu"
                aria-label={t.openMenu}
                aria-controls="mobile-navigation"
                aria-haspopup="dialog"
                onClick={() => dialog.current?.showModal()}
              >
                <Menu size={20} />
              </button>
              {admin ? (
                <span className="workspace-page-name">{currentTitle}</span>
              ) : (
                <Link to="/dashboard" aria-label={t.appName}>
                  <Brand subtitle={t.employeePortal} />
                </Link>
              )}
            </div>
            {!admin && location.pathname !== '/shipments/new' && (
              <ButtonLink to="/shipments/new" className="button-registration header-create">
                <Plus size={16} aria-hidden="true" />
                {t.addLoad}
              </ButtonLink>
            )}
            <div className="workspace-header-actions">
              <Link
                to="/"
                className={`workspace-identity ${admin ? 'admin-identity' : ''}`}
                title={t.switchAccount}
              >
                {admin && <ShieldCheck size={14} aria-hidden="true" />}
                <UserAvatar name={userName(user, locale)} />
                <span>
                  {admin && <small>{t.administrator}</small>}
                  <strong>{userName(user, locale)}</strong>
                </span>
              </Link>
              <AppearanceControls />
              <button
                type="button"
                className="logout-button"
                onClick={logout}
                aria-label={t.logout}
                title={t.logout}
              >
                <LogOut size={16} aria-hidden="true" className="direction-icon" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </header>
        {storageIssue && (
          <div className="storage-warning" role="alert">
            {t[storageIssue]}
          </div>
        )}
        <main id="main-content" className="main-content" ref={main} tabIndex={-1}>
          <Outlet key={user.id} />
        </main>
        <footer className="app-footer">
          <span>{t.appName} · system.vsolutions.co</span>
          <span>{t.foundation}</span>
        </footer>
      </div>
    </div>
  )
}
