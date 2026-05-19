/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  // pdf-parse and @react-pdf/renderer are CJS — let Next.js trace them, don't externalize.
  serverExternalPackages: ['pdf-parse', '@react-pdf/renderer'],
}
export default nextConfig
