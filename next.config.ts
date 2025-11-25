import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
    ],
    qualities: [100, 75],
  },
  
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'material-react-table'
    ],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          mui: {
            name: 'mui',
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          materialReactTable: {
            name: 'material-react-table',
            test: /[\\/]node_modules[\\/]material-react-table[\\/]/,
            chunks: 'all',
            priority: 9,
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
