'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Bot,
  BookOpen,
  BarChart3,
  Settings,
  Timer,
  Target,
  Wallet,
  Receipt,
  ChevronRight,
} from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────

interface ChildItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: ChildItem[]
}

const navItems: NavItem[] = [
  { label: 'Home',        href: '/',          icon: LayoutDashboard },
  { label: 'Daily Focus', href: '/focus',      icon: Target },
  {
    label: 'Finance',
    href: '/finance',
    icon: Wallet,
    children: [
      { label: 'Bills', href: '/bills', icon: Receipt },
    ],
  },
  { label: 'Projects',    href: '/projects',   icon: FolderKanban },
  { label: 'Standup',     href: '/standup',    icon: ClipboardList },
  { label: 'Agents',      href: '/agents',     icon: Bot },
  { label: 'Cron Jobs',   href: '/cronjobs',   icon: Timer },
  { label: 'Knowledge',   href: '/knowledge',  icon: BookOpen },
  { label: 'Reviews',     href: '/reviews',    icon: BarChart3 },
  { label: 'Settings',    href: '/settings',   icon: Settings },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-slate-900 text-white shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="text-lg font-bold tracking-tight">Hermes OS</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, children }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          // Expand children if we're anywhere under this parent's scope
          const isExpanded = isActive || (children?.some(c => pathname.startsWith(c.href)) ?? false)

          return (
            <div key={href}>
              {/* Parent item */}
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive && !children?.some(c => pathname.startsWith(c.href))
                    ? 'bg-slate-700 text-white'
                    : isExpanded
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {children && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </Link>

              {/* Child items — visible when parent section is active */}
              {children && isExpanded && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
                  {children.map(({ label: childLabel, href: childHref, icon: ChildIcon }) => {
                    const childActive = pathname.startsWith(childHref)
                    return (
                      <Link
                        key={childHref}
                        href={childHref}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          childActive
                            ? 'bg-slate-700 text-white font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                        {childLabel}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
