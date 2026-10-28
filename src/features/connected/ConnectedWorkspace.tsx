import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { LogOut, Package, Trash2, Menu, X, BarChart3, Mail } from 'lucide-react'
import { useAuth } from '../../app/auth/auth-context'
import type { ActiveAccount } from '../../app/auth/account'
import { Brand } from '../../app/layout/Brand'
import { AppearanceControls } from '../../app/layout/AppearanceControls'
import { useLocale } from '../../shared/i18n/locale-context'
import { connectedMessages } from '../../shared/i18n/connected-messages'
import { Button, ButtonLink } from '../../shared/ui/Primitives'
import { connectedShipmentRepository } from './repository'
import { ConnectedList } from './ConnectedList'
import { ConnectedDetail } from './ConnectedDetail'
import { ConnectedFormPage } from './ConnectedForm'
import { connectedCommandRepository } from './command-repository'
import { CommandSession } from './command-session'
import { CommandContext } from './command-context'
import { CommandFeedback } from './CommandFeedback'
import { ConnectedReports } from './ConnectedReports'
import { connectedReportRepository } from './report-repository'
import { reportMessages } from '../../shared/i18n/report-messages'
import '../../styles/connected.css'

export function ConnectedWorkspace({ account }: { account: ActiveAccount }) {
  const { client, store, state } = useAuth()
  const repository = useMemo(() => connectedShipmentRepository(client), [client])
  const reports = useMemo(() => connectedReportRepository(client), [client])
  const [commands] = useState(
    () =>
      new CommandSession(
        account.user_id,
        connectedCommandRepository(client),
        repository,
        window.sessionStorage,
      ),
  )
  const commandState = useSyncExternalStore(commands.subscribe, commands.getSnapshot)
  useEffect(() => () => commands.dispose(), [commands])
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const { id } = useParams(),
    location = useLocation()
  const drawer = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null)
  const admin = account.role === 'admin'
  const form = location.pathname === '/shipments/new' || location.pathname.endsWith('/edit')
  const report = location.pathname === '/reports' || location.pathname === '/daily-report'
  const rm = reportMessages[locale]
  useEffect(() => {
    if (commands.getSnapshot().status === 'error') commands.dismiss()
    drawer.current?.close()
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [location.pathname, commands])
  const navigation = (
    <>
      <Link to="/workspace" className="sidebar-brand">
        <Brand subtitle={t.appDescriptor} />
      </Link>
      <nav aria-label={t.navigation}>
        <div className="sidebar-create" onClick={() => drawer.current?.close()}>
          <ButtonLink to="/shipments/new">{t.addShipment}</ButtonLink>
        </div>
        <div className="nav-group">
          <Link
            className={`nav-link ${!report && !location.search.includes('scope=deleted') ? 'active' : ''}`}
            to="/workspace"
            aria-current={
              !report && !location.search.includes('scope=deleted') ? 'page' : undefined
            }
            onClick={() => drawer.current?.close()}
          >
            <Package size={17} aria-hidden="true" />
            {t.allShipments}
          </Link>
          <Link
            className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
            aria-current={location.pathname === '/reports' ? 'page' : undefined}
            to="/reports"
            onClick={() => drawer.current?.close()}
          >
            <BarChart3 size={17} aria-hidden="true" />
            {rm.reports}
          </Link>
          <Link
            className={`nav-link ${location.pathname === '/daily-report' ? 'active' : ''}`}
            aria-current={location.pathname === '/daily-report' ? 'page' : undefined}
            to="/daily-report"
            onClick={() => drawer.current?.close()}
          >
            <Mail size={17} aria-hidden="true" />
            {rm.daily}
          </Link>
          <Link
            className={`nav-link ${location.search.includes('scope=deleted') ? 'active' : ''}`}
            to="/workspace?scope=deleted"
            aria-current={location.search.includes('scope=deleted') ? 'page' : undefined}
            onClick={() => drawer.current?.close()}
          >
            <Trash2 size={17} aria-hidden="true" />
            {t.deletedRecords}
          </Link>
        </div>
      </nav>
      <p className="sidebar-foot">{m.mode}</p>
    </>
  )
  // Signing out unmounts all read resources immediately, before the remote request resolves.
  if (state.operation === 'signout') return <p role="status">{t.accountChecking}</p>
  return (
    <CommandContext.Provider value={{ session: commands, state: commandState }}>
      <div
        className={`app-shell redesigned-shell connected-workspace ${admin ? 'admin-shell' : 'employee-shell'}`}
      >
        <a href="#connected-main" className="skip-link">
          {t.skip}
        </a>
        {admin && <aside className="sidebar">{navigation}</aside>}
        {admin && (
          <dialog
            ref={drawer}
            className="mobile-drawer"
            aria-label={t.navigation}
            onClick={(e) => {
              if (e.target === e.currentTarget) drawer.current?.close()
            }}
          >
            <div className="drawer-content">
              <Button
                autoFocus
                variant="ghost"
                className="drawer-close icon-button"
                aria-label={t.closeMenu}
                onClick={() => drawer.current?.close()}
              >
                <X size={20} />
              </Button>
              {navigation}
            </div>
          </dialog>
        )}
        <div className="app-body">
          <header className="workspace-header">
            <div className="workspace-header-inner">
              <div className="workspace-header-start">
                {admin && (
                  <Button
                    variant="ghost"
                    className="workspace-menu"
                    aria-label={t.openMenu}
                    aria-haspopup="dialog"
                    onClick={() => drawer.current?.showModal()}
                  >
                    <Menu size={20} />
                  </Button>
                )}
                <Link to="/workspace">
                  <Brand subtitle={m.mode} />
                </Link>
              </div>
              {!admin && !form && (
                <ButtonLink to="/shipments/new" className="header-create">
                  {t.addLoad}
                </ButtonLink>
              )}
              <div className="workspace-header-actions">
                <span className="workspace-identity">
                  <strong>
                    {locale === 'ar' ? account.name_ar || account.name : account.name}
                  </strong>
                </span>
                <AppearanceControls />
                <Button
                  variant="ghost"
                  className="logout-button"
                  aria-label={t.logout}
                  title={t.logout}
                  onClick={() => void store.signOut()}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>{t.logout}</span>
                </Button>
              </div>
            </div>
          </header>
          <main id="connected-main" className="main-content" ref={main} tabIndex={-1}>
            <p className="connected-notice">{m.scope}</p>
            {!admin && !form && (
              <nav className="auth-actions" aria-label={t.navigation}>
                <Link
                  className="text-link"
                  to="/workspace"
                  aria-current={!report ? 'page' : undefined}
                >
                  {t.myShipments}
                </Link>
                <Link
                  className="text-link"
                  to="/reports"
                  aria-current={report ? 'page' : undefined}
                >
                  {rm.reports}
                </Link>
              </nav>
            )}
            <CommandFeedback />
            {report ? (
              <ConnectedReports
                key={location.pathname}
                repository={reports}
                admin={admin}
                daily={location.pathname === '/daily-report'}
              />
            ) : form ? (
              <ConnectedFormPage key={id ?? 'new'} id={id} repository={repository} />
            ) : id ? (
              <ConnectedDetail key={id} id={id} repository={repository} admin={admin} />
            ) : (
              <ConnectedList repository={repository} admin={admin} />
            )}
          </main>
          <footer className="app-footer">
            <span>{t.appName}</span>
            <span>{m.mode}</span>
          </footer>
        </div>
      </div>
    </CommandContext.Provider>
  )
}
