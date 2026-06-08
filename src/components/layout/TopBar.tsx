'use client'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/focus': 'Daily Focus',
  '/projects': 'Projects',
  '/standup': 'Standup',
  '/agents': 'Agents',
  '/cronjobs': 'Cron Jobs',
  '/knowledge': 'Knowledge',
  '/reviews': 'Reviews',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (key === '/' ? pathname === '/' : pathname.startsWith(key)) return label
  }
  return 'Hermes OS'
}

export function TopBar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const title = getPageTitle(pathname)

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-background shrink-0">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
