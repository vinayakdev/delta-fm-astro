import type { APIRoute } from "astro"
import { updateAccount, deleteAccount } from "@/lib/server/accounts"

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const body = await request.json()
  const { name, apiKey, apiSecret } = body as {
    name?: string
    apiKey?: string
    apiSecret?: string
  }

  const updated = updateAccount(id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(apiKey !== undefined && { apiKey: apiKey.trim() }),
    ...(apiSecret !== undefined && { apiSecret: apiSecret.trim() }),
  })

  if (!updated) return Response.json({ error: "Account not found" }, { status: 404 })

  return Response.json({
    id: updated.id,
    name: updated.name,
    apiKey: updated.apiKey,
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
