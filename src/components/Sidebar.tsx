import * as React from "react"
import {
  DashboardCircleIcon,
  Key01Icon,
  ChartCandleIcon,
  ListViewIcon,
  Wallet01Icon,
  Exchange01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: DashboardCircleIcon },
  { label: "Accounts", href: "/accounts", icon: Key01Icon },
  { label: "Positions", href: "/positions", icon: ChartCandleIcon },
  { label: "Orders", href: "/orders", icon: ListViewIcon },
  { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
]

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="flex h-svh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
          <HugeiconsIcon
            icon={Exchange01Icon}
            className="size-4 text-primary-foreground"
            strokeWidth={2}
          />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Delta FM
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Navigation
        </p>
        {navItems.map(({ label, href, icon }) => {
          const isActive =
            href === "/" ? currentPath === "/" : currentPath.startsWith(href)
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <HugeiconsIcon
                icon={icon}
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <p className="text-center text-[10px] text-muted-foreground/40">
          Delta Exchange Fund Manager
        </p>
      </div>
    </aside>
  )
}
