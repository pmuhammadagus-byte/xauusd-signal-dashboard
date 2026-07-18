"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { METHODOLOGY } from "@/lib/methodology";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Activity,
  GitBranch,
  Layers,
  Droplets,
  CandlestickChart,
  Network,
  BookOpen,
} from "lucide-react";

const catIcon = {
  structure: Network,
  smc: GitBranch,
  "supply-demand": Layers,
  liquidity: Droplets,
  candlestick: CandlestickChart,
  pattern: Activity,
};

const catLabel = {
  structure: "Market Structure",
  smc: "Smart Money Concepts",
  "supply-demand": "Supply & Demand",
  liquidity: "Liquidity",
  candlestick: "Candlestick",
  pattern: "Chart Pattern",
};

const catColor = {
  structure: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900",
  smc: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
  "supply-demand": "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
  liquidity: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900",
  candlestick: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900",
  pattern: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
};

export function MethodologyDocs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Methodology — Trading Concepts Used
        </CardTitle>
        <CardDescription>
          Every concept applied in this analysis, with educational explanation and concrete
          application notes. Click any concept to expand the full definition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["hh-hl-lh-ll"]} className="w-full">
          {METHODOLOGY.map((m) => {
            const Icon = catIcon[m.category];
            return (
              <AccordionItem key={m.id} value={m.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${catColor[m.category]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-medium text-sm">{m.term}</div>
                      <div className="text-xs text-muted-foreground">{catLabel[m.category]}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pl-11">
                  <p className="text-sm leading-relaxed">{m.long}</p>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Application to this XAU/USD setup
                    </div>
                    <p className="text-xs leading-relaxed">{m.application}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
