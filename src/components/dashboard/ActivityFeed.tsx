"use client";

import { Check, Sparkles, Target, Landmark, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TODAY, type ActivityItem, type ActivityKind } from "@/lib/data";
import { formatRelativeDay, money, points } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const ICONS: Record<ActivityKind, typeof Check> = {
  repayment: Check,
  extra: Plus,
  reward: Sparkles,
  fund: Target,
  bond: Landmark,
};

export function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = ICONS[item.kind];
  const positive = item.kind === "reward" && (item.points ?? 0) > 0;

  return (
    <li className="flex items-center gap-4 py-3.5">
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          item.kind === "repayment" || item.kind === "extra"
            ? "bg-moss-soft text-moss"
            : "bg-cream text-bark"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        {item.detail ? <p className="truncate text-xs text-mist">{item.detail}</p> : null}
      </div>
      <div className="shrink-0 text-right">
        {item.amount != null ? (
          <p className="numeric text-sm font-semibold text-ink">{money(item.amount)}</p>
        ) : null}
        {item.points != null ? (
          <p
            className={clsx(
              "numeric text-sm font-semibold",
              positive ? "text-moss" : "text-ink"
            )}
          >
            {item.points > 0 ? "+" : ""}
            {points(item.points)} pts
          </p>
        ) : null}
        <p className="text-xs text-mist">{formatRelativeDay(item.date, TODAY)}</p>
      </div>
    </li>
  );
}

export function ActivityFeed({
  limit = 4,
  kinds,
  title = "Recent activity",
  showLink = true,
}: {
  limit?: number;
  kinds?: ActivityKind[];
  title?: string;
  showLink?: boolean;
}) {
  const { derived, ready } = useLitchi();
  const items = (kinds ? derived.activity.filter((i) => kinds.includes(i.kind)) : derived.activity)
    .slice(0, limit);

  return (
    <Card className="flex h-full flex-col">
      <CardTitle>{title}</CardTitle>

      {!ready ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Check}
          title="Nothing here yet"
          description="Your payments and rewards will appear here as they happen."
        />
      ) : (
        <ul className="mt-3 divide-y divide-sand/70">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {showLink ? (
        <div className="mt-auto pt-5">
          <ButtonLink href="/payments" variant="secondary" className="w-full">
            View all activity
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
