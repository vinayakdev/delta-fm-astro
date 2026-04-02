import { createHmac } from "crypto"

const BASE_URL = "https://api.india.delta.exchange"

function sign(
  secret: string,
  method: string,
  path: string,
  timestamp: string,
  queryString = "",
  body = ""
): string {
  const message = method + timestamp + path + queryString + body
  return createHmac("sha256", secret).update(message).digest("hex")
}

export interface DeltaError {
  code: string
  message: string
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

export interface WalletResponse {
  success: boolean
  result?: WalletBalance[]
  meta?: WalletMeta
  error?: string | DeltaError
}

export async function getWalletBalances(
  apiKey: string,
  apiSecret: string
): Promise<WalletResponse> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const path = "/v2/wallet/balances"
  const signature = sign(apiSecret, "GET", path, timestamp)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        "api-key": apiKey,
        signature,
        timestamp,
      },
    })

    return (await res.json()) as WalletResponse
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Network error — could not reach Delta Exchange",
    }
  }
}

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
