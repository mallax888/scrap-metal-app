import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-shimmer rounded-lg bg-sand", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-card border border-sand/70 bg-paper p-5 shadow-card sm:p-6",
        className
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}
