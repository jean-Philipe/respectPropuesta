/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Necesario para Netlify
  },
  // En producción, las APIs se llaman directamente a /api/ que Netlify enruta a las funciones
  // En desarrollo, usar el proxy si el backend está corriendo
  async rewrites() {
    // Solo en desarrollo, si hay un backend corriendo
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_BACKEND === 'true') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig

