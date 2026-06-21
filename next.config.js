/** @type {import('next').NextConfig} */
const nextConfig = {
  /*──────── Build ─────────*/
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,

  reactStrictMode: true,
  compress: true,
  swcMinify: true,

  /*──────── Imagens ───────*/
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'files.stripe.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ]
  },

  /*──────── Qualidade ─────*/
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  /*──────── Modularização de ícones ─────*/
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}'
    }
  },

  /*──────── Webpack extra ─────*/
  webpack(config, { dev, isServer, webpack }) {
    // ignora locales do moment.js (caso apareça)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      })
    );

    // remove console.* do bundle client-prod (se terser estiver instalado)
    if (!dev && !isServer) {
      try {
        const TerserPlugin = require('terser-webpack-plugin');
        config.optimization.minimizer.push(
          new TerserPlugin({
            terserOptions: {
              compress: { drop_console: true },
              format: { comments: false }
            },
            extractComments: false
          })
        );
      } catch {
        /* plugin não instalado → ignora */
      }
    }

    return config;
  }
};

module.exports = nextConfig;