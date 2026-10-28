import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { LogOut, Package, Trash2, Menu, X } from 'lucide-react'
import { useAuth } from '../../app/auth/auth-context'
import type { ActiveAccount } from '../../app/auth/account'
import { Brand } from '../../app/layout/Brand'
import { AppearanceControls } from '../../app/layout/AppearanceControls'
import { useLocale } from '../../shared/i18n/locale-context'
import { connectedMessages } from '../../shared/i18n/connected-messages'
import { Button } from '../../shared/ui/Primitives'
import { connectedShipmentRepository } from './repository'
import { ConnectedList } from './ConnectedList'
import { ConnectedDetail } from './ConnectedDetail'
import '../../styles/connected.css'

export function ConnectedWorkspace({ account }: { account: ActiveAccount }) {
  const { client, store, state } = useAuth()
  const repository = useMemo(() => connectedShipmentRepository(client), [client])
  const { t, locale } = useLocale(),
    m = connectedMessages[locale]
  const { id } = useParams(),
    location = useLocation()
  const drawer = useRef<HTMLDialogElement>(null),
    main = useRef<HTMLElement>(null)
  const admin = account.role === 'admin'
  useEffect(() => {
    drawer.current?.close()
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  const navigation = (
    <>
      <Link to="/workspace" className="sidebar-brand">
        <Brand subtitle={t.appDescriptor} />
      </Link>
      <nav aria-label={t.navigation}>
        <div className="nav-group">
          <Link
            className={`nav-link ${!location.search.includes('scope=deleted') ? 'active' : ''}`}
            to="/workspace"
            aria-current={!location.search.includes('scope=deleted') ? 'page' : undefined}
            onClick={() => drawer.current?.close()}
          >
            <Package size={17} aria-hidden="true" />
            {t.allShipments}
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
      <p className="sidebar-foot">{m.readOnly}</p>
    </>
  )
  // Signing out unmounts all read resources immediately, before the remote request resolves.
  if (state.operation === 'signout') return <p role="status">{t.accountChecking}</p>
  return (
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
                <Brand subtitle={m.readOnly} />
              </Link>
            </div>
            <div className="workspace-header-actions">
              <span className="workspace-identity">
                <strong>{locale === 'ar' ? account.name_ar || account.name : account.name}</strong>
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
          {id ? (
            <ConnectedDetail key={id} id={id} repository={repository} />
          ) : (
            <ConnectedList repository={repository} admin={admin} />
          )}
        </main>
        <footer className="app-footer">
          <span>{t.appName}</span>
          <span>{m.readOnly}</span>
        </footer>
      </div>
    </div>
  )
}
