import { renter } from "@/lib/data";

export function UserChip() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-sand/80 bg-canvas p-1.5 pr-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bark text-[13px] font-semibold text-cream">
        {renter.initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">
          {renter.displayName}
        </span>
        <span className="block text-xs text-mist">{renter.role}</span>
      </span>
    </div>
  );
}
