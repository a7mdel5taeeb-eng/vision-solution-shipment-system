export function UserAvatar({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`user-initials ${className}`} aria-hidden="true">
      {name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </span>
  )
}
