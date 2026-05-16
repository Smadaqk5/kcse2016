import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent folder has a stray package-lock.json; without this, Turbopack treats
  // the monorepo parent as the app root and API routes 404.
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
