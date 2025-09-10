import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true
    },
    output: 'standalone',
    staticPageGenerationTimeout: 1000,
    typescript: {
        ignoreBuildErrors: true
    },
    /* config options here */
    images: {
        domains: [
            'shop3.crbgroup.live',
            'lh3.googleusercontent.com',
            'dev-s3.sgp1.digitaloceanspaces.com',
            'ebaymmo-dev.sgp1.digitaloceanspaces.com',
            'encrypted-tbn0.gstatic.com',
            'static.ghost.org',
            'www.gravatar.com',
            'images.unsplash.com',
            'plus.unsplash.com',
            'blog.ebaymmo.shop',
            'user.ebaymmo.shop'
        ],

        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'dev-s3.sgp1.digitaloceanspaces.com',
                pathname: '/proxy-s3/**'
            },
            {
                protocol: 'https',
                hostname: 'ebaymmo-dev.sgp1.digitaloceanspaces.com',
                pathname: '/**'
            }
        ]
    },

    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Add experimental configuration
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb'
        }
    },

    // Configure compiler options
    compiler: {
        // Remove console.log in production
        removeConsole:
            process.env.NODE_ENV === 'production'
                ? {
                      exclude: ['error', 'warn']
                  }
                : false
    },

    // Configure headers for security
    headers: async () => [
        {
            source: '/(.*)',
            headers: [
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff'
                },
                {
                    key: 'X-Frame-Options',
                    value: 'DENY'
                },
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block'
                }
            ]
        }
    ],

    // Configure redirects
    redirects: async () => [],

    // Configure rewrites
    rewrites: async () => []
};

export default withNextIntl(nextConfig);
