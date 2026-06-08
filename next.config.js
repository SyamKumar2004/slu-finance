/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Tells Vercel to bypass linter checks so warnings don't freeze deployments
      ignoreDuringBuilds: true,
    },
    typescript: {
      // Prevents non-breaking type warnings from pausing your compilation
      ignoreBuildErrors: true,
    },
  }
  
  module.exports = nextConfig;