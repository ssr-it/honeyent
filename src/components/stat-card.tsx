import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info" | "destructive";
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneMap[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
