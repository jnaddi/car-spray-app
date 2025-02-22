import type { Configuration as WebpackConfig } from "webpack"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    // Suppress the punycode warning
    config.ignoreWarnings = [
      {
        module: /node_modules\/punycode/,
      },
    ]
    return config
  },
}

export default nextConfig

