import * as React from "react"
import {
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  EyeIcon,
  ViewOffIcon,
  AlertCircleIcon,
  Loading02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { RiskConfig } from "@/lib/risk"
import { DEFAULT_RISK_CONFIG, TRADE_CATEGORIES } from "@/lib/risk"

// ── Types ──────────────────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  apiKey: string
  riskConfig: RiskConfig
  createdAt: string
}

interface WalletBalance {
  asset_id: number
  asset_symbol: string
  available_balance: string
  available_balance_inr: string
  balance: string
  balance_inr: string
  blocked_margin: string
}

interface WalletMeta {
  net_equity: string
}

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; balances: WalletBalance[]; meta: WalletMeta }
  | { status: "error"; message: string }

type Currency = "USD" | "INR"

// ── Helpers ────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••"
  return key.slice(0, 4) + "••••••••" + key.slice(-4)
}

function fmt(value: string, currency: Currency): string {
  const n = parseFloat(value)
  if (isNaN(n) || n === 0) return "—"
  if (currency === "INR") {
    return (
      "₹" +
      n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function BalanceCell({
  state,
  currency,
}: {
  state: BalanceState
  currency: Currency
}) {
  if (state.status === "idle")
    return <span className="text-muted-foreground/40">—</span>

  if (state.status === "loading") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <HugeiconsIcon
          icon={Loading02Icon}
          className="size-3.5 animate-spin"
          strokeWidth={2}
        />
        <span className="text-xs">Loading…</span>
      </span>
    )
  }

  if (state.status === "error") {
    return (
      <span
        className="flex items-center gap-1.5 text-destructive"
        title={state.message}
      >
        <HugeiconsIcon
          icon={AlertCircleIcon}
          className="size-3.5 shrink-0"
          strokeWidth={2}
        />
        <span className="max-w-[180px] truncate text-xs">{state.message}</span>
      </span>
    )
  }

  const displayValue =
    currency === "INR"
      ? fmt(
          state.balances
            .reduce((s, b) => s + parseFloat(b.balance_inr || "0"), 0)
            .toString(),
          "INR"
        )
      : fmt(state.meta.net_equity, "USD")

  return (
    <span className="flex items-center gap-2">
      <span className="font-medium tabular-nums">{displayValue}</span>
      {state.balances.length > 1 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {state.balances.length} assets
        </span>
      )}
    </span>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <HugeiconsIcon
        icon={AlertCircleIcon}
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={2}
      />
      <span>{message}</span>
    </div>
  )
}

// ── Account Modal ──────────────────────────────────────────────────────────

interface ModalProps {
  account?: Account & { apiSecret?: string }
  onClose: () => void
  onSave: (data: {
    name: string
    apiKey: string
    apiSecret: string
  }) => Promise<void>
}

