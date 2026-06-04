/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Allows Google Avatars to download safely
                pathname: '/**',
            },
        ],
      },
    experimental: {
        instrumentationHook: true,
        serverComponentsExternalPackages: ['pdfjs-dist'],
    },
};

export default nextConfig;
