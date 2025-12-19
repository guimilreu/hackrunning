/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'hack-running-app.s3.amazonaws.com',
      'hack-running-app.s3.sa-east-1.amazonaws.com',
      'images.unsplash.com', // Added for common placeholders
      'example.com', // Added for example images
      'localhost'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['recharts', 'mapbox-gl'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