function AccountModal({ account, onClose, onSave }: ModalProps) {
  const [name, setName] = React.useState(account?.name ?? "")
  const [apiKey, setApiKey] = React.useState(account?.apiKey ?? "")
  const [apiSecret, setApiSecret] = React.useState("")
  const [showSecret, setShowSecret] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const isEdit = Boolean(account)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, saving])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name.trim()) return setError("Name is required")
    if (!apiKey.trim()) return setError("API key is required")
    if (!isEdit && !apiSecret.trim()) return setError("API secret is required")

    setSaving(true)
    try {
      await onSave({ name, apiKey, apiSecret })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit Account" : "Add Account"}
          </h2>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-4"
              strokeWidth={2}
            />
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Account Name
            </label>
            <input
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Account"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              API Key
            </label>
            <input
              className="h-9 rounded-lg border border-input bg-background px-3 font-mono text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              API Secret
              {isEdit && (
                <span className="ml-1 text-muted-foreground/60">
                  (leave blank to keep current)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-10 font-mono text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={
                  isEdit ? "Leave blank to keep unchanged" : "Enter API secret"
                }
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={showSecret ? ViewOffIcon : EyeIcon}
                  className="size-4"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    className="size-3.5 animate-spin"
                    strokeWidth={2}
                  />
                  Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Risk Config Modal ──────────────────────────────────────────────────────

interface RiskConfigModalProps {
  account: Account
  onClose: () => void
  onSave: (id: string, config: RiskConfig) => Promise<void>
}

const CATEGORY_LABELS: Record<string, string> = {
  A: "A — Low conviction",
  AA: "AA — Medium conviction",
  AAA: "AAA — High conviction",
}

function RiskConfigModal({ account, onClose, onSave }: RiskConfigModalProps) {
  const [values, setValues] = React.useState<RiskConfig>({
    ...account.riskConfig,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, saving])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    for (const cat of TRADE_CATEGORIES) {
      if (isNaN(values[cat]) || values[cat] <= 0 || values[cat] >= 100) {
        return setError(`${cat} must be a number between 0 and 100`)
      }
    }
    setSaving(true)
    try {
      await onSave(account.id, values)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function setField(cat: keyof RiskConfig, raw: string) {
    setValues((prev) => ({ ...prev, [cat]: parseFloat(raw) || 0 }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold">Risk Configuration</h2>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-4"
              strokeWidth={2}
            />
          </button>
        </div>
        <p className="mb-5 text-xs text-muted-foreground">
          Set max % of{" "}
          <span className="font-medium text-foreground">{account.name}</span>'s
          balance to risk per trade grade.
        </p>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {TRADE_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-32 text-xs text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </span>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="99"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-8 text-right font-mono text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={values[cat]}
                  onChange={(e) => setField(cat, e.target.value)}
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}

          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    className="size-3.5 animate-spin"
                    strokeWidth={2}
                  />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onClose,
}: {
  name: string
  onConfirm: () => void
  onClose: () => void
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-base font-semibold">Delete Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Remove <span className="font-medium text-foreground">{name}</span>?
          This will delete the API key and secret permanently.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AccountsManager() {
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [balances, setBalances] = React.useState<Record<string, BalanceState>>(
    {}
  )
  const [currency, setCurrency] = React.useState<Currency>(() => {
    const match = document.cookie.match(/(?:^|;\s*)fm-currency=([^;]*)/)
    return match?.[1] === "INR" ? "INR" : "USD"
  })
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(
    null
  )
  const [deletingAccount, setDeletingAccount] = React.useState<Account | null>(
    null
  )
  const [riskConfigAccount, setRiskConfigAccount] =
    React.useState<Account | null>(null)
  const [maskedKeys, setMaskedKeys] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    function onCurrencyChange(e: Event) {
      setCurrency((e as CustomEvent<Currency>).detail)
    }
    window.addEventListener("fm-currency-change", onCurrencyChange)
    return () =>
      window.removeEventListener("fm-currency-change", onCurrencyChange)
  }, [])

  React.useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await fetch("/api/accounts")
      const data = (await res.json()) as Account[]
      setAccounts(data)
      data.forEach((a) => fetchBalance(a.id))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function fetchBalance(id: string) {
    setBalances((prev) => ({ ...prev, [id]: { status: "loading" } }))
    try {
      const res = await fetch(`/api/balance/${id}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setBalances((prev) => ({
          ...prev,
          [id]: {
            status: "error",
            message: data.error ?? "Failed to load balance",
          },
        }))
      } else {
        setBalances((prev) => ({
          ...prev,
          [id]: { status: "ok", balances: data.balances, meta: data.meta },
        }))
      }
    } catch {
      setBalances((prev) => ({
        ...prev,
        [id]: { status: "error", message: "Network error" },
      }))
    }
  }

  async function handleSave(data: {
    name: string
    apiKey: string
    apiSecret: string
  }) {
    if (editingAccount) {
      const body: Record<string, string> = {
        name: data.name,
        apiKey: data.apiKey,
      }
      if (data.apiSecret) body.apiSecret = data.apiSecret
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error ?? "Failed to update")
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingAccount.id ? updated : a))
      )
      if (data.apiKey !== editingAccount.apiKey || data.apiSecret) {
        fetchBalance(editingAccount.id)
      }
    } else {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const created = await res.json()
      if (!res.ok) throw new Error(created.error ?? "Failed to create")
      setAccounts((prev) => [...prev, created])
      fetchBalance(created.id)
    }
  }

  async function handleSaveRiskConfig(id: string, riskConfig: RiskConfig) {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskConfig }),
    })
    const updated = await res.json()
    if (!res.ok)
      throw new Error(updated.error ?? "Failed to update risk config")
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" })
    setAccounts((prev) => prev.filter((a) => a.id !== id))
    setBalances((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setDeletingAccount(null)
  }

  function toggleMask(id: string) {
    setMaskedKeys((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Accounts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage Delta Exchange API keys. Balances shown in{" "}
              <span className="font-medium text-foreground">{currency}</span>.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAccount(null)
              setModalOpen(true)
            }}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Add Account
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_auto] items-center gap-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span>Name</span>
              <span>API Key</span>
              <span>Balance</span>
              <span>Added</span>
              <span className="w-24 text-right">Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={Loading02Icon}
                className="size-4 animate-spin"
                strokeWidth={2}
              />
              Loading accounts…
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">No accounts yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAccount(null)
                  setModalOpen(true)
                }}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-3.5"
                  strokeWidth={2}
                />
                Add your first account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((account) => {
                const bs = balances[account.id] ?? { status: "idle" }
                const isMasked = !maskedKeys.has(account.id)
                const rc = account.riskConfig ?? DEFAULT_RISK_CONFIG
                return (
                  <div
                    key={account.id}
                    className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_auto] items-center gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-muted/30"
                  >
                    {/* Name */}
                    <span className="flex items-center gap-2 font-medium">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {account.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex flex-col">
                        <span>{account.name}</span>
                        <span className="text-[10px] font-normal text-muted-foreground/60 tabular-nums">
                          A:{rc.A}% · AA:{rc.AA}% · AAA:{rc.AAA}%
                        </span>
                      </span>
                    </span>

                    {/* API Key */}
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span>
                        {isMasked ? maskKey(account.apiKey) : account.apiKey}
                      </span>
                      <button
                        onClick={() => toggleMask(account.id)}
                        className="shrink-0 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                        title={isMasked ? "Show key" : "Hide key"}
                      >
                        <HugeiconsIcon
                          icon={isMasked ? EyeIcon : ViewOffIcon}
                          className="size-3.5"
                          strokeWidth={1.5}
                        />
                      </button>
                    </span>

                    {/* Balance */}
                    <BalanceCell state={bs} currency={currency} />

                    {/* Added */}
                    <span className="text-xs text-muted-foreground">
                      {new Date(account.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {/* Actions */}
                    <div className="flex w-24 items-center justify-end gap-1">
                      <button
                        onClick={() => fetchBalance(account.id)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Refresh balance"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          className={cn(
                            "size-3.5",
                            bs.status === "ok" && "text-green-500",
                            bs.status === "error" && "text-destructive"
                          )}
                          strokeWidth={bs.status === "loading" ? 1.5 : 2}
                        />
                      </button>
                      <button
                        onClick={() => setRiskConfigAccount(account)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Risk configuration"
                      >
                        <HugeiconsIcon
                          icon={Settings01Icon}
                          className="size-3.5"
                          strokeWidth={1.5}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAccount(account)
                          setModalOpen(true)
                        }}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit account"
                      >
                        <HugeiconsIcon
                          icon={Edit01Icon}
                          className="size-3.5"
                          strokeWidth={1.5}
                        />
                      </button>
                      <button
                        onClick={() => setDeletingAccount(account)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete account"
                      >
                        <HugeiconsIcon
                          icon={Delete01Icon}
                          className="size-3.5"
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Error summary */}
        {accounts.length > 0 &&
          Object.entries(balances).some(([, b]) => b.status === "error") && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                API Errors
              </p>
              {Object.entries(balances)
                .filter(([, b]) => b.status === "error")
                .map(([id, b]) => {
                  const acc = accounts.find((a) => a.id === id)
                  if (!acc || b.status !== "error") return null
                  return (
                    <ErrorBanner
                      key={id}
                      message={`${acc.name}: ${b.message}`}
                    />
                  )
                })}
            </div>
          )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <AccountModal
          account={editingAccount ?? undefined}
          onClose={() => {
            setModalOpen(false)
            setEditingAccount(null)
          }}
          onSave={handleSave}
        />
      )}
      {riskConfigAccount && (
        <RiskConfigModal
          account={riskConfigAccount}
          onClose={() => setRiskConfigAccount(null)}
          onSave={handleSaveRiskConfig}
        />
      )}
      {deletingAccount && (
        <DeleteConfirm
          name={deletingAccount.name}
          onClose={() => setDeletingAccount(null)}
          onConfirm={() => handleDelete(deletingAccount.id)}
        />
      )}
    </>
  )
}
