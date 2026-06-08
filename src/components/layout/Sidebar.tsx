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
} from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Daily Focus', href: '/focus', icon: Target },
  { label: 'Finance', href: '/finance', icon: Wallet },
  { label: 'Bills', href: '/bills', icon: Receipt },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Standup', href: '/standup', icon: ClipboardList },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Cron Jobs', href: '/cronjobs', icon: Timer },
  { label: 'Knowledge', href: '/knowledge', icon: BookOpen },
  { label: 'Reviews', href: '/reviews', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-slate-900 text-white shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="text-lg font-bold tracking-tight">Hermes OS</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
