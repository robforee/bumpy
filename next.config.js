/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: false
    }
  },
  // Disable server logs in production
  onDemandEntries: {
    // Don't log page requests
    logPagesAutoCreation: false
  },
  // Disable request logs
  serverRuntimeConfig: {
    logging: false
  },
  // Custom webpack config to disable logs
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.infrastructureLogging = {
        level: 'error'
      }
    }
    return config
  }
}

export default nextConfig
