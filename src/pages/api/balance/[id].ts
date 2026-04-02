import type { APIRoute } from "astro"
import { getClient, formatDeltaError } from "@/lib/server/delta"
import type { WalletMeta } from "@/lib/server/delta"

export const GET: APIRoute = async ({ params }) => {
  const { id } = params
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const client = getClient(id)
  if (!client) return Response.json({ error: "Account not found" }, { status: 404 })

  const result = await client.getWalletBalances()

  if (!result.success) {
    return Response.json({ error: formatDeltaError(result.error) }, { status: 400 })
  }

  const balances = (result.result ?? []).filter(
    (b) => parseFloat(b.balance) > 0 || parseFloat(b.available_balance) > 0
  )

  return Response.json({
    balances,
    meta: result.meta as WalletMeta | undefined,
  })
}
