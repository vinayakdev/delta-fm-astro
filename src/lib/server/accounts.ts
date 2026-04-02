import { readFileSync, writeFileSync, existsSync } from "fs"
import { randomUUID } from "crypto"
import path from "path"
import { DEFAULT_RISK_CONFIG } from "@/lib/risk"
import type { RiskConfig } from "@/lib/risk"

export interface Account {
  id: string
  name: string
  apiKey: string
  apiSecret: string
  riskConfig: RiskConfig
  createdAt: string
}

const DATA_FILE = path.resolve(process.cwd(), "src/lib/data/accounts.json")

function applyDefaults(raw: Partial<Account>): Account {
  return {
    ...raw,
    riskConfig: raw.riskConfig ?? { ...DEFAULT_RISK_CONFIG },
  } as Account
}

export function getAccounts(): Account[] {
  if (!existsSync(DATA_FILE)) return []
  try {
    return (JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Partial<Account>[]).map(applyDefaults)
  } catch {
    return []
  }
}

export function getAccount(id: string): Account | undefined {
  return getAccounts().find((a) => a.id === id)
}

export function createAccount(data: {
  name: string
  apiKey: string
  apiSecret: string
}): Account {
  const accounts = getAccounts()
  const account: Account = {
    id: randomUUID(),
    name: data.name,
    apiKey: data.apiKey,
    apiSecret: data.apiSecret,
    riskConfig: { ...DEFAULT_RISK_CONFIG },
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2))
  return account
}

export function updateAccount(
  id: string,
  data: Partial<Pick<Account, "name" | "apiKey" | "apiSecret" | "riskConfig">>
): Account | null {
  const accounts = getAccounts()
  const idx = accounts.findIndex((a) => a.id === id)
  if (idx === -1) return null
  accounts[idx] = { ...accounts[idx], ...data }
  writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2))
  return accounts[idx]
}

export function deleteAccount(id: string): boolean {
  const accounts = getAccounts()
  const filtered = accounts.filter((a) => a.id !== id)
  if (filtered.length === accounts.length) return false
  writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))
  return true
}
