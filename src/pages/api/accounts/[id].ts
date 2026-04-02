import type { APIRoute } from "astro"
import { updateAccount, deleteAccount } from "@/lib/server/accounts"
import type { RiskConfig } from "@/lib/risk"

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const body = await request.json()
  const { name, apiKey, apiSecret, riskConfig } = body as {
    name?: string
    apiKey?: string
    apiSecret?: string
    riskConfig?: RiskConfig
  }

  const updated = updateAccount(id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(apiKey !== undefined && { apiKey: apiKey.trim() }),
    ...(apiSecret !== undefined && { apiSecret: apiSecret.trim() }),
    ...(riskConfig !== undefined && { riskConfig }),
  })

  if (!updated) return Response.json({ error: "Account not found" }, { status: 404 })

  return Response.json({
    id: updated.id,
    name: updated.name,
    apiKey: updated.apiKey,
    riskConfig: updated.riskConfig,
    createdAt: updated.createdAt,
  })
}

export const DELETE: APIRoute = ({ params }) => {
  const { id } = params
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const ok = deleteAccount(id)
  if (!ok) return Response.json({ error: "Account not found" }, { status: 404 })
  return Response.json({ success: true })
}
