import type { Metadata } from 'next'

import { Footer } from '@layout'
import { QueryProvider, ThemeProvider } from '@providers'
import { Toaster } from '@shadcn'
import 'react-medium-image-zoom/dist/styles.css'

import './globals.css'

// metadata
export const metadata: Metadata = {
	title: 'Testing?',
	description: 'testing',
	icons: {
		icon: '/favicon.svg',
	},
}

// layout
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html suppressHydrationWarning lang='ru'>
			<head />

			<body className='min-h-screen antialiased flex flex-col'>
				<ThemeProvider>
					<QueryProvider>
						<main className='flex-1 min-w-0 justify-between items-stretch'>
							{children}

							<Toaster position='top-center' />
							<Footer />
						</main>
					</QueryProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
