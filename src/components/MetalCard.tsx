import { clsx } from "clsx";
import { Metal } from "@/lib/types";
import { hexToRgba } from "@/lib/color";

export function MetalCard({
  metal,
  className,
  children,
  intensity = "default",
}: {
  metal: Metal;
  className?: string;
  children: React.ReactNode;
  // "hero" is a stronger glow for standalone/primary cards (e.g. the price
  // ticker); "default" is calmer, for cards in a denser list.
  intensity?: "default" | "hero";
}) {
  const alphas =
    intensity === "hero"
      ? { border: 0.7, glow: 0.32, shadow: 0.5 }
      : { border: 0.4, glow: 0.24, shadow: 0.4 };

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border-2 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/30",
        className
      )}
      style={{
        borderColor: hexToRgba(metal.color, alphas.border),
        backgroundColor: "#1c1917",
        backgroundImage: `radial-gradient(circle at 10% -10%, ${hexToRgba(metal.color, alphas.glow)}, transparent 65%)`,
        boxShadow: `0 0 20px -10px ${hexToRgba(metal.color, alphas.shadow)}`,
      }}
    >
      {children}
    </div>
  );
}
