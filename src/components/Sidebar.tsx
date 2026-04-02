import * as React from "react"
import {
  DashboardCircleIcon,
  Key01Icon,
  ChartCandleIcon,
  ListViewIcon,
  Wallet01Icon,
  Exchange01Icon,
  Moon01Icon,
  Sun01Icon,
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

type Currency = "USD" | "INR"

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`
}

interface SidebarProps {
  initialDark: boolean
  initialCurrency: Currency
}

export function Sidebar({ initialDark, initialCurrency }: SidebarProps) {
  const [isDark, setIsDark] = React.useState(initialDark)
  const [currency, setCurrency] = React.useState<Currency>(initialCurrency)
  const [currentPath, setCurrentPath] = React.useState(
    () => (typeof window !== "undefined" ? window.location.pathname : "/")
  )

  React.useEffect(() => {
    const onPageLoad = () => setCurrentPath(window.location.pathname)
    document.addEventListener("astro:page-load", onPageLoad)
    return () => document.removeEventListener("astro:page-load", onPageLoad)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    const value = next ? "dark" : "light"
    setCookie("fm-theme", value)
    document.documentElement.classList.toggle("dark", next)
  }

  function switchCurrency(c: Currency) {
    setCurrency(c)
    setCookie("fm-currency", c)
    window.dispatchEvent(new CustomEvent<Currency>("fm-currency-change", { detail: c }))
  }

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

      {/* Controls */}
      <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
        <div className="flex flex-col gap-1.5">
          <p className="px-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Currency
          </p>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {(["USD", "INR"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => switchCurrency(c)}
                className={cn(
                  "flex-1 rounded-md py-1 text-xs font-semibold transition-all",
                  currency === c
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c === "USD" ? "$ USD" : "₹ INR"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <HugeiconsIcon
            icon={isDark ? Sun01Icon : Moon01Icon}
            className="size-4"
            strokeWidth={1.5}
          />
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  )
}
