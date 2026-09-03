import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only route indicator renders bottom-left, directly on top of the
  // sidebar's user chip. Compile and runtime errors are still surfaced.
  devIndicators: false,
};

export default nextConfig;
