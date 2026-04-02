import type { APIRoute } from "astro"
import { getAccount } from "@/lib/server/accounts"
import { getWalletBalances, formatDeltaError } from "@/lib/server/delta"

export const GET: APIRoute = async ({ params }) => {
  const { id } = params
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const account = getAccount(id)
  if (!account) return Response.json({ error: "Account not found" }, { status: 404 })

  const result = await getWalletBalances(account.apiKey, account.apiSecret)

  if (!result.success) {
    return Response.json({ error: formatDeltaError(result.error) }, { status: 400 })
  }

  const balances = (result.result ?? []).filter(
    (b) => parseFloat(b.balance) > 0 || parseFloat(b.available_balance) > 0
  )

  return Response.json({
    balances,
    meta: result.meta,
  })
}
