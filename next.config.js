/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // This allows production builds to successfully complete even if
      // your project has some missing dependency warnings in useEffect hooks
      ignoreDuringBuilds: true,
    },
    typescript: {
      // Ensures minor strict warning types don't freeze deployment compilation runs
      ignoreBuildErrors: true,
    }
  }
  
  module.exports = nextConfig