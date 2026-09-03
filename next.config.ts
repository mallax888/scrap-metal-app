import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Defaults to bottom-left, where it lands on top of the sidebar's user
    // chip. Moved rather than disabled so the dev tools stay available.
    position: "bottom-right",
  },
};

export default nextConfig;
