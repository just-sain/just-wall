'use client'

import { useCallback, useEffect, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Button, Card, CardContent } from '@shadcn'
import type { WallpaperDetail } from '@types'
import { ArrowLeft, Download, Loader2, Plus, Tag as TagIcon } from 'lucide-react'

export default function WallpaperDetailPage() {
	const params = useParams()
	const slug = params.slug as string

	const [wallpaper, setWallpaper] = useState<WallpaperDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [downloading, setDownloading] = useState(false)

	useEffect(() => {
		async function fetchWallpaper() {
			try {
				const response = await fetch(`/api/wallpapers/${slug}`)

				if (!response.ok) {
					throw new Error('Wallpaper not found')
				}
				const data = await response.json()

				setWallpaper(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load wallpaper')
			} finally {
				setLoading(false)
			}
		}

		if (slug) {
			fetchWallpaper()
		}
	}, [slug])

	const handleDownload = useCallback(async () => {
		if (!wallpaper) return

		setDownloading(true)
		try {
			const link = document.createElement('a')

			link.href = wallpaper.originalUrl
			link.download = `${wallpaper.title}.${wallpaper.format}`
			link.target = '_blank'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		} catch (err) {
			console.error('Download failed:', err)
		} finally {
			setDownloading(false)
		}
	}, [wallpaper])

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	if (error || !wallpaper) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center gap-4'>
				<p className='text-muted-foreground'>{error || 'Wallpaper not found'}</p>
				<Link href='/'>
					<Button variant='outline'>Go Home</Button>
				</Link>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<header className='sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b'>
				<div className='container mx-auto px-4 py-3'>
					<div className='flex items-center gap-4'>
						<Link href='/admin/upload'>
							<Button size='icon' variant='ghost'>
								<Plus className='w-5 h-5' />
							</Button>
						</Link>
						<Link href='/'>
							<Button size='icon' variant='ghost'>
								<ArrowLeft className='w-5 h-5' />
							</Button>
						</Link>
						<h1 className='text-xl font-semibold truncate'>{wallpaper.title}</h1>
					</div>
				</div>
			</header>

			{/* Main content */}
			<div className='container mx-auto px-4 py-6'>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Image */}
					<div className='lg:col-span-2'>
						<div className='relative aspect-video rounded-lg overflow-hidden bg-muted'>
							<Image
								fill
								priority
								alt={wallpaper.title}
								className='object-contain'
								src={wallpaper.previewUrl || wallpaper.originalUrl}
							/>
						</div>
					</div>

					{/* Sidebar */}
					<div className='space-y-4'>
						{/* Download button */}
						<Button className='w-full' disabled={downloading} size='lg' onClick={handleDownload}>
							{downloading ? (
								<Loader2 className='w-5 h-5 mr-2 animate-spin' />
							) : (
								<Download className='w-5 h-5 mr-2' />
							)}
							Download Original
						</Button>

						{/* Info */}
						<Card>
							<CardContent className='pt-6 space-y-4'>
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<p className='text-muted-foreground'>Resolution</p>
										<p className='font-medium'>
											{wallpaper.width} × {wallpaper.height}
										</p>
									</div>
									<div>
										<p className='text-muted-foreground'>Format</p>
										<p className='font-medium uppercase'>{wallpaper.format}</p>
									</div>
									<div>
										<p className='text-muted-foreground'>Views</p>
										<p className='font-medium'>{wallpaper.viewsCount}</p>
									</div>
									<div>
										<p className='text-muted-foreground'>Downloads</p>
										<p className='font-medium'>{wallpaper.downloads}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Description */}
						{wallpaper.description && (
							<Card>
								<CardContent className='pt-6'>
									<h3 className='font-medium mb-2'>Description</h3>
									<p className='text-muted-foreground text-sm'>{wallpaper.description}</p>
								</CardContent>
							</Card>
						)}

						{/* Tags */}
						{wallpaper.tags.length > 0 && (
							<Card>
								<CardContent className='pt-6'>
									<h3 className='font-medium mb-3 flex items-center gap-2'>
										<TagIcon className='w-4 h-4' />
										Tags
									</h3>
									<div className='flex flex-wrap gap-2'>
										{wallpaper.tags.map((tag) => (
											<Link
												key={tag.id}
												className='px-3 py-1 text-sm rounded-full bg-muted hover:bg-muted/80 transition-colors'
												href={`/?tag=${tag.slug}`}
											>
												#{tag.name}
											</Link>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
