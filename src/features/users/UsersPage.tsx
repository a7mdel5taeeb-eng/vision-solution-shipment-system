import { useState, type FormEvent } from 'react'
import { Pencil, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { useDemo } from '../../app/demo/demo-context'
import { useLocale } from '../../shared/i18n/locale-context'
import { Badge, Button, PageHeading } from '../../shared/ui/Primitives'
import { Modal } from '../../shared/ui/Modal'
import { userName, type DemoUser, type Role } from '../shipments/model'

function UserEditor({ initial, onClose }: { initial?: DemoUser; onClose: () => void }) {
  const { t } = useLocale()
  const { user, execute } = useDemo()
  const [draft, setDraft] = useState<DemoUser>(() =>
    initial
      ? { ...initial }
      : {
          id: crypto.randomUUID(),
          name: '',
          nameAr: '',
          email: '',
          role: 'employee',
          active: true,
        },
  )
  function submit(event: FormEvent) {
    event.preventDefault()
    if (execute({ type: 'saveUser', user: draft }, 'userSaved')) onClose()
  }
  return (
    <Modal title={initial ? t.editUser : t.addUser} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="user-form-fields">
          <label className="form-field">
            <span>
              {t.fullName} <em>*</em>
            </span>
            <input
              autoFocus
              value={draft.name}
              maxLength={100}
              required
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>{t.arabicName}</span>
            <input
              value={draft.nameAr}
              maxLength={100}
              onChange={(event) => setDraft({ ...draft, nameAr: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>
              {t.email} <em>*</em>
            </span>
            <input
              type="email"
              dir="ltr"
              value={draft.email}
              required
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>{t.role}</span>
            <select
              value={draft.role}
              disabled={draft.id === user.id}
              onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}
            >
              <option value="employee">{t.employee}</option>
              <option value="admin">{t.administrator}</option>
            </select>
          </label>
        </div>
        <p className="field-help">{t.userRoleHelp}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit">{t.saveUser}</Button>
        </div>
      </form>
    </Modal>
  )
}
export function UsersPage() {
  const { t, locale } = useLocale()
  const { state, user, execute } = useDemo()
  const [editor, setEditor] = useState<DemoUser | 'new' | null>(null)
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow={t.manageLabel}
        title={t.userManagement}
        description={t.usersIntro}
        action={
          <Button onClick={() => setEditor('new')}>
            <Plus size={17} aria-hidden="true" />
            {t.addUser}
          </Button>
        }
      />
      <p className="scope-note">{t.userManagementHelp}</p>
      <div className="users-grid">
        {state.users.map((item) => (
          <article className="panel user-card" key={item.id}>
            <div className="user-card-top">
              <span className={`user-avatar ${item.role === 'admin' ? 'admin-avatar' : ''}`}>
                {item.role === 'admin' ? (
                  <ShieldCheck size={23} aria-hidden="true" />
                ) : (
                  <UserRound size={23} aria-hidden="true" />
                )}
              </span>
              <Badge tone={item.active ? 'cyan' : 'neutral'}>
                {item.active ? t.active : t.inactive}
              </Badge>
            </div>
            <h2>{userName(item, locale)}</h2>
            <p className="user-email">
              <bdi>{item.email}</bdi>
            </p>
            <p className="user-role">{item.role === 'admin' ? t.administrator : t.employee}</p>
            <div className="user-card-actions">
              <Button
                variant="secondary"
                onClick={() => setEditor(item)}
                aria-label={`${t.editUser} ${userName(item, locale)}`}
              >
                <Pencil size={14} aria-hidden="true" />
                {t.edit}
              </Button>
              <Button
                variant="ghost"
                disabled={item.id === user.id}
                onClick={() =>
                  execute(
                    { type: 'saveUser', user: { ...item, active: !item.active } },
                    'userSaved',
                  )
                }
              >
                {item.active ? t.deactivate : t.activate}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="scope-note">{t.userRoleHelp}</p>
      {editor && (
        <UserEditor
          initial={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}
