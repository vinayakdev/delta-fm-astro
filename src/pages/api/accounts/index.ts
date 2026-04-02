import type { APIRoute } from "astro"
import { getAccounts, createAccount } from "@/lib/server/accounts"

export const GET: APIRoute = () => {
  const accounts = getAccounts().map((a) => ({
    id: a.id,
    name: a.name,
    apiKey: a.apiKey,
    riskConfig: a.riskConfig,
    // never send secret to client
    createdAt: a.createdAt,
  }))
  return Response.json(accounts)
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { name, apiKey, apiSecret } = body as {
    name: string
    apiKey: string
    apiSecret: string
  }

  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 })
  if (!apiKey?.trim()) return Response.json({ error: "API key is required" }, { status: 400 })
  if (!apiSecret?.trim())
    return Response.json({ error: "API secret is required" }, { status: 400 })

  const account = createAccount({ name: name.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() })
  return Response.json({
    id: account.id,
    name: account.name,
    apiKey: account.apiKey,
    riskConfig: account.riskConfig,
    createdAt: account.createdAt,
  })
}
