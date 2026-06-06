import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
  async redirects() {
    // Two apps share this repo. The landing page is switchable:
    //   LANDING=fandx  → root serves the FANDX app (no redirect)
    //   (anything else / unset) → root redirects to the anime directory
    // The other app is always reachable at its own paths either way
    // (anime at /anime, FANDX at /market, /portfolio, /stock/*, /admin…).
    if (process.env.LANDING === "fandx") return [];
    return [{ source: "/", destination: "/anime", permanent: false }];
  },
};

export default nextConfig;
