import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
  async redirects() {
    // Land on the anime directory by default. FANDX still lives at /market,
    // /portfolio, /stock/*, /login, /admin, etc.
    return [{ source: "/", destination: "/anime", permanent: false }];
  },
};

export default nextConfig;
