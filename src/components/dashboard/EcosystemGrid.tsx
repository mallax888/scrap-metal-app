"use client";

import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ecosystem } from "@/lib/data";
import { useLitchi } from "@/lib/store";

export function EcosystemGrid() {
  const { state, toggleWaitlist } = useLitchi();
  const toast = useToast();

  return (
    <section aria-labelledby="ecosystem-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ecosystem-heading" className="text-lg font-semibold tracking-tight text-ink">
            More from Litchi
          </h2>
          <p className="mt-1 text-sm text-mist">
            Bond Assist is the first product. Here{"’"}s what{"’"}s coming next.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ecosystem.map((product) => {
          const live = product.status === "live";
          const joined = state.waitlist.includes(product.id);

          return (
            <div
              key={product.id}
              className={clsx(
                "flex flex-col rounded-card border p-5 transition-shadow duration-300",
                live
                  ? "border-sand/70 bg-paper shadow-card"
                  : "border-dashed border-sand bg-canvas hover:shadow-card"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-ink">{product.name}</h3>
                {live ? (
                  <Badge tone="moss">
                    <Check className="h-3 w-3" aria-hidden />
                    Active
                  </Badge>
                ) : (
                  <Badge tone="outline">
                    <Lock className="h-3 w-3" aria-hidden />
                    {product.status === "soon" ? "Coming soon" : "Planned"}
                  </Badge>
                )}
              </div>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-mist">{product.blurb}</p>

              {live ? null : (
                <button
                  type="button"
                  onClick={() => {
                    toggleWaitlist(product.id);
                    toast(
                      joined
                        ? `Left the ${product.name} waitlist`
                        : `You${"’"}re on the ${product.name} waitlist`,
                      joined ? "info" : "success"
                    );
                  }}
                  className={clsx(
                    "mt-auto self-start rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    joined
                      ? "bg-cream text-bark hover:bg-sand"
                      : "border border-sand bg-paper text-bark hover:bg-cream"
                  )}
                >
                  {joined ? "On the waitlist ✓" : "Notify me"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
