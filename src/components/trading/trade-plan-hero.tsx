"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Target,
  Shield,
  Crosshair,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { TRADE_PLAN } from "@/lib/trade-plan";

const isShort = TRADE_PLAN.direction === "SHORT";

export function TradePlanHero() {
  const dirIcon = isShort ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />;
  const dirColor = isShort ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
  const dirBg = isShort ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900";

  return (
    <Card className={`overflow-hidden border-2 ${dirBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${dirColor} bg-background shadow-sm`}>
              {dirIcon}
            </div>
            <div>
              <CardTitle className="text-2xl tracking-tight">
                {TRADE_PLAN.symbol} — {TRADE_PLAN.direction}
              </CardTitle>
              <CardDescription className="text-sm">
                Decisive trade plan · Generated {new Date(TRADE_PLAN.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background">
              {TRADE_PLAN.orderType} ORDER
            </Badge>
            <Badge className={isShort ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}>
              <Activity className="mr-1 h-3 w-3" /> READY FOR ENTRY
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* The big three levels */}
        <div className="grid gap-3 sm:grid-cols-3">
          <LevelCard
            label="Strike Entry"
            value={`$${TRADE_PLAN.entry.toFixed(2)}`}
            icon={<Crosshair className="h-4 w-4" />}
            tone="neutral"
            sub={isShort ? "Limit sell" : "Limit buy"}
          />
          <LevelCard
            label="Hard Stop Loss"
            value={`$${TRADE_PLAN.stopLoss.toFixed(2)}`}
            icon={<Shield className="h-4 w-4" />}
            tone="danger"
            sub={`Risk $${TRADE_PLAN.riskPerOz.toFixed(2)}/oz`}
          />
          <LevelCard
            label="Final Take Profit"
            value={`$${TRADE_PLAN.takeProfit.toFixed(2)}`}
            icon={<Target className="h-4 w-4" />}
            tone="success"
            sub={`Reward $${TRADE_PLAN.rewardPerOz.toFixed(2)}/oz`}
          />
        </div>

        {/* R:R meter */}
        <Card className="bg-background/60">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Risk : Reward</span>
              </div>
              <span className="text-2xl font-bold tabular-nums">
                1 : <span className={dirColor}>{TRADE_PLAN.rr.toFixed(2)}</span>
              </span>
            </div>
            <Progress value={Math.min((TRADE_PLAN.rr / 8) * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              For every $1 of risk, the plan targets <span className="font-semibold">${TRADE_PLAN.rr.toFixed(2)}</span> of reward.
              Expectancy at 30% win rate: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +${((0.3 * TRADE_PLAN.rewardPerOz) - (0.7 * TRADE_PLAN.riskPerOz)).toFixed(2)}/oz per trade
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Derivations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Logical Derivation (every level structurally derived)
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            <DerivationCard
              label="Entry"
              value={`$${TRADE_PLAN.entry.toFixed(2)}`}
              text={TRADE_PLAN.derivation.entry}
              icon={<Crosshair className="h-4 w-4" />}
            />
            <DerivationCard
              label="Stop Loss"
              value={`$${TRADE_PLAN.stopLoss.toFixed(2)}`}
              text={TRADE_PLAN.derivation.stopLoss}
              icon={<Shield className="h-4 w-4" />}
            />
            <DerivationCard
              label="Take Profit"
              value={`$${TRADE_PLAN.takeProfit.toFixed(2)}`}
              text={TRADE_PLAN.derivation.takeProfit}
              icon={<Target className="h-4 w-4" />}
            />
          </div>
        </div>

        <Separator />

        {/* Confluence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Confluence Stack ({TRADE_PLAN.confluence.length} factors)
            </h4>
            <Badge variant="secondary" className="text-xs">All aligned</Badge>
          </div>
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04 } },
            }}
            className="grid gap-1.5 sm:grid-cols-2"
          >
            {TRADE_PLAN.confluence.map((c, i) => (
              <motion.li
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0 },
                }}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{c}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <Separator />

        {/* Invalidation + execution window */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              Hard Invalidation
            </h4>
            <ul className="space-y-1.5">
              {TRADE_PLAN.invalidation.map((inv, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-500 shrink-0" />
                  <span>{inv}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Execution Window
            </h4>
            <p className="text-sm">{TRADE_PLAN.executionWindow}</p>
          </div>
        </div>

        <Separator />

        {/* Spot reference */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Spot reference: <span className="font-mono">${TRADE_PLAN.spotReference.toFixed(2)}</span></span>
          <span className="flex items-center gap-1">
            {isShort ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            Entry {isShort ? "above" : "below"} spot by <span className="font-mono">${Math.abs(TRADE_PLAN.entry - TRADE_PLAN.spotReference).toFixed(2)}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelCard({
  label,
  value,
  icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "neutral" | "danger" | "success";
  sub: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300"
      : tone === "success"
      ? "border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
      : "border-border text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border-2 bg-background p-4 ${toneClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs mt-1 opacity-80">{sub}</div>
    </motion.div>
  );
}

function DerivationCard({
  label,
  value,
  text,
  icon,
}: {
  label: string;
  value: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-sm font-mono font-semibold">{value}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
