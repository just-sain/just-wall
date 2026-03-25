import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	turbopack: {
		rules: {
			'*.svg': {
				loaders: [
					{
						loader: '@svgr/webpack',
						options: {
							icon: true,
						},
					},
				],
				as: '*.js',
			},
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '9000',
				pathname: '/**',
			},
		],
	},
	async rewrites() {
		return [
			{
				source: '/api/files/:path*',
				destination: '/api/files/:path*',
			},
		]
	},
}

export default nextConfig
