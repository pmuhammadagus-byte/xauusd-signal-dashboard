"use client";

import { Badge } from "@/components/ui/badge";
import { DATA_FRESHNESS, type DataFreshnessType } from "@/lib/trade-plan";
import { Clock, Infinity as InfinityIcon, Radio, AlertTriangle, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<DataFreshnessType, typeof Clock> = {
  timeless: InfinityIcon,
  structural: RefreshCw,
  "time-sensitive": AlertTriangle,
  live: Radio,
};

export function DataFreshnessBadge({ type }: { type: DataFreshnessType }) {
  const info = DATA_FRESHNESS[type];
  const Icon = iconMap[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-[9px] font-semibold uppercase tracking-wider ${info.color} cursor-help`}>
            <Icon className="mr-1 h-2.5 w-2.5" />
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DataFreshnessLegend() {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-primary" />
        Data Freshness Legend
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        {(Object.keys(DATA_FRESHNESS) as DataFreshnessType[]).map((type) => {
          const info = DATA_FRESHNESS[type];
          const Icon = iconMap[type];
          return (
            <div key={type} className="flex items-start gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${info.color} shrink-0`}>
                <Icon className="h-3 w-3" />
              </span>
              <div>
                <div className="font-semibold">{info.label}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{info.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
