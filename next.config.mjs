/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
      },
    experimental: {
        instrumentationHook: true,
        serverComponentsExternalPackages: ['pdfjs-dist'],
    },
};

export default nextConfig;
