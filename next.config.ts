import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El design system se distribuye como fuente (.tsx + CSS Modules).
  // Next no transpila node_modules por defecto.
  transpilePackages: ["@mn/design-system"],
};

export default nextConfig;
