export type TradeCategory = "A" | "AA" | "AAA"

export interface RiskConfig {
  A: number // % of account balance (e.g. 0.5 = 0.5%)
  AA: number
  AAA: number
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  A: 3,
  AA: 6,
  AAA: 10,
}

export const TRADE_CATEGORIES: TradeCategory[] = ["A", "AA", "AAA"]

export interface LotCalcInput {
  balanceUsd: number
  riskConfig: RiskConfig
  category: TradeCategory
  entryPrice: number
  slPrice: number
  contractValue: number // base asset units per contract (from product API)
}

export interface LotCalcResult {
  riskPct: number
  riskAmount: number // USD at risk
  slDistance: number // absolute price distance to SL
  riskPerLot: number // USD risked per lot
  lots: number // floor'd integer lots (0 if inputs invalid)
}

/**
 * Calculates position size for linear (vanilla/USDT-margined) contracts.
 *
 * Formula:
 *   risk_per_lot = contract_value × sl_distance
 *   lots = floor(risk_amount / risk_per_lot)
 *
 * Example: BTC perp, contract_value = 0.001 BTC
 *   SL distance = $500, balance = $10,000, category AA (1%)
 *   risk_amount = $100
 *   risk_per_lot = 0.001 × 500 = $0.50
 *   lots = floor(100 / 0.50) = 200
 */
export function calcLotSize(input: LotCalcInput): LotCalcResult {
  const {
    balanceUsd,
    riskConfig,
    category,
    entryPrice,
    slPrice,
    contractValue,
  } = input

  const riskPct = riskConfig[category]
  const riskAmount = (balanceUsd * riskPct) / 100
  const slDistance = Math.abs(entryPrice - slPrice)
  const riskPerLot = contractValue * slDistance

  const lots =
    slDistance > 0 && contractValue > 0 && riskPerLot > 0
      ? Math.floor(riskAmount / riskPerLot)
      : 0

  return { riskPct, riskAmount, slDistance, riskPerLot, lots }
}
