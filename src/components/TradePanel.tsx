import * as React from "react"
import {
  AlertCircleIcon,
  Loading02Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { calcLotSize, DEFAULT_RISK_CONFIG, TRADE_CATEGORIES } from "@/lib/risk"
import type { TradeCategory, RiskConfig } from "@/lib/risk"

// ── Types ──────────────────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  riskConfig: RiskConfig
}

interface WalletMeta {
  net_equity: string
}

interface Product {
  id: number
  symbol: string
  description: string
  contract_value: string
  contract_unit_currency: string
  notional_type: string
  tick_size: string
  min_size: number
}

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; equityUsd: number }
  | { status: "error"; message: string }

type ProductState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; product: Product }
  | { status: "error"; message: string }

type OrderState =
  | { status: "idle" }
  | { status: "placing" }
  | { status: "ok"; orderId: number }
  | { status: "error"; message: string }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtUsd(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtNum(n: number, decimals = 4): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm tabular-nums", highlight && "font-semibold text-foreground")}>
        {value}
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function TradePanel() {
  // ── Account & balance ────────────────────────────────────────────────────
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = React.useState(true)
  const [selectedAccountId, setSelectedAccountId] = React.useState("")
  const [balanceState, setBalanceState] = React.useState<BalanceState>({ status: "idle" })

  // ── Trade inputs ─────────────────────────────────────────────────────────
  const [symbol, setSymbol] = React.useState("")
  const [symbolInput, setSymbolInput] = React.useState("")
  const [productState, setProductState] = React.useState<ProductState>({ status: "idle" })
  const [direction, setDirection] = React.useState<"buy" | "sell">("buy")
  const [category, setCategory] = React.useState<TradeCategory>("A")
  const [entryPrice, setEntryPrice] = React.useState("")
  const [slPrice, setSlPrice] = React.useState("")
  const [orderType, setOrderType] = React.useState<"limit_order" | "market_order">("limit_order")

  // ── Order result ─────────────────────────────────────────────────────────
  const [orderState, setOrderState] = React.useState<OrderState>({ status: "idle" })

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  // Load accounts on mount
  React.useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => {
        setAccounts(data)
        if (data.length > 0) setSelectedAccountId(data[0].id)
      })
      .catch(() => {})
      .finally(() => setAccountsLoading(false))
  }, [])

  // Fetch balance when account changes
  React.useEffect(() => {
    if (!selectedAccountId) return
    setBalanceState({ status: "loading" })
    fetch(`/api/balance/${selectedAccountId}`)
      .then((r) => r.json())
      .then((data: { balances: unknown[]; meta: WalletMeta; error?: string }) => {
        if (data.error) {
          setBalanceState({ status: "error", message: data.error })
        } else {
          setBalanceState({ status: "ok", equityUsd: parseFloat(data.meta.net_equity) || 0 })
        }
      })
      .catch(() => setBalanceState({ status: "error", message: "Network error" }))
  }, [selectedAccountId])

  // Look up product when symbol is submitted
  async function lookupProduct() {
    const sym = symbolInput.trim().toUpperCase()
    if (!sym) return
    setSymbol(sym)
    setProductState({ status: "loading" })
    setOrderState({ status: "idle" })
    try {
      const res = await fetch(`/api/products/${sym}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setProductState({ status: "error", message: data.error ?? "Product not found" })
      } else {
        setProductState({ status: "ok", product: data as Product })
      }
    } catch {
      setProductState({ status: "error", message: "Network error" })
    }
  }

  // Derived calculation
  const riskConfig = selectedAccount?.riskConfig ?? DEFAULT_RISK_CONFIG
  const balanceUsd = balanceState.status === "ok" ? balanceState.equityUsd : 0
  const entryNum = parseFloat(entryPrice)
  const slNum = parseFloat(slPrice)
  const contractValue = productState.status === "ok"
    ? parseFloat(productState.product.contract_value)
    : 0

  const calc = React.useMemo(() => {
    if (balanceUsd <= 0 || !entryNum || !slNum || contractValue <= 0) return null
    return calcLotSize({ balanceUsd, riskConfig, category, entryPrice: entryNum, slPrice: slNum, contractValue })
  }, [balanceUsd, riskConfig, category, entryNum, slNum, contractValue])

  // Validate SL direction
  const slDirectionOk = !entryNum || !slNum || (
    direction === "buy" ? slNum < entryNum : slNum > entryNum
  )

  async function handlePlaceOrder() {
    if (!calc || calc.lots <= 0 || !selectedAccountId || productState.status !== "ok") return
    setOrderState({ status: "placing" })

    const payload: Record<string, unknown> = {
      accountId: selectedAccountId,
      product_id: productState.product.id,
      size: calc.lots,
      side: direction,
      order_type: orderType,
    }
    if (orderType === "limit_order" && entryPrice) {
      payload.limit_price = entryPrice
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setOrderState({ status: "error", message: data.error ?? "Order failed" })
      } else {
        setOrderState({ status: "ok", orderId: data.id })
      }
    } catch {
      setOrderState({ status: "error", message: "Network error" })
    }
  }

  const canPlace =
    calc !== null &&
    calc.lots > 0 &&
    slDirectionOk &&
    selectedAccountId !== "" &&
    productState.status === "ok" &&
    balanceState.status === "ok" &&
    orderState.status !== "placing"

  if (accountsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <HugeiconsIcon icon={Loading02Icon} className="size-4 animate-spin" strokeWidth={2} />
        Loading…
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No accounts configured.</p>
          <a href="/accounts" className="mt-2 inline-block text-sm text-primary hover:underline">
            Add an account first
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Place Trade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your SL and let the system calculate the correct lot size.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: Inputs */}
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">

          {/* Account selector */}
          <Field label="Account">
            <div className="flex items-center gap-2">
              <select
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div className="text-right text-xs text-muted-foreground min-w-[80px]">
                {balanceState.status === "loading" && (
                  <span className="flex items-center gap-1 justify-end">
                    <HugeiconsIcon icon={Loading02Icon} className="size-3 animate-spin" strokeWidth={2} />
                    Loading
                  </span>
                )}
                {balanceState.status === "ok" && (
                  <span className="font-medium text-foreground">{fmtUsd(balanceState.equityUsd)}</span>
                )}
                {balanceState.status === "error" && (
                  <span className="text-destructive" title={balanceState.message}>Error</span>
                )}
              </div>
            </div>
          </Field>

          {/* Symbol lookup */}
          <Field label="Instrument">
            <div className="flex gap-2">
              <input
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. BTCUSDT"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookupProduct()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={lookupProduct}
                disabled={!symbolInput.trim() || productState.status === "loading"}
              >
                {productState.status === "loading" ? (
                  <HugeiconsIcon icon={Loading02Icon} className="size-3.5 animate-spin" strokeWidth={2} />
                ) : "Lookup"}
              </Button>
            </div>
            {productState.status === "ok" && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5 shrink-0 text-green-500" strokeWidth={2} />
                <span className="font-medium">{productState.product.symbol}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-muted-foreground">{productState.product.description}</span>
                <span className="ml-auto font-mono text-muted-foreground">
                  cv: {productState.product.contract_value} {productState.product.contract_unit_currency}
                </span>
              </div>
            )}
            {productState.status === "error" && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 shrink-0" strokeWidth={2} />
                {productState.message}
              </p>
            )}
          </Field>

          {/* Direction */}
          <Field label="Direction">
            <div className="flex gap-1 rounded-lg border border-input p-0.5">
              <button
                type="button"
                onClick={() => setDirection("buy")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-semibold transition-all",
                  direction === "buy"
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Long (Buy)
              </button>
              <button
                type="button"
                onClick={() => setDirection("sell")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-semibold transition-all",
                  direction === "sell"
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Short (Sell)
              </button>
            </div>
          </Field>

          {/* Trade category */}
          <Field label="Trade Grade">
            <div className="flex gap-1 rounded-lg border border-input p-0.5">
              {TRADE_CATEGORIES.map((cat) => {
                const pct = riskConfig[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "flex flex-1 flex-col items-center rounded-md py-1.5 transition-all",
                      category === cat
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold">{cat}</span>
                    <span className="text-[10px] opacity-70">{pct}%</span>
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Order type */}
          <Field label="Order Type">
            <div className="flex gap-1 rounded-lg border border-input p-0.5">
              {(["limit_order", "market_order"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                    orderType === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "limit_order" ? "Limit" : "Market"}
                </button>
              ))}
            </div>
          </Field>

          {/* Entry price */}
          {orderType === "limit_order" && (
            <Field label="Entry Price">
              <input
                type="number"
                className="h-9 rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
            </Field>
          )}

          {/* SL price */}
          <Field label="Stop Loss Price">
            <input
              type="number"
              className={cn(
                "h-9 rounded-lg border bg-background px-3 font-mono text-sm outline-none focus:ring-2 transition-all",
                !slDirectionOk
                  ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                  : "border-input focus:border-primary focus:ring-primary/20"
              )}
              placeholder="0.00"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
            />
            {!slDirectionOk && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 shrink-0" strokeWidth={2} />
                SL must be {direction === "buy" ? "below" : "above"} entry for a {direction === "buy" ? "long" : "short"}
              </p>
            )}
          </Field>
        </div>

        {/* Right: Summary + Action */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Risk Summary
            </p>

            <div className="divide-y divide-border">
              <SummaryRow
                label="Account Balance"
                value={balanceState.status === "ok" ? fmtUsd(balanceState.equityUsd) : "—"}
              />
              <SummaryRow
                label={`Risk Grade (${category})`}
                value={`${riskConfig[category]}% of balance`}
              />
              <SummaryRow
                label="Risk Amount"
                value={calc ? fmtUsd(calc.riskAmount) : "—"}
              />
              <SummaryRow
                label="SL Distance"
                value={calc ? fmtNum(calc.slDistance) + " pts" : "—"}
              />
              <SummaryRow
                label="Risk per Lot"
                value={calc ? fmtUsd(calc.riskPerLot) : "—"}
              />
              <SummaryRow
                label="Calculated Lots"
                value={calc ? (calc.lots > 0 ? calc.lots.toLocaleString() : "0 — check inputs") : "—"}
                highlight
              />
            </div>

            {calc && calc.lots > 0 && (
              <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
                <HugeiconsIcon icon={InformationCircleIcon} className="mb-0.5 mr-1 inline size-3.5 align-middle" strokeWidth={1.5} />
                Place <span className="font-semibold text-foreground">{calc.lots} lots</span> {direction === "buy" ? "long" : "short"}{" "}
                on <span className="font-semibold text-foreground">{symbol}</span> risking{" "}
                <span className="font-semibold text-foreground">{fmtUsd(calc.riskAmount)}</span> ({calc.riskPct}%)
              </div>
            )}
          </div>

          {/* Order result banner */}
          {orderState.status === "ok" && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 shrink-0" strokeWidth={2} />
              <span>Order placed — ID #{orderState.orderId}</span>
              <button
                onClick={() => setOrderState({ status: "idle" })}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
          {orderState.status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              <span>{orderState.message}</span>
              <button
                onClick={() => setOrderState({ status: "idle" })}
                className="ml-auto text-destructive/60 hover:text-destructive"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={!canPlace}
            className={cn(
              "h-11 w-full text-sm font-semibold",
              direction === "buy"
                ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600/30"
                : "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/30"
            )}
          >
            {orderState.status === "placing" ? (
              <>
                <HugeiconsIcon icon={Loading02Icon} className="size-4 animate-spin" strokeWidth={2} />
                Placing Order…
              </>
            ) : calc && calc.lots > 0 ? (
              `${direction === "buy" ? "Buy" : "Sell"} ${calc.lots} Lots — ${symbol || "…"}`
            ) : (
              "Fill in trade details"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
