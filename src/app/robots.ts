import type { MetadataRoute } from "next";

/**
 * Kept out of search results on purpose.
 *
 * This is a prototype of a consumer credit product, filled with figures for a
 * tenancy that does not exist. Indexed, it would surface as a real lender's
 * site to people searching for one — which is misleading regardless of what
 * the page itself says. Remove this when there is a real product behind it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
