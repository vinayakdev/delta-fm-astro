import type { APIRoute } from "astro"
import { getClient, formatDeltaError } from "@/lib/server/delta"
import type { OrderPayload } from "@/lib/server/delta"

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { accountId, ...orderPayload } = body as { accountId: string } & OrderPayload

  if (!accountId) return Response.json({ error: "Missing accountId" }, { status: 400 })
  if (!orderPayload.product_id) return Response.json({ error: "Missing product_id" }, { status: 400 })
  if (!orderPayload.size || orderPayload.size <= 0) return Response.json({ error: "Invalid size" }, { status: 400 })
  if (!orderPayload.side) return Response.json({ error: "Missing side" }, { status: 400 })
  if (!orderPayload.order_type) return Response.json({ error: "Missing order_type" }, { status: 400 })

  const client = getClient(accountId)
  if (!client) return Response.json({ error: "Account not found" }, { status: 404 })

  const result = await client.placeOrder(orderPayload)

  if (!result.success) {
    return Response.json({ error: formatDeltaError(result.error) }, { status: 400 })
  }

  return Response.json(result.result)
}
