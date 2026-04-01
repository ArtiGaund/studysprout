/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
      },
    experimental: {
        instrumentationHook: true,
    },
};

export default nextConfig;
