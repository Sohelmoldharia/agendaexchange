import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so Next doesn't get confused by a stray lockfile in
  // a parent directory (e.g. ~/package-lock.json).
  turbopack: { root: path.resolve() },
  // Allow the WSL/LAN IPs to use dev resources (HMR). localhost always works;
  // add your current WSL IP here if it changes, or just use localhost.
  allowedDevOrigins: ["172.27.40.54", "10.255.255.254"],
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
