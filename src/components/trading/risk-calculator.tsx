"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { computePositionSize, TRADE_PLAN } from "@/lib/trade-plan";
import { Calculator, Coins, TrendingDown } from "lucide-react";

export function RiskCalculator() {
  const [balance, setBalance] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [contractSize, setContractSize] = useState(100);

  const result = computePositionSize(balance, riskPct, TRADE_PLAN.riskPerOz, contractSize);
  const potentialProfit = result.riskAmountUSD * TRADE_PLAN.rr;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Position Size Calculator
        </CardTitle>
        <CardDescription>
          Auto-calculated for the {TRADE_PLAN.symbol} {TRADE_PLAN.direction} plan.
          Risk per ounce is fixed at ${TRADE_PLAN.riskPerOz.toFixed(2)} (entry ${TRADE_PLAN.entry} → stop ${TRADE_PLAN.stopLoss}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="balance" className="text-xs">Account balance (USD)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              min={100}
              step={100}
              onChange={(e) => setBalance(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="risk" className="text-xs">
              Risk per trade: <span className="font-mono font-semibold">{riskPct}%</span>
            </Label>
            <Slider
              id="risk"
              value={[riskPct]}
              min={0.25}
              max={5}
              step={0.25}
              onValueChange={(v) => setRiskPct(v[0])}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0.25%</span>
              <span>5% cap</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contract" className="text-xs">Contract size (oz / lot)</Label>
            <Input
              id="contract"
              type="number"
              value={contractSize}
              min={1}
              step={1}
              onChange={(e) => setContractSize(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Risk amount" value={`$${result.riskAmountUSD.toLocaleString()}`} tone="danger" icon={<TrendingDown className="h-4 w-4" />} />
          <Stat label="Position size" value={`${result.lots} lots`} tone="neutral" icon={<Coins className="h-4 w-4" />} />
          <Stat label="Ounces" value={`${result.ounces.toLocaleString()} oz`} tone="neutral" icon={<Coins className="h-4 w-4" />} />
          <Stat label="Potential profit" value={`$${potentialProfit.toLocaleString()}`} tone="success" icon={<TrendingDown className="h-4 w-4 rotate-180" />} />
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Math:</strong> {balance.toLocaleString()} × {riskPct}% = ${result.riskAmountUSD} risk →
          ${result.riskAmountUSD} ÷ ${TRADE_PLAN.riskPerOz}/oz risk = {result.ounces} oz = {result.lots} lots.
          At R:R 1:{TRADE_PLAN.rr}, target profit = ${result.riskAmountUSD} × {TRADE_PLAN.rr} = <span className="font-semibold text-emerald-600 dark:text-emerald-400">${potentialProfit.toLocaleString()}</span>.
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone: "danger" | "success" | "neutral"; icon: React.ReactNode }) {
  const toneClass =
    tone === "danger" ? "border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300" :
    tone === "success" ? "border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300" :
    "border-border text-foreground";
  return (
    <div className={`rounded-lg border bg-background p-3 ${toneClass}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
