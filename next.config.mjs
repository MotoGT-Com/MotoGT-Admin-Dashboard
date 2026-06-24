/** @type {import('next').NextConfig} */
const backendApiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.motogt.com/api";

const isDockerBuild = process.env.DOCKER_BUILD === "true";

const nextConfig = {
  ...(isDockerBuild ? { output: "standalone" } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
