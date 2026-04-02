import { createHmac } from "crypto"
import { getAccount } from "@/lib/server/accounts"

const BASE_URL = "https://api.india.delta.exchange"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeltaError {
  code: string
  message: string
}

export interface DeltaResponse<T> {
  success: boolean
  result?: T
  meta?: Record<string, unknown>
  error?: string | DeltaError
}

export interface WalletBalance {
  asset_id: number
  asset_symbol: string
  available_balance: string
  available_balance_inr: string
  balance: string
  balance_inr: string
  blocked_margin: string
  position_margin: string
  order_margin: string
}

export interface WalletMeta {
  net_equity: string
  robo_trading_equity: string
  tracker_equity: string
}

export interface Product {
  id: number
  symbol: string
  description: string
  contract_type: string
  contract_value: string          // base asset units per contract
  contract_unit_currency: string  // base asset symbol (e.g. "BTC")
  notional_type: "vanilla" | "inverse"
  settling_asset: { symbol: string; precision: number }
  tick_size: string
  min_size: number
}

export interface OrderPayload {
  product_id: number
  size: number
  side: "buy" | "sell"
  order_type: "limit_order" | "market_order"
  limit_price?: string
}

export interface Order {
  id: number
  product_id: number
  product_symbol: string
  size: number
  unfilled_size: number
  side: "buy" | "sell"
  order_type: string
  limit_price: string | null
  state: string
  created_at: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class DeltaClient {
  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string
  ) {}

  private sign(method: string, path: string, timestamp: string, queryString = "", body = ""): string {
    const message = method + timestamp + path + queryString + body
    return createHmac("sha256", this.apiSecret).update(message).digest("hex")
  }

  private async request<T>(
    method: string,
    path: string,
    options: { query?: Record<string, string>; body?: unknown } = {}
  ): Promise<DeltaResponse<T>> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const queryString = options.query ? "?" + new URLSearchParams(options.query).toString() : ""
    const bodyString = options.body ? JSON.stringify(options.body) : ""
    const signature = this.sign(method, path, timestamp, queryString, bodyString)

    try {
      const res = await fetch(`${BASE_URL}${path}${queryString}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": this.apiKey,
          signature,
          timestamp,
        },
        body: bodyString || undefined,
      })
      return (await res.json()) as DeltaResponse<T>
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error — could not reach Delta Exchange",
      }
    }
  }

  // ─── Wallet ────────────────────────────────────────────────────────────────

  getWalletBalances() {
    return this.request<WalletBalance[]>("GET", "/v2/wallet/balances")
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  getProduct(symbol: string) {
    return this.request<Product>("GET", `/v2/products/${symbol}`)
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  placeOrder(payload: OrderPayload) {
    return this.request<Order>("POST", "/v2/orders", { body: payload })
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/** Look up an account by ID and return a ready-to-use DeltaClient, or null. */
export function getClient(accountId: string): DeltaClient | null {
  const account = getAccount(accountId)
  if (!account) return null
  return new DeltaClient(account.apiKey, account.apiSecret)
}

/**
 * Fetch product details without credentials (public endpoint).
 * Used when no account context is needed.
 */
export async function fetchProductPublic(symbol: string): Promise<DeltaResponse<Product>> {
  try {
    const res = await fetch(`${BASE_URL}/v2/products/${symbol}`, {
      headers: { Accept: "application/json" },
    })
    return (await res.json()) as DeltaResponse<Product>
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error — could not reach Delta Exchange",
    }
  }
}

// ─── Error formatting ─────────────────────────────────────────────────────────

export function formatDeltaError(error: string | DeltaError | undefined): string {
  if (!error) return "Unknown error"
  if (typeof error === "string") {
    const errorMessages: Record<string, string> = {
      InvalidApiKey: "Invalid API key — check your key is correct",
      InvalidSignature: "Signature mismatch — API secret may be wrong",
      Unauthorized: "Unauthorized — verify your API key has read permissions",
      IpNotWhitelisted: "Your IP is not whitelisted for this API key",
      ApiKeyExpired: "This API key has expired",
      RateLimitExceeded: "Rate limit exceeded — try again shortly",
    }
    return errorMessages[error] ?? error
  }
  return error.message ?? error.code ?? "Unknown error"
}
