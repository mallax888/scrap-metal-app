import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Defaults to bottom-left, where it lands on top of the sidebar's user
    // chip. Moved rather than disabled so the dev tools stay available.
    position: "bottom-right",
  },

  /**
   * The old names for the two screens that kept being mistaken for each
   * other. Kept as redirects because links to them are already out in the
   * world — in shared demo links, in anyone's browser history, and in the
   * tour's own query strings.
   *
   * Temporary rather than permanent on purpose: a 308 is cached hard by
   * browsers, and this is a prototype whose names may yet move again.
   */
  async redirects() {
    return [
      { source: "/move", destination: "/cost-my-move", permanent: false },
      { source: "/my-move", destination: "/my-tenancy", permanent: false },
      /*
       * The plan moved to /plan so that /dashboard could stop being a place
       * anyone lands.
       *
       * It was the most-visited URL in the demo, which meant browsers
       * autocompleted to it and restored it on startup — so opening "the app"
       * meant opening a repayment schedule, past the front door, with no idea
       * what the product was. Nothing in the app ever navigated there; the
       * address bar did. Freeing the path is the only thing that could fix
       * that, since a redirect on a path the sidebar still uses would bounce
       * people out of the app mid-session.
       */
      { source: "/dashboard", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
