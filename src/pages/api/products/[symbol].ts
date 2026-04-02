import type { APIRoute } from "astro"
import { fetchProductPublic } from "@/lib/server/delta"

export const GET: APIRoute = async ({ params }) => {
  const { symbol } = params
  if (!symbol) return Response.json({ error: "Missing symbol" }, { status: 400 })

  const result = await fetchProductPublic(symbol.toUpperCase())

  if (!result.success || !result.result) {
    return Response.json({ error: "Product not found" }, { status: 404 })
  }

  return Response.json(result.result)
}
