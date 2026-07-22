import { clsx } from "clsx";
import { Metal } from "@/lib/types";

export function MetalLabel({
  metal,
  className,
}: {
  metal: Metal;
  className?: string;
}) {
  return (
    <span
      className={clsx("font-bold uppercase tracking-wide", className)}
      style={{ color: metal.color }}
    >
      {metal.label}
    </span>
  );
}

export function MetalSwatch({ metal, className }: { metal: Metal; className?: string }) {
  return (
    <span
      className={clsx("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: metal.color }}
    />
  );
}
