import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props} />
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}) {
  return (
    <Link to={to} className={`button button-${variant} ${className}`}>
      {children}
    </Link>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'cyan'
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  )
}
