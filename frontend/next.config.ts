const path = require('path');
import { Configuration as WebpackConfiguration } from 'webpack';
import { NextConfig } from 'next'; 
const BACKEND_API_URL_FOR_REWRITES = process.env.BACKEND_API_URL_FOR_REWRITES || 'https://docker-back-apdw.onrender.com/api';

interface NextWebpackOptions {
  buildId: string;
  dev: boolean;
  isServer: boolean;
  defaultLoaders: any;
  nextRuntime?: 'nodejs' | 'edge';
  webpack: any; 
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
  },
  images: {
    domains: ['utfs.io', 'localhost'],
  },
  async rewrites() {
   return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_API_URL_FOR_REWRITES}/:path*`,
      },
    ]
  },
  webpack: (
    config: WebpackConfiguration,
    options: NextWebpackOptions
  ): WebpackConfiguration => {    
    
    if (!config.resolve) {
      config.resolve = {};
    }
    
    if (
      typeof config.resolve.alias !== 'object' || 
      config.resolve.alias === null || 
      Array.isArray(config.resolve.alias)
    ) {
      config.resolve.alias = {};
    }

    const alias = config.resolve.alias as { [key: string]: string | string[] | false };
    alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
